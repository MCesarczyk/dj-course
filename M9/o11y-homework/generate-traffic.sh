#!/usr/bin/env bash
#
# generate-traffic.sh — sztuczny ruch dla products-api (zasila metryki/trace'y/logi).
#
# Uderza w realne endpointy aplikacji z wagami zbliżonymi do "produkcyjnych":
# dużo odczytów, trochę zapisów, sporadyczne błędy (4xx/5xx). Każde zapytanie
# generuje span HTTP (instrumentation-http) oraz — dla tras dotykających bazy —
# metryki/spany PG (instrumentation-pg). Bez zależności: tylko bash + curl.
#
# Użycie:
#   ./generate-traffic.sh                 # ciągły ruch, ~5 req/s, do Ctrl-C
#   RPS=20 ./generate-traffic.sh          # ~20 żądań na sekundę
#   DURATION=120 ./generate-traffic.sh    # zatrzymaj się po 120 s
#   CONCURRENCY=4 RPS=40 ./generate-traffic.sh
#   BASE_URL=http://localhost:3000 ./generate-traffic.sh
#
set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
RPS="${RPS:-5}"               # docelowa liczba żądań na sekundę (łącznie)
CONCURRENCY="${CONCURRENCY:-2}"
DURATION="${DURATION:-0}"     # 0 = bez limitu (do Ctrl-C)
MAX_PRODUCT_ID="${MAX_PRODUCT_ID:-10000}"
MAX_CATEGORY_ID="${MAX_CATEGORY_ID:-20}"

# odstęp między żądaniami w obrębie jednego workera (s), aby trzymać ~RPS łącznie
sleep_per_req=$(awk -v r="$RPS" -v c="$CONCURRENCY" 'BEGIN{ s=c/r; if(s<0) s=0; printf "%.4f", s }')

curl_opts=(--silent --output /dev/null --max-time 10 -w '%{http_code}')

rand() { echo $(( RANDOM % $1 + 1 )); }

# Pojedyncze żądanie wg losowej wagi. Wypisuje "METHOD PATH -> CODE".
hit() {
  local roll=$(( RANDOM % 100 ))
  local method path code body
  if   [ "$roll" -lt 30 ]; then method=GET;    path="/products"
  elif [ "$roll" -lt 55 ]; then method=GET;    path="/products/$(rand "$MAX_PRODUCT_ID")"
  elif [ "$roll" -lt 68 ]; then method=GET;    path="/top/products-by-category/$(rand "$MAX_CATEGORY_ID")"
  elif [ "$roll" -lt 78 ]; then method=GET;    path="/top/customers-by-total-spent"
  elif [ "$roll" -lt 85 ]; then method=GET;    path="/orders/delivered"
  elif [ "$roll" -lt 90 ]; then method=POST;   path="/products"
  elif [ "$roll" -lt 93 ]; then method=DELETE; path="/products/$(rand "$MAX_PRODUCT_ID")"
  elif [ "$roll" -lt 98 ]; then method=GET;    path="/inject-error"   # losowy 4xx/5xx
  else                         method=GET;      path="/error"          # zawsze 500
  fi

  case "$method" in
    POST)
      body='{"name":"loadtest-'"$RANDOM"'","price":'"$(rand 500)"',"stock":'"$(rand 100)"',"category_id":'"$(rand "$MAX_CATEGORY_ID")"'}'
      code=$(curl "${curl_opts[@]}" -X POST -H 'Content-Type: application/json' -d "$body" "$BASE_URL$path") ;;
    DELETE)
      code=$(curl "${curl_opts[@]}" -X DELETE "$BASE_URL$path") ;;
    *)
      code=$(curl "${curl_opts[@]}" "$BASE_URL$path") ;;
  esac
  printf '%s %-45s -> %s\n' "$method" "$path" "${code:-ERR}"
}

worker() {
  local end="$1"
  while :; do
    [ "$DURATION" -gt 0 ] && [ "$(date +%s)" -ge "$end" ] && break
    hit
    # sleep ułamkowy działa w bash/zsh dla floatów
    awk -v s="$sleep_per_req" 'BEGIN{ if (s>0) system("sleep " s) }'
  done
}

echo "Target: $BASE_URL | RPS≈$RPS | concurrency=$CONCURRENCY | duration=${DURATION}s (0=∞)"
echo "Ctrl-C aby zatrzymać."

start=$(date +%s)
end=0
[ "$DURATION" -gt 0 ] && end=$(( start + DURATION ))

# sprzątanie tła przy Ctrl-C
pids=()
trap 'echo; echo "Zatrzymuję..."; kill "${pids[@]}" 2>/dev/null; exit 0' INT TERM

for _ in $(seq 1 "$CONCURRENCY"); do
  worker "$end" &
  pids+=("$!")
done

wait
