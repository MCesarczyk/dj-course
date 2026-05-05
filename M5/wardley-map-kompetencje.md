# Wardley Map — Strategia Rozwoju Kompetencji
**Michał Cesarczyk | Frontend/GIS Engineer | Horyzont: 5 lat**

---

## MAPA — STAN OBECNY (2025)

```
  WIDOCZNOŚĆ
  DLA KLIENTA
      ↑
      │
 [AN] │  ★ DECYZJE EKSPLORACYJNE
      │    (gdzie kopać, ile kosztuje, jak szybko)
      │
 [UŻ] │           ○ Interpretacja
      │             hiperspektralna
      │
 [FT] │                    ○ Aplikacja mapowa
      │                      interaktywna (web)
      │
 [CP] │  ○ AI/ML         ○ Wizualizacja 3D        ○ Leaflet
      │    decyzyjne       ○ Editable Geo Layers     (mapy 2D)
      │    (mining)
      │
 [TK] │  ○ WebGL        ○ Deck.gl              ○ NestJS /       ○ React
      │    low-level       Integration             FastAPI
      │                  ○ H3 / Zarr /
      │                    GeoJSON pipelines
      │                  ○ Domain Knowledge
      │                    (geo + GIS)
      │                  ○ Vanilla TS
      │                    (fw-agnostic)
      │
 [IN] │                                        ○ Docker / K8s   ○ REST API
      │                                          (learning)       Git
      │                                                         ○ GitHub Actions
      │
      │
  ────┼──────────────────────────────────────────────────────────────────→
    Genesis           Custom              Product            Commodity
   (pionierskie,    (budowane na         (biblioteki,       (standard
    niestabilne,     miarę, wzorce       frameworki,        branżowy,
    R&D)             w toku)             narzędzia)         wszędzie)
```

**Legenda:** `★` = potrzeba klienta (anchor) | `○` = komponent/kompetencja
**Osie:** Y = widoczność dla klienta (góra = widoczne) | X = ewolucja (prawo = dojrzałe)

---

## KOMPONENTY — SZCZEGÓŁY

### Poziom AN — Anchor (potrzeba klienta zewnętrznego)

| Komponent | Pozycja | Opis |
|-----------|---------|------|
| ★ Decyzje eksploracyjne | Genesis→Custom | "Gdzie kopać, kiedy, za ile?" — klient nie kupuje mapy, kupuje redukcję ryzyka i kosztów eksploracji złóż |

### Poziom UŻ — Użytkownik bezpośredni (geolodzy)

| Komponent | Pozycja | Opis |
|-----------|---------|------|
| Interpretacja hiperspektralna | Custom | Nakładki, spektrogramy, klasyfikacja minerałów — geolodzy widzą i oceniają |

### Poziom FT — Feature (widoczne UI)

| Komponent | Pozycja | Opis |
|-----------|---------|------|
| Aplikacja mapowa interaktywna | Product | To co klient "kupuje" jako produkt — mapa w przeglądarce |

### Poziom CP — Komponenty (częściowo widoczne)

| Komponent | Pozycja | Twój status | Uwaga |
|-----------|---------|-------------|-------|
| AI/ML decyzyjne (mining) | Genesis | 🔴 Brak | Największa szansa — Genesis = first mover |
| Wizualizacja 3D hiperspektralna | Custom | 🟡 W toku | Deck.gl 3D layers — Twój obecny front badań |
| Editable Geo Layers | Custom | 🟡 W toku | Kontrybuujesz do @deckgl-community — jesteś już w tym ekosystemie |
| Leaflet (mapy 2D) | Product | 🟢 Opanowane | Dobrze znasz — ale to "starsza" warstwa |

### Poziom TK — Technologie (niewidoczne dla klienta)

| Komponent | Pozycja | Twój status | Uwaga |
|-----------|---------|-------------|-------|
| WebGL low-level | Genesis→Custom | 🔴 Do nauki | Kluczowy dla wydajności 3D — Twój zidentyfikowany gap |
| Deck.gl Integration | Custom | 🟡 W toku | Uczysz się + kontrybuujesz — dobra trajektoria |
| H3 / Zarr / GeoJSON | Custom | 🟡 Częściowe | Formaty danych geo — Twój differentiator domenowy |
| Domain Knowledge (geo+GIS) | Custom | 🟢 Rośnie | Najtrudniejszy do skopiowania przez "zwykłego" React deva |
| Vanilla TS (fw-agnostic) | Custom | 🟢 Świadomy | Rozumiesz pułapkę over-React — strategicznie ważne |
| NestJS / FastAPI | Product | 🟡 Learning | T-shape — budujesz poziomy zasięg |

### Poziom IN — Infrastruktura (niewidoczna)

| Komponent | Pozycja | Twój status | Uwaga |
|-----------|---------|-------------|-------|
| Docker / K8s | Product | 🟡 Learning | Wystarczy poziom "rozumiem i działam" |
| REST API / Git | Commodity | 🟢 Opanowane | Baseline — nie inwestuj więcej |
| GitHub Actions | Commodity | 🟢 Opanowane | CI/CD — wystarczające |

---

## MAPA — EWOLUCJA DO 2030

```
  WIDOCZNOŚĆ
  DLA KLIENTA
      ↑
      │
 [AN] │  ★ DECYZJE EKSPLORACYJNE
      │    (stają się bardziej złożone, AI-driven)
      │
 [UŻ] │           ○ Interpretacja hiperspektralna
      │             (+ AI overlay)
      │
 [FT] │  ○ MVP/Demo         ○ Aplikacja mapowa
      │    samodzielne         interaktywna
      │    (nowa zdolność)
      │
 [CP] │             ○ AI/ML           ○ Wizualiz. 3D    ○ Editable
      │               decyzyjne         hiperspektr.      Geo Layers
      │               (mining)  ←─────────────────── przesunięcie →
      │
 [TK] │             ○ WebGL         ○ Deck.gl         ○ NestJS/   ○ React
      │               low-level       Integration        FastAPI
      │               ←──── rośnie w górę i w prawo ────→
      │             ○ H3/Zarr/GeoJSON                 ○ Zustand
      │             ○ Domain Know. (DEEPENS — zostaje Custom, to Twój moat)
      │             ○ Vanilla TS / framework-agnostic
      │
 [IN] │                                              ○ Docker/K8s  ○ REST
      │                                                             Git CI/CD
      │
  ────┼──────────────────────────────────────────────────────────────────→
    Genesis           Custom              Product            Commodity
```

### Strzałki ewolucji (co się przesuwa i dlaczego):

```
WebGL low-level         Genesis ──────────→ Custom
                        (uczysz się, budujesz wzorce)

AI/ML decyzyjne         Genesis ──────→ Custom
(mining)                (rynek dojrzewa + Ty wchodzisz)

Deck.gl Integration     Custom ─────────────→ Product
                        (biblioteka dojrzewa, community rośnie)

H3/Zarr/GeoJSON         Custom ──────────→ Product
                        (standardyzacja formatów geo)

Docker/K8s              Product ──────────────→ Commodity
                        (PaaS, managed services)

React                   Commodity ───────────────→ [deeper commodity]
                        (ryzyko: bycie "tylko React devem" = utowarowienie)

Domain Knowledge        Custom ─────── ZOSTAJE Custom ──────→
(geo+GIS)               (Twój moat — intencjonalnie nie oddajesz tej przestrzeni)
```

---

## CO WIDZI KLIENT, A CO NIE

```
╔══════════════════════════════════════════════════════╗
║            WIDOCZNE DLA KLIENTA (geolodzy / mining)  ║
║                                                      ║
║  • Mapa z danymi hiperspektralnymi                   ║
║  • Narzędzia do zaznaczania i anotacji               ║
║  • Wizualizacje 3D terenu / złóż                     ║
║  • Rekomendacje eksploracyjne (przyszłość)            ║
╠══════════════════════════════════════════════════════╣
║          NIE WIDZI (ale klient to czuje jako jakość) ║
║                                                      ║
║  • Jak szybko renderuje (WebGL)                      ║
║  • Że mapa działa bez lagów na 1M punktów            ║
║  • Formaty danych (H3, Zarr, GeoJSON)                ║
║  • Architektura backend / API                        ║
╠══════════════════════════════════════════════════════╣
║           CAŁKOWICIE NIEWIDOCZNE (infra)              ║
║                                                      ║
║  • Docker, K8s, CI/CD                                ║
║  • Biblioteki, frameworki                            ║
║  • Vanilla TS vs React                               ║
╚══════════════════════════════════════════════════════╝
```

**Kluczowa obserwacja:** Klient zewnętrzny (mining) nie kupuje React ani Deck.gl.
Kupuje **"skróć mi czas od danych satelitarnych do decyzji gdzie kopać"**.
Wszystko co robisz musi być ocenianie przez ten pryzmat.

---

## ANALIZA STRATEGICZNA

### Twój moat (najważniejsza obserwacja)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   React dev        +   GIS/maps   =   wielu         │
│   GIS dev          +   React      =   wielu         │
│                                                     │
│   React + GIS + Deck.gl + geo data formats          │
│   + domain knowledge (minerały/hiperspektralne)     │
│   + możliwość backend/infra                         │
│                                                     │
│                            =   BARDZO NIEWIELU      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Twoja kombinacja jest w Custom — i tam powinna zostać przez najbliższe 5 lat.
Nie "uciekaj" z tej niszy w kierunku "zwykłego fullstack" — to byłby ruch w stronę Commodity.

### Ruchy strategiczne — priorytety

| Priorytet | Ruch | Dlaczego | Horyzont |
|-----------|------|----------|---------|
| 🔴 1 | Opanuj WebGL low-level | Bez tego Deck.gl to black box — nie możesz debugować ani optymalizować wydajności 3D | 0–18 mies. |
| 🔴 2 | Buduj Domain Knowledge (geo) aktywnie | To Twój największy differentiator — geolodzy uczą się lat żeby rozumieć dane | ciągłe |
| 🟠 3 | Wejdź w AI/ML dla mining (eksploracja) | Genesis = szansa na first mover w bardzo konkretnej niszy | 12–36 mies. |
| 🟠 4 | Ukończ backend do poziomu "działam samodzielnie" | Umożliwia dostarczenie pełnego MVP bez zależności od innych | 12–24 mies. |
| 🟡 5 | Kontynuuj @deckgl-community contributions | Buduje reputację, dostęp do ekspertów, rozumienie roadmapy | ciągłe |
| 🟡 6 | Vanilla TS / framework-agnostic mindset | React commodityzuje — elastyczność chroni przed uzależnieniem | ciągłe |
| 🟢 7 | Infrastructure — utrzymaj poziom "działam" | Nie musisz być K8s ekspertem — musisz rozumieć i nie blokować się | 0–12 mies. |

### Czego NIE robić

```
✗  Deepening React bez GIS/geo — to droga w stronę Commodity
✗  Ignorowanie wydajności renderowania — 3D geo data to miliony punktów
✗  Zostawanie "tylko frontend" — T-shape to Twój plan i jest słuszny
✗  Pomijanie domain knowledge — to najtrudniejszy do skopiowania element
```

### Scenariusz 2030 — kim możesz być

```
"GIS/Geo Specialist który potrafi samodzielnie dostarczyć
 pełne MVP aplikacji do eksploracji mineralnej:
 - Frontend 3D (Deck.gl + WebGL)
 - Backend API (NestJS / FastAPI)
 - Geo data pipelines (H3, Zarr, GeoJSON)
 - Deployment (Docker/K8s)
 - Domain: hiperspektralne dane, złoża minerałów
 - Opcjonalnie: AI overlay dla decyzji eksploracyjnych"
```

Ten profil jest w **Custom** na mapie i pozostanie tam przez lata — bo wymaga kombinacji rzadkich umiejętności.
To jest dokładnie tam gdzie chcesz być.

---

## WARDLEY CLOCK — KIEDY CO ROBIĆ

```
    2025 ────────────────────────────────────────────── 2030
      │                                                    │
    Teraz          Rok 1-2          Rok 2-3         Rok 4-5
      │                │                │                 │
   WebGL            Backend          AI/ML            Samodzielne
   low-level        opanowany        mining           MVP/demo
   (zacznij)        (działa)         (eksploracja)    (dostarczasz)
      │                │                │                 │
   Deck.gl          H3/Zarr          Contributions    Reputacja
   głębiej          płynnie          deckgl-comm.     w niszy
      │                │                │                 │
   Domain           Domain           Domain           Domain
   (aktywnie        (geolodzy        (uczysz          (jesteś
    pytaj)           ufają)           innych)          referencją)
```

---

*Mapa wygenerowana na podstawie rozmowy | 2025-05-02*
*Metodologia: Wardley Mapping (Simon Wardley)*
