# TerraEye — Domain Storytelling & Wardley Map
**Kontekst: SaaS dla branży eksploracji mineralnej | 2025**
*Szczegóły techniczne ML oraz nazwy konkretnych minerałów uogólnione celowo.*

---

# CZĘŚĆ 1 — DOMAIN STORYTELLING

## Aktorzy i artefakty

```
AKTORZY                          ARTEFAKTY (work objects)
──────────────────────────────   ──────────────────────────────────────
👤 Klient (Mining Company)        📍 Area of Interest (AOI)
👥 ML Engineers (TerraEye)        🛰️  Zdjęcia hiperspektralne (raw)
🔬 Geolog (TerraEye, QA)          🗺️  Mapa mineralizacji (ML output)
🛰️  Dostawcy danych satelit.       📊 Warstwy GIS (GeoTIFF/GeoJSON/KMZ)
   (Sentinel Hub, Wyvern, EMIT)   💻 Aplikacja webowa (viewer)
👷 Zespół terenowy (klienta)       📁 Plik do pobrania (QGIS-ready)
                                  🚩 Decyzja eksploracyjna
```

---

## SCENA 1 — Zamówienie obszaru

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 Klient (Mining Co.)                                         │
│       │                                                         │
│       │  (1) definiuje i przesyła ──→  📍 Area of Interest      │
│       │      [współrzędne, priorytet,       (polygon na mapie)  │
│       │       typ minerałów]                     │              │
│       │                                          │              │
│       │                               (2) trafia do ──→ 💻 sys. │
│       │                                   TerraEye              │
└─────────────────────────────────────────────────────────────────┘
```

**Historia:**
> Klient z branży wydobywczej identyfikuje obszar geograficzny potencjalnie bogaty w złoża. Przesyła do TerraEye zapytanie z określonym obszarem zainteresowania (AOI) i typem poszukiwanych surowców. To zdarzenie uruchamia cały dalszy pipeline.

---

## SCENA 2 — Pozyskanie danych satelitarnych

```
┌─────────────────────────────────────────────────────────────────┐
│  💻 System TerraEye                                             │
│       │                                                         │
│       │  (3) zamawia pokrycie ──→ 🛰️  Dostawcy danych           │
│       │      AOI                     (Sentinel Hub,             │
│       │                              Wyvern, EMIT)              │
│       │                                   │                     │
│       │  (4) otrzymuje ←────────── 🛰️  Zdjęcia hiperspektralne  │
│       │      surowe dane               (raw, multi-band)        │
│       │                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Historia:**
> System automatycznie odpytuje dostawców danych satelitarnych o pokrycie zamówionego obszaru. Różni dostawcy oferują różne rozdzielczości spektralne i czasowe — wybór zależy od dostępności i charakterystyki obszaru. Dane wracają jako wielokanałowe obrazy hiperspektralne.

*[Szczegóły algorytmu selekcji dostawców — pominięte]*

---

## SCENA 3 — Przetwarzanie ML

```
┌─────────────────────────────────────────────────────────────────┐
│  👥 ML Engineers / Pipeline                                     │
│       │                                                         │
│       │  (5) uruchamiają ──→ ⚙️  ML Pipeline                    │
│       │      pipeline na       (proprietary algorithms)         │
│       │      surowych danych        │                           │
│       │                             │                           │
│       │  (6) pipeline przetwarza ───┘                           │
│       │      i produkuje ──→ 🗺️  Mapa mineralizacji             │
│       │                         (warstwy z prawdopodobień-      │
│       │                          stwem wystąpienia surowców)    │
│       │                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Historia:**
> ML Engineers uruchamiają własnościowe pipeline'y przetwarzające dane hiperspektralne. Algorytmy — trenowane przez lata na danych referencyjnych — rozpoznają charakterystyczne sygnatury spektralne odpowiadające różnym związkom mineralnym. Wynikiem jest mapa przestrzennego rozkładu prawdopodobieństwa wystąpienia surowców.

*[Architektura modeli ML, nazwy konkretnych minerałów, metryki dokładności — pominięte]*

---

## SCENA 4 — QA Geologa

```
┌─────────────────────────────────────────────────────────────────┐
│  🔬 Geolog (TerraEye)                                           │
│       │                                                         │
│       │  (7) weryfikuje ──→ 🗺️  Mapa mineralizacji              │
│       │      wyrywkowo        (sprawdza anomalie,               │
│       │                        spójność z wiedzą geo)           │
│       │                                                         │
│       ├── [ścieżka A: dane OK] ──────────────────────────────┐  │
│       │     (8a) zatwierdza ──→ ✅ Mapa zatwierdzona         │  │
│       │                                                      │  │
│       └── [ścieżka B: anomalia / dane niestandardowe]        │  │
│             (8b) pobiera ──→ 📁 Dane uzupełniające (ręcznie) │  │
│             (8c) koryguje ──→ 🗺️  Mapa (poprawiona)          │  │
│             (8d) zatwierdza ──→ ✅ Mapa zatwierdzona ────────┘  │
│                                                                 │
│  ⚠️  Cel: pełna automatyzacja tej sceny (ścieżka B → zanik)     │
└─────────────────────────────────────────────────────────────────┘
```

**Historia:**
> Geolog przeprowadza wyrywkową kontrolę jakości wyników ML. W typowym przypadku weryfikuje próbkę danych pod kątem zgodności z wiedzą domenową. W sytuacjach anomalnych (niestandardowe warunki terenowe, brakujące pasma spektralne) ręcznie pobiera i dołącza dane uzupełniające, po czym koryguje wynik. Docelowo ta scena ma zostać w pełni zautomatyzowana.

---

## SCENA 5 — Publikacja warstw w aplikacji

```
┌─────────────────────────────────────────────────────────────────┐
│  💻 System TerraEye                                             │
│       │                                                         │
│       │  (9) publikuje ──→ 📊 Warstwy GIS                       │
│       │      w aplikacji      (GeoTIFF, GeoJSON, KMZ)           │
│       │                           │                             │
│       │                           ↓                             │
│       │                      💻 Aplikacja webowa                │
│       │                         (viewer 2D/3D)                  │
│       │                         gotowa dla klienta              │
└─────────────────────────────────────────────────────────────────┘
```

---

## SCENA 6 — Eksploracja przez klienta

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 Klient (Mining Co.)                                         │
│       │                                                         │
│       │  (10) loguje się ──→ 💻 Aplikacja webowa                │
│       │       i eksploruje       (widok 2D / 3D)                │
│       │       warstwy            ├─ nakładki mineralizacji      │
│       │                         ├─ ortofoto / teren             │
│       │                         └─ zarządzanie warstwami        │
│       │                                                         │
│       ├── [ścieżka A: analiza w app]                            │
│       │     (11a) interpretuje ──→ 🗺️  Warstwy mineralizacji    │
│       │           obszary zainteresowania bezpośrednio w UI     │
│       │                                                         │
│       └── [ścieżka B: własna analiza]                           │
│             (11b) pobiera ──→ 📁 GeoTIFF / GeoJSON / KMZ        │
│             (11c) otwiera ──→ 🖥️  QGIS (własne narzędzie)       │
│             (11d) analizuje samodzielnie                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Historia:**
> Klient uzyskuje dostęp do aplikacji webowej z gotowymi warstwami. Może eksplorować dane w widoku 2D lub 3D, przełączać warstwy mineralizacji, nakładać ortofoto i dane terenowe. Część klientów pobiera dane w standardowych formatach (GeoTIFF, GeoJSON, KMZ) do dalszej analizy we własnych narzędziach GIS (najczęściej QGIS).

---

## SCENA 7 — Decyzja eksploracyjna (po stronie klienta)

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 Geolodzy klienta                                            │
│       │                                                         │
│       │  (12) interpretują ──→ 🗺️  Mapy + dane TerraEye         │
│       │       wyniki                                            │
│       │                                                         │
│       │  (13) podejmują ──→ 🚩 Decyzja eksploracyjna            │
│       │       decyzję         ("obszar X — priorytet wysoki")   │
│       │                                                         │
│       │  (14) wysyłają ──→ 👷 Zespół terenowy                   │
│       │       ekipę            (w teren, do zweryfikowanych     │
│       │                         punktów)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Historia:**
> Na podstawie map mineralizacji geolodzy klienta podejmują decyzję o priorytetyzacji obszarów do fizycznej eksploracji. Zamiast wysyłać ekipy terenowe na ślepo — kierują je w miejsca o najwyższym prawdopodobieństwie wystąpienia złóż. To jest moment dostarczenia realnej wartości biznesowej: mniej czasu, mniej pieniędzy, mniej ryzykownych wypraw.

---

## PEŁNY PRZEPŁYW — widok skrócony

```
👤 Klient          🛰️ Dostawcy        👥 ML Eng.        🔬 Geolog        👤 Klient
    │                   │                  │                 │                 │
    │──(1) AOI──────────┼──────────────────┼─────────────────┼────────────────▶│
    │                   │                  │                 │            [sys]│
    │                   │◀─(3) zapytanie───┤                 │                 │
    │                   │──(4) raw data───▶│                 │                 │
    │                   │                  │──(5) pipeline──▶│                 │
    │                   │                  │◀─(6) mapa min.──│                 │
    │                   │                  │                 │──(7) QA────────▶│
    │                   │                  │                 │◀─(8) zatw.──────│
    │                   │                  │                 │         [pub]   │
    │◀─────────────────────────────────────────(9) warstwy───┼─────────────────│
    │                                                        │                 │
    │──(10) eksploruje aplikację──────────────────────────────────────────────▶│
    │──(11) pobiera dane (opt.)───────────────────────────────────────────────▶│
    │                                                                          │
    │══(12-14) DECYZJA: gdzie wysłać zespół terenowy ══════════════════════════│
```

---

# CZĘŚĆ 2 — WARDLEY MAP — TerraEye

```
  WIDOCZNOŚĆ
  DLA KLIENTA
  (Mining Co.)
       ↑
       │
  [AN] │  ★ DECYZJA EKSPLORACYJNA
       │    (gdzie kopać, kiedy, za ile — redukuj ryzyko i koszty)
       │
  [BC] │            ○ Priorytetyzacja
       │              obszarów złóż
       │              (bez jazdy w ciemno)
       │
  [FT] │                    ○ Analiza wizualna           ○ Eksport danych
       │                      warstw mineralizacji         (QGIS-ready)
       │                      (2D / 3D viewer)
       │
  [CP] │       ○ Mapa         ○ Zarządzanie        ○ Wizualizacja
       │         mineraliz.     warstwami GIS         3D (Deck.gl)
       │         (ML output)    (GeoTIFF/GeoJSON)
       │
  [PS] │  ○ ML Pipeline     ○ QA Geolog       ○ Multi-source
       │    (proprietary,     (human-in-loop,   data fusion
       │    lata treningu)    → automat.)       (Sentinel/Wyvern/EMIT)
       │
  [IN] │                    ○ Dane             ○ App framework
       │                      satelitarne        (React, Deck.gl,
       │                      (od dostawców)     Zustand, Zod)
       │
  [FI] │                                      ○ Cloud infra    ○ GeoTIFF/
       │                                        (hosting,        GeoJSON
       │                                         storage)        (format std.)
       │
  ─────┼───────────────────────────────────────────────────────────────────→
     Genesis            Custom               Product            Commodity
  (pionierskie,     (budowane na          (kupujesz i        (standard,
   niestabilne,      miarę, wzorce         konfigurujesz,     utility,
   R&D)              w toku)               alternatywy        wszędzie)
                                           istnieją)
```

---

## KOMPONENTY — SZCZEGÓŁOWE UZASADNIENIE POZYCJI

### Genesis — niestabilne, R&D

| Komponent | Uzasadnienie |
|-----------|-------------|
| *(brak w TerraEye aktualnie)* | ML algorytmy są już stabilne — Custom, nie Genesis |

> TerraEye nie ma aktywnych Genesis komponentów w sensie "jeszcze nie wiemy czy to działa". Mają za to **Custom bliski Genesis** — ML pipeline wytrenowany na unikalnym datasecie przez lata. Nikt inny nie ma takiego modelu dla tej domeny.

---

### Custom — serce biznesu TerraEye

```
┌──────────────────────────────────────────────────────────────────┐
│  CUSTOM — "tutaj siedzi moat TerraEye"                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ○ ML Pipeline (proprietary)                           [MOAT #1] │
│    Algorytmy trenowane latami na danych hiperspektralnych        │
│    dla konkretnych typów mineralizacji. Nie do kupienia,         │
│    nie do szybkiego odtworzenia. Wymaga labeled data,            │
│    ekspertów geologicznych i lat iteracji.                       │
│    → Klient kupuje: "diagnoza z orbity zanim wyślesz ekipę"      │
│                                                                  │
│  ○ Multi-source data fusion                                      │
│    Łączenie danych z Sentinel Hub, Wyvern, EMIT —                │
│    różne rozdzielczości, różne pasma. Własnościowy               │
│    preprocessing + normalizacja. Nie ma gotowego SaaS na to.     │
│                                                                  │
│  ○ Mapa mineralizacji (output)                                   │
│    Produkt ML pipeline — warstwy z rozkładem przestrzennym       │
│    prawdopodobieństwa. Format i semantyka unikalne dla TerraEye. │
│                                                                  │
│  ○ QA Geolog (human-in-loop)                         [TYMCZASOWE]│
│    Weryfikacja ekspercka w niestandardowych przypadkach.         │
│    Docelowo zastąpiona przez automatyzację.                      │
│    → Przesuwa się ku Commodity (zaniknie jako ręczny proces)     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Custom → Product — aplikacja i wizualizacja

```
┌──────────────────────────────────────────────────────────────────┐
│  CUSTOM/PRODUCT — "zbudowane na produktach, ale unikalna impl."  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ○ Zarządzanie warstwami GIS                           [MOAT #2] │
│    System prezentacji i zarządzania wieloma warstwami            │
│    (GeoTIFF, GeoJSON, KMZ) z integracją danych ML.               │
│    Zbudowany na Deck.gl, ale architektura warstw i UX            │
│    jest własnościowa. Odtwarzalne — ale wymaga czasu.            │
│                                                                  │
│  ○ Wizualizacja 3D (Deck.gl)                                     │
│    Implementacja renderowania 3D dla danych hiperspektralnych.   │
│    Deck.gl jako biblioteka = Product. Integracja z ML            │
│    output i geo formatami = Custom.                              │
│                                                                  │
│  ○ Analiza wizualna w przeglądarce (2D/3D viewer)                │
│    Zaawansowana przeglądarka GIS w webie. Konkuruje z            │
│    QGIS desktop — ale działa w przeglądarce bez instalacji.      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Product — gotowe, kupowane od zewnątrz

| Komponent | Uzasadnienie |
|-----------|-------------|
| Dane satelitarne (Sentinel Hub) | Darmowe dane ESA, API kupowane od Sentinel Hub. Standardowy rynek. |
| Dane komercyjne (Wyvern, EMIT) | Rynek komercyjnych danych hiperspektralnych — dojrzały, wielu dostawców. |
| React / Deck.gl / Zustand | Biblioteki open source / produktowe. Nie budujemy od zera. |
| Eksport GeoTIFF / GeoJSON / KMZ | Standardowe formaty GIS — implementacja prosta, dojrzałe biblioteki. |

---

### Commodity — utility, niewidoczne

| Komponent | Uzasadnienie |
|-----------|-------------|
| Cloud hosting / storage | AWS/Azure/GCP — cena za GB, per request. Utility. |
| GeoTIFF / GeoJSON jako format | Standard branżowy GIS — każde narzędzie to czyta. |
| QGIS (po stronie klienta) | Klient używa go jako alternatywy — darmowy, open source, wszędzie. |
| REST API | Standard komunikacji — niewyróżnialny. |

---

## CO WIDZI KLIENT, A CO NIE

```
╔═══════════════════════════════════════════════════════════════════╗
║  KLIENT WIDZI I ZA TO PŁACI                                       ║
║                                                                   ║
║   • Mapa z rozkładem mineralizacji na swoim AOI                   ║
║   • Widok 2D/3D warstw w przeglądarce                             ║
║   • Możliwość pobrania danych do QGIS                             ║
║   • Odpowiedź na pytanie: "gdzie priorytetowo szukać?"            ║
╠═══════════════════════════════════════════════════════════════════╣
║  KLIENT NIE WIDZI (ale to decyduje o jakości produktu)            ║
║                                                                   ║
║   • ML pipeline i algorytmy rozpoznawania mineralizacji           ║
║   • Multi-source data fusion (Sentinel + Wyvern + EMIT)           ║
║   • QA geolog weryfikujący wyniki                                 ║
║   • Architektura warstw i rendering Deck.gl                       ║
╠═══════════════════════════════════════════════════════════════════╣
║  CAŁKOWICIE NIEWIDOCZNE                                           ║
║                                                                   ║
║   • Cloud infrastructure                                          ║
║   • React / TypeScript / Zustand / Zod                            ║
║   • GeoTIFF processing internals                                  ║
║   • CI/CD, Docker, K8s                                            ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## ANALIZA STRATEGICZNA

### Gdzie jest moat TerraEye

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ML Pipeline  +  lata treningu  +  domain expertise        │
│  (geologiczna) + labeled geodata = MOAT                    │
│                                                            │
│  Trudne do skopiowania bo wymaga jednocześnie:             │
│  ✓ Data science / ML                                       │
│  ✓ Geologicznej wiedzy domenowej                           │
│  ✓ Dostępu do historycznych danych referencyjnych          │
│  ✓ Czasu (latami budowane)                                 │
│                                                            │
│  Frontend / viewer = łatwy do odtworzenia                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Ryzyka (co mogłoby poruszyć mapę)

| Ryzyko | Wpływ | Prawdopodobieństwo |
|--------|-------|-------------------|
| Foundation models (np. Gemini/GPT-5) zaczną wykrywać mineralizację z obrazów bez fine-tuningu | Przeniesie ML Pipeline z Custom→Product — moat słabnie | Średnie, 3-5 lat |
| Wyvern / EMIT obniżą ceny → dane hiperspektralne staną się tanie i masowe | Więcej konkurentów wejdzie na rynek | Wysokie, 2-3 lata |
| Konkurent (Descartes Labs, EarthAI) zbuduje podobny pipeline z VC za plecami | Bezpośrednia konkurencja w niszy | Średnie |
| Klient nauczy się samodzielnie budować pipeline (open source ML) | Część klientów odpadnie | Niskie w krótkim term. |

### Szanse (co przyspieszy mapę)

| Szansa | Wpływ |
|--------|-------|
| Drony — naloty własne TerraEye | Dodałyby Genesis/Custom komponent z własnym sensorem — ogromny moat |
| AI Decision Layer (gdzie kopać = rekomendacja, nie mapa) | Przesuwa wartość wyżej w łańcuchu — klient nie interpretuje, dostaje odpowiedź |
| Automatyzacja QA geologa | Redukuje koszty operacyjne, skaluje bez liniowego wzrostu zespołu |
| Integracja z modelami geofizycznymi (dane sejsmiczne + geo) | Cross-modal fusion — następny poziom trudności do skopiowania |

---

## EWOLUCJA MAPY — 3 LATA

```
  Drony TerraEye (własne)    [poza mapą] ──────────→ Genesis (jeśli zrealizowane)

  ML Pipeline                [Custom]    ─────────────────────→ [stabilny Custom]
  (core moat)                            (utrzymać, deepenować)

  QA Geolog                  [Custom]    ──────────────────────→ [zanika / automat]
  (human loop)               → automatyzacja w toku

  Aplikacja GIS (viewer)     [Custom/Product] ─────────────────→ [Product]
                             (odtwarzalna, ale sprawna)

  Dane satelitarne           [Product]   ──────────────────────→ [Commodity]
  (Sentinel, Wyvern)         (rynek dojrzeje, tanieje)

  AI Decision Layer          [poza mapą] ──────────→ Genesis (szansa do zajęcia)
  "gdzie kopać?"
```

---

*Domain Storytelling + Wardley Map | TerraEye | 2025-05-02*
*Szczegóły techniczne ML i nazwy minerałów celowo uogólnione*
