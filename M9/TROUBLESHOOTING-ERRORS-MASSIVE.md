# Zadanie 8 — Troubleshooting: błędy niewidoczne podczas stress testu "massive"

## Objaw
Podczas stress testu *massive* dashboard błędów (panele filtrujące `http_status_code=~"5.."`)
NIE pokazywał żadnych błędów — mimo że system był ewidentnie przeciążony.

## Diagnoza (krok po kroku)

1. **Pipeline o11y jest zdrowy.** Jawne błędy z `/error`, `/inject-error`, `/products/999999999`
   poprawnie trafiają do Prometheusa z etykietą `http_status_code` i są widoczne w panelach
   (sprawdzone zapytaniem dashboardu). Czyli instrumentacja → kolektor → Prometheus → query → OK.

2. **Endpointy testu *massive* NIGDY nie generowały serwerowych 5xx.** W Prometheusie kody 5xx
   występowały tylko na trasach błędnych endpointów — nie na `/products` (GET/POST/DELETE),
   które uderza *massive*.

3. **Dlaczego?** Pod obciążeniem serwer NIE zwracał 5xx — *cicho degradował się*:
   - **Pula pg**: domyślnie `max=10`, `connectionTimeoutMillis=0` → zapytania kolejkowały się
     w nieskończoność zamiast zawodzić.
   - **Synchroniczne logowanie**: `console.log(JSON.stringify(...))` na KAŻDY log (a logujemy
     każde żądanie) blokowało event-loop. Pomiar: pod obciążeniem 400 req/s latencja spadła z
     **~860 ms → ~10 ms** po wyłączeniu tego `console.log`.
   - Efekt: przeciążenie objawiało się jako **awarie połączeniowe po stronie klienta**
     (ECONNRESET / ETIMEDOUT / connect-timeout), a te NIE tworzą metryki
     `http_server_duration` z kodem 5xx. Panele błędów nie miały więc czego pokazać.

   To kluczowy wniosek: **awarie na poziomie połączeń/akceptacji TCP są architektonicznie
   niewidoczne** dla paneli opartych o kody HTTP. Trzeba sprawić, by przeciążenie stało się
   prawidłowym serwerowym **5xx**.

## Fix (`M9/o11y-full/products-api/src/`)

1. **`logger.ts`** — synchroniczny `console.log(JSON.stringify(...))` per-request schowany za
   `CONSOLE_LOG=1` (domyślnie OFF). Logi i tak płyną do Loki przez OTel. Event-loop przestaje
   być blokowany → serwer pozostaje responsywny pod obciążeniem.

2. **`index.ts`** — **load shedding**: synchroniczny licznik równoczesnych żądań na wejściu;
   gdy `in-flight > MAX_INFLIGHT`, nadmiar jest natychmiast odrzucany kodem **503**. Sprawdzenie
   jest SYNCHRONICZNE (działa nawet pod presją event-loopu, w przeciwieństwie do timera).

3. **`database.ts`** — pula pg z `connectionTimeoutMillis` (fail-fast, gdy pula wysycona → 500)
   i jawnie ograniczonym `max` (saturacja osiągalna, nadmiar shed-owany jako 503 zamiast
   kolejkowany w nieskończoność).

> Wartości (`max`, `MAX_INFLIGHT`) dobrane tak, by saturację dało się pokazać na tej maszynie
> bez przewracania event-loopu/Colimy pełnym testem *massive* (25k VU).

## Weryfikacja

Burst równoczesnych żądań na ciężki `/products` → serwer zwraca **503** (load shedding):
```
products burst (25 równoczesnych ×6): {200: 112, 503: 38}
```
503 zapisane w Prometheusie i widoczne w zapytaniach dashboardu (route="All"):
```
Error Count by Status Code:  status=503  ~0.13/s
Error Rate:                  25.33 %
```
→ **Błędy są teraz widoczne w Grafanie** (panele *Error Rate*, *Error Count by Status Code*).

> Uwaga: 503 z load-sheddingu nie ma etykiety `http_route` (odrzucenie następuje przed routingiem),
> więc w panelu *Error Count by Route* pojawia się pod pustą trasą. Panele *Error Rate* i
> *Error Count by Status Code* (domyślny filtr "All" = `.*`) pokazują je poprawnie.
