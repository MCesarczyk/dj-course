#!/usr/bin/env bash
#
# generate-traffic.sh — sztuczny ruch dla products-api (zasila metryki/trace'y/logi).
#
# Uderza w realne endpointy aplikacji z wagami zbliżonymi do "produkcyjnych":
# dużo odczytów, trochę zapisów, sporadyczne błędy (4xx/5xx). Każde zapytanie
# generuje span HTTP (instrumentation-http) oraz — dla tras dotykających bazy —
# metryki/spany PG (instrumentation-pg).
#
# DWA TRYBY:
#   host       (domyślny) — curl z hosta na BASE_URL. UWAGA: jeśli port 3000 jest
#              zajęty przez inny proces (np. dev server Vite na 127.0.0.1:3000),
#              ruch trafi tam, a NIE do kontenera — metryki HTTP będą puste!
#   docker     — pętla wget URUCHAMIANA WEWNĄTRZ kontenera (docker compose exec).
#              Omija wszelkie konflikty portów hosta. Najpewniejsza opcja.
#
# Użycie:
#   ./generate-traffic.sh --docker                 # ruch z wnętrza kontenera (zalecane)
#   ./generate-traffic.sh                          # ruch z hosta na localhost:3000
#   RPS=20 ./generate-traffic.sh --docker
#   DURATION=120 ./generate-traffic.sh --docker    # zatrzymaj po 120 s
#   CONCURRENCY=4 RPS=40 ./generate-traffic.sh --docker
#   BASE_URL=http://192.168.0.151:3000 ./generate-traffic.sh   # host, z pominięciem Vite (LAN IP)
#
set -u

MODE=host
case "${1:-}" in
  --docker|-d) MODE=docker ;;
  --host|-h)   MODE=host ;;
  "")          : ;;
  *) echo "Nieznany argument: $1 (użyj --docker lub --host)"; exit 1 ;;
esac

BASE_URL="${BASE_URL:-http://localhost:3000}"
RPS="${RPS:-5}"               # docelowa liczba żądań na sekundę (łącznie)
CONCURRENCY="${CONCURRENCY:-2}"
DURATION="${DURATION:-0}"     # 0 = bez limitu (do Ctrl-C)
MAX_PRODUCT_ID="${MAX_PRODUCT_ID:-10000}"
MAX_CATEGORY_ID="${MAX_CATEGORY_ID:-20}"
SERVICE="${SERVICE:-products-api}"   # nazwa serwisu w docker compose (tryb --docker)

# odstęp między żądaniami w obrębie jednego workera (s), aby trzymać ~RPS łącznie
sleep_per_req=$(awk -v r="$RPS" -v c="$CONCURRENCY" 'BEGIN{ s=c/r; if(s<0) s=0; printf "%.4f", s }')

# ----------------------------------------------------------------------------
# TRYB DOCKER: generujemy samodzielny skrypt sh (busybox + wget) i odpalamy go
# wewnątrz kontenera. Brak zależności od sieci hosta / portu 3000.
# ----------------------------------------------------------------------------
if [ "$MODE" = docker ]; then
  echo "Tryb: docker (wewnątrz kontenera '$SERVICE') | RPS≈$RPS | concurrency=$CONCURRENCY | duration=${DURATION}s (0=∞)"
  echo "Ctrl-C aby zatrzymać."
  docker compose exec -T \
    -e RPS="$RPS" -e CONCURRENCY="$CONCURRENCY" -e DURATION="$DURATION" \
    -e MAXP="$MAX_PRODUCT_ID" -e MAXC="$MAX_CATEGORY_ID" -e SLEEP="$sleep_per_req" \
    "$SERVICE" sh -s <<'INNER'
end=0; [ "$DURATION" -gt 0 ] && end=$(( $(date +%s) + DURATION ))
worker() {
  while :; do
    [ "$DURATION" -gt 0 ] && [ "$(date +%s)" -ge "$end" ] && break
    r=$(( RANDOM % 100 ))
    if   [ "$r" -lt 28 ]; then wget -qO- "http://localhost:3000/products" >/dev/null 2>&1
    elif [ "$r" -lt 50 ]; then wget -qO- "http://localhost:3000/products/$((RANDOM%MAXP+1))" >/dev/null 2>&1
    elif [ "$r" -lt 62 ]; then wget -qO- "http://localhost:3000/top/products-by-category/$((RANDOM%MAXC+1))" >/dev/null 2>&1
    elif [ "$r" -lt 72 ]; then wget -qO- "http://localhost:3000/top/customers-by-total-spent" >/dev/null 2>&1
    elif [ "$r" -lt 80 ]; then wget -qO- "http://localhost:3000/orders/delivered" >/dev/null 2>&1
    elif [ "$r" -lt 85 ]; then wget -qO- --post-data='{"name":"lt","price":9,"category_id":1}' --header='Content-Type: application/json' "http://localhost:3000/products" >/dev/null 2>&1
    elif [ "$r" -lt 95 ]; then wget -qO- "http://localhost:3000/inject-error" >/dev/null 2>&1   # losowy 4xx/5xx (~10%)
    else wget -qO- "http://localhost:3000/error" >/dev/null 2>&1                                  # zawsze 500 (~5%)
    fi
    [ "$(echo "$SLEEP>0" | awk '{print ($1>0)}')" = 1 ] && sleep "$SLEEP"
  done
}
i=1; while [ "$i" -le "$CONCURRENCY" ]; do worker & i=$((i+1)); done
trap 'kill 0 2>/dev/null' INT TERM
wait
INNER
  exit 0
fi

# ----------------------------------------------------------------------------
# TRYB HOST: curl z hosta.
# ----------------------------------------------------------------------------
curl_opts=(--silent --output /dev/null --max-time 10 -w '%{http_code}')
rand() { echo $(( RANDOM % $1 + 1 )); }

hit() {
  local roll=$(( RANDOM % 100 ))
  local method path code body
  if   [ "$roll" -lt 28 ]; then method=GET;    path="/products"
  elif [ "$roll" -lt 50 ]; then method=GET;    path="/products/$(rand "$MAX_PRODUCT_ID")"
  elif [ "$roll" -lt 62 ]; then method=GET;    path="/top/products-by-category/$(rand "$MAX_CATEGORY_ID")"
  elif [ "$roll" -lt 72 ]; then method=GET;    path="/top/customers-by-total-spent"
  elif [ "$roll" -lt 80 ]; then method=GET;    path="/orders/delivered"
  elif [ "$roll" -lt 85 ]; then method=POST;   path="/products"
  elif [ "$roll" -lt 95 ]; then method=GET;    path="/inject-error"   # losowy 4xx/5xx (~10%)
  else                         method=GET;      path="/error"          # zawsze 500 (~5%)
  fi

  case "$method" in
    POST)
      body='{"name":"loadtest-'"$RANDOM"'","price":'"$(rand 500)"',"stock":'"$(rand 100)"',"category_id":'"$(rand "$MAX_CATEGORY_ID")"'}'
      code=$(curl "${curl_opts[@]}" -X POST -H 'Content-Type: application/json' -d "$body" "$BASE_URL$path") ;;
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
    awk -v s="$sleep_per_req" 'BEGIN{ if (s>0) system("sleep " s) }'
  done
}

echo "Tryb: host -> $BASE_URL | RPS≈$RPS | concurrency=$CONCURRENCY | duration=${DURATION}s (0=∞)"
echo "UWAGA: jeśli port 3000 jest zajęty przez inny proces, ruch NIE dotrze do kontenera."
echo "Ctrl-C aby zatrzymać."

start=$(date +%s); end=0
[ "$DURATION" -gt 0 ] && end=$(( start + DURATION ))

pids=()
trap 'echo; echo "Zatrzymuję..."; kill "${pids[@]}" 2>/dev/null; exit 0' INT TERM
for _ in $(seq 1 "$CONCURRENCY"); do
  worker "$end" &
  pids+=("$!")
done
wait
