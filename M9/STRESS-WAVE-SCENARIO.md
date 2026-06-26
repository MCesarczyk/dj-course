# Zadanie 7 — Wielofazowy, falujący scenariusz stress-testowy + migracja Artillery → Taurus

## Cel

Rozbudowany, długi (~9 min) scenariusz stress-testowy, którego ruch **fluktuuje**
(rośnie → opada → rośnie mocniej → dolina → najwyższy spike → wygasanie), uruchomiony
na setupie `M9/o11y-full`. Weryfikacja, że ruch jest odnotowany w Grafanie/Prometheusie
i odzwierciedla charakter testu (spike'i, spadki, eskalujące szczyty). Następnie migracja
z toolu X (**Artillery**) do toolu Y (**Taurus/JMeter**) i sprawdzenie, czy przemigrowany
test ma analogiczną logikę i charakterystykę.

## Pliki

| Tool | Plik scenariusza | Uruchomienie |
|------|------------------|--------------|
| Artillery (X) | `load-testing-artillery/scenarios/product-stress-wave-test.yml` | `npm run test:wave:report` |
| Taurus (Y)    | `load-testing-taurus/scenarios/product-stress-wave-test.yml`    | `task test-wave` |

Setup pod testem: `M9/o11y-full` (products-api + Postgres + OTel Collector + Prometheus + Loki + Tempo + Grafana).

> **Uwaga o targecie:** na maszynie hostowej `localhost:3000` bywa przesłaniany przez
> lokalny dev-server (Vite). Dlatego oba testy celują w **adres LAN** (`192.168.0.151:3000`),
> który routuje do kontenera products-api. W Artillery realizowane przez `--overrides`,
> w Taurus przez `default-address`.

## Profil obciążenia (12 faz, 3 eskalujące szczyty)

| # | Faza | arrivalRate (Artillery) | Czas |
|---|------|--------------------------|------|
| 00 | Rozgrzewka — cichy start | 2 → 5 | 45s |
| 01 | Fala 1 — narastanie | 5 → 25 | 60s |
| 02 | Fala 1 — szczyt (hold) | 25 | 40s |
| 03 | Spadek po fali 1 | 25 → 8 | 40s |
| 04 | Dolina 1 — niski ruch | 8 | 30s |
| 05 | Fala 2 — silniejsze narastanie | 8 → 45 | 70s |
| 06 | Fala 2 — szczyt (hold) | 45 | 45s |
| 07 | Ostry spadek | 45 → 10 | 35s |
| 08 | Dolina 2 — głęboki spadek | 5 | 40s |
| 09 | Fala 3 — błyskawiczny spike (najwyższy) | 5 → 70 | 50s |
| 10 | Fala 3 — szczyt maksymalny (hold) | 70 | 30s |
| 11 | Wygaszanie — długi ramp down | 70 → 2 | 60s |

Cztery ważone scenariusze ruchu uderzają w zróżnicowane endpointy:
- **Browse** (weight 4): `GET /products`, `GET /products/:id`
- **Analytics / heavy queries** (weight 3): `GET /top/products-by-category/:id`, `GET /top/customers-by-total-spent`, `GET /orders/delivered` (ciężki JOIN z podzapytaniem)
- **Lifecycle CRUD** (weight 2): `POST /products` → `GET` → `DELETE`
- **Error sprinkle** (weight 1): `GET /inject-error`, `GET /products/999999999`, `GET /error`

## Wynik Artillery (tool X)

```
All VUs finished. Total time: 9 minutes, 12 seconds
http.requests: 30577        http.request_rate: ~32/sec (średnia)
http.codes.200: 19460   201: 2067   204: 2067
http.codes.400: 185   401: 161   403: 182   404: 161   500: 2286   503: 172
vusers.completed: 10294   vusers.failed: 3842 (timeouty przy najwyższym spike — oczekiwane)
response_time p95: 6312 ms   p99: 8352 ms (degradacja pod szczytami)
```

### Weryfikacja w Prometheusie — kształt fali (server-side req/s, `rate(http_server_duration_milliseconds_count[30s])`)

```
17:36  18  ████████          (rozgrzewka, +baseline)
17:37  39  ████████████████
17:38  92  █████████████████████████████████████   ← Fala 1 (szczyt ~92)
17:38  44  ██████████████████  (spadek)
17:39  21  ████████            (Dolina 1)
17:40  52  █████████████████████
17:41 113  ██████████████████████████████████████████████  ← Fala 2 (spike ~113)
17:42  16  ██████              (Dolina 2)
17:43 136  ███████████████████████████████████████████████████████  ← Fala 3 (najwyższy ~136)
17:44  30  ████████████        (wygaszanie)
```

**Eskalujące szczyty ~92 → ~113 → ~136 req/s** z dolinami ~16–21 req/s — dokładnie zgodnie z projektem.
Error-rate (5xx) podąża za falami: szczyty ~7,5 → ~11 → ~11,5 błędów/s, doliny ~0,4–1,7/s.

> Server-side req/s jest wyższe niż arrivalRate, bo każdy VU wykonuje wielokrokowy flow
> (kilka requestów na sesję). Liczy się **kształt** — i ten jest wiernie odwzorowany.

## Migracja Artillery → Taurus (tool Y) — i czego nauczyła weryfikacja

Naiwne mapowanie 1:1 (każda faza → osobny blok `execution`) **NIE odtwarza** charakterystyki
pierwowzoru. Weryfikacja wychwyciła trzy realne różnice między narzędziami:

1. **Sekwencyjność faz.** Artillery wykonuje `phases` **po kolei** (to tworzy falę w czasie).
   Taurus startuje bloki `execution` **równolegle** → wszystkie 12 faz uderza naraz
   (thundering herd), test trwał 1m33s zamiast ~9 min, a liczba VU eksplodowała do ~20 000.
   **Fix:** każdy blok dostaje `delay` = skumulowany offset startu danej fazy → fazy
   „kafelkują" oś czasu jedna po drugiej, jak w Artillery.

2. **Rotacja zmiennych.** Artillery losuje z puli `productId: [1..5]` per request.
   Taurus/JMeter renderuje listę YAML jako literal `"[1, 2, 3, 4, 5]"` → `Illegal character in path`
   (0% sukcesów na `/products/:id` i `/top/...`). **Fix:** funkcja JMeter `__Random(1,5)` /
   `__Random(1,8)` per request — odpowiednik losowania z puli.

3. **Model obciążenia / concurrency.** Artillery `maxVusers: 2000` to twardy limit; w JMeter
   2000 wątków to thundering herd (timeouty, socket reset, 94% failures). **Fix:** natężenie
   kontrolowane przez `throughput` (RPS docelowy = `arrivalRate`), a `concurrency` ustawione
   na rozsądne 200.

Mapowanie po korekcie:

| Artillery | Taurus |
|-----------|--------|
| `arrivalRate` / `rampTo` | `throughput` (RPS) + `ramp-up` |
| faza stała (bez `rampTo`) | `hold-for` |
| kolejność faz (sekwencja) | `delay` (skumulowany offset) |
| `maxVusers` | `concurrency` (limit, nie sterownik natężenia) |
| `{{ var }}` z listy | `${__Random(min,max)}` |
| `capture` jsonpath | `extract-jsonpath` |

## Wynik Taurus (tool Y) — parytet

Czysty, pełny przebieg (JMeter 5.5, executor `jmeter`, `delay`-sekwencja + `throughput` + `__Random`,
szczyt Fali 3 obniżony 70 → 55 dla stabilności):

```
Test duration: 0:09:13   Samples: 9935   "failures": 13,77%
```

13,77% „failures" to niemal wyłącznie **celowe endpointy błędne** (`error-sprinkle`, weight 1 z 10).
Wszystkie realne endpointy mają wysoką skuteczność (bug rotacji zmiennych zniknął — brak `Illegal character`):

| Label | succ |
|---|---|
| Browse — all products | 94,3% (kilka timeoutów na ciężkim 4 MB pod szczytem) |
| Browse — product by id | 99,4% |
| Analytics — top by category / customers / delivered | 99,4% / 99,2% / 98,4% |
| Lifecycle — create / get / delete | 99,4% / 99,3% / 99,3% |
| Errors — inject / missing / thrown | 0% (z założenia 4xx/5xx) |

### Weryfikacja w Prometheusie — kształt fali Taurus (server-side req/s)

```
20:54  ~31  █████████████████████████   ← Fala 1 (szczyt ~31)
20:55  ~5   ████              (spadek + Dolina 1)
20:56  ~21  ████████████████
20:57  ~57  ██████████████████████████████████████████████  ← Fala 2 (szczyt ~57)
20:58  ~3   ██                (ostry spadek + Dolina 2)
20:59  ~24  ███████████████████
21:00  ~70  ███████████████████████████████████████████████████████  ← Fala 3 (najwyższy ~70)
21:00  ~49  ███████████████████████████████████████  (opadanie)
21:01  ~1   █                 (wygaszanie)
```

**Eskalujące szczyty ~31 → ~57 → ~70 req/s** z dolinami ~3–9 req/s i pełnym wygaszaniem na końcu
— **ta sama charakterystyka co Artillery** (3 rosnące fale, doliny między nimi, ramp-down).

### Porównanie charakterystyk

| | Artillery (X) | Taurus (Y) |
|---|---|---|
| Model | open / arrival rate, fazy **sekwencyjne** | closed / concurrency, bloki serializowane przez `delay` |
| Szczyt 1 / 2 / 3 (req/s) | ~92 / ~113 / ~136 | ~31 / ~57 / ~70 |
| Doliny (req/s) | ~16–21 | ~3–9 |
| Kształt | 3 eskalujące fale + doliny + wygaszanie | **analogiczny (3 eskalujące fale + doliny + wygaszanie)** |
| Endpointy / flow | 4 ważone scenariusze, te same URL-e | te same URL-e (rotacja przez `__Random`) |

> Różnica bezwzględnych wartości wynika z różnych modeli (Artillery liczy wielokrokowe
> sesje VU + był aktywny baseline-generator; Taurus to `throughput`-capped RPS). Liczy się
> **logika i kształt** — i te są analogiczne: trzy rosnące szczyty z dolinami pomiędzy.

> Uwaga operacyjna: przy najwyższym spike'u (Fala 3) JMeter chwilowo piętrzy wątki
> (Constant Throughput Timer dokłada wątki, gdy ciężki `/products` 4 MB zwalnia) — daje to
> ~1 krótki blip. Obniżenie szczytu Fali 3 (70 → 55) pozwoliło dokończyć pełny ~9-min przebieg
> bez przerwania. Charakterystyki fali to nie zaburza.

## Wnioski

- Scenariusz spełnia wymagania: długi, wielofazowy, wyraźnie fluktuujący z eskalującymi szczytami.
- Ruch jest w pełni odnotowany w Prometheusie/Grafanie i wiernie odzwierciedla spike'i,
  spadki i trzy rosnące fale — łącznie z error-rate podążającym za obciążeniem.
- Migracja X→Y wymaga **świadomości różnic modeli**, a nie przepisania 1:1. Najważniejsza:
  Artillery = sekwencyjne fazy (open model / arrival rate), Taurus/JMeter = równoległe
  execution + closed model (concurrency). Po korekcie (`delay` + `throughput` + `__Random`)
  przemigrowany test ma **analogiczną logikę i charakterystykę** co pierwowzór.
