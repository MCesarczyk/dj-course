# Wymiary przestrzenne jako Value Object — model i argumentacja

## Problem (primitive obsession)

Wymiary przestrzenne były rozsiane po systemie jako gołe `number`:

- `PalletSpec.width / length / height` — bez jednostki w typie (mm tylko "z konwencji"),
- `PalletLoadableCarrierSpec.widthMm / heightMm / maxLdm` — jednostka zakodowana w nazwie pola (i to niespójnie: mm vs m!),
- `PalletUnit.totalHeightMm = spec.height + cargoHeightMm` — ad-hoc arytmetyka,
- `LdmCalculator` — ręczna konwersja `totalLdmMm / 1000` i `toFixed(2)` w środku algorytmu,
- odwrotne odejmowanie `cargoHeightMm = totalHeightMm - spec.height` w repozytorium (dekompozycja stanu przez arytmetykę!).

Skutki: na wymiarze da się technicznie policzyć sinus, przemnożyć wysokość przez LDM
(mm × m — bez sensu fizycznie, kompilator milczy), a konwersje jednostek i if-y
porównawcze rozsiewają się po warstwach.

## Inwentaryzacja use case'ów (co system NAPRAWDĘ robi z wymiarami)

Przeszukałem cały `tms-api` (domena, aplikacja, persystencja, API, testy, schema SQL):

| Use case | Operacje | Wymiarowość |
|---|---|---|
| Pakowanie palet w rzędy (LdmCalculator) | suma szerokości w rzędzie, porównanie z szerokością naczepy | 1D (suma + porównanie) |
| Wyznaczenie LDM | max długości w rzędzie, suma po rzędach, konwersja mm→m | 1D (max + suma + konwersja) |
| Piętrzenie ładunku na palecie | wysokość palety + wysokość ładunku | 1D (suma) |
| Kontrola prześwitu | totalHeight > wysokość naczepy | 1D (porównanie) |
| Kontrola pojemności LDM | currentLdm > maxLdm | 1D (porównanie) |
| Walidacja specyfikacji palety | wymiar > 0 | 1D |
| Persystencja / API / read modele | serializacja do mm lub m | 1D (konwersja na granicy) |

**Czego NIE znalazłem:**

- **powierzchnia (m²)** jako skalar — nigdy nie liczona; "footprint" palety funkcjonuje
  wyłącznie jako *para niezależnych długości* (szerokość wchodzi do sumy rzędu,
  długość do max głębokości rzędu — nigdy width × length),
- **kubatura (m³)** — nigdzie nie liczona w domenie; `volume_m3` pojawia się tylko
  w komentarzu do luźnego JSONB w katalogu pojazdów (dane opisowe/katalogowe,
  "documented, not enforced" — nie logika domenowa),
- rotacja palet, packing 3D — nie istnieją.

### Od czego zależy "jedna klasa czy wiele"?

Nie od geometrii świata rzeczywistego, tylko od **operacji, które domena faktycznie
wykonuje**. Kryterium: *czy istnieje use case, w którym dwa wymiary są traktowane
jako jedna niepodzielna wartość z własnymi regułami?*

- Gdyby system liczył zajętość podłogi w m² (np. wycena za powierzchnię) → osobny
  VO `Area`, bo m² ma inną algebrę (Length × Length = Area, Area + Length = błąd).
- Gdyby system liczył kubaturę / wypełnienie objętościowe → `Volume`.
- Gdyby istniała rotacja palety → VO `Footprint { width, length }` z operacją
  `rotated()`, bo wtedy para długości ma wspólny niezmiennik.

Żaden z tych use case'ów **nie istnieje** — algorytm LDM rozkłada "powierzchnię"
na dwie niezależne osie. Zamodelowanie `Area`/`Volume`/`Dimensions3D` byłoby
spekulacją (YAGNI): kod, który nie ma ani jednego wywołania, a który trzeba
utrzymywać i który sugeruje czytelnikowi, że domena "myśli" powierzchniami —
a nie myśli.

Świadomie NIE dodałem też do `Length` operacji `times(other): Area` — jej brak
jest deklaracją modelu: w tym kontekście długości się sumuje i porównuje,
nigdy nie mnoży.

### Co z LDM?

Kusiło osobne `Ldm` — ale LDM to *konwencja wyrażania długości podłogi w metrach*,
nie osobna wielkość fizyczna. Reprezentuję je jako `Length` z jednostką `M`
(zaokrąglenie do 2 miejsc pozostaje w `LdmCalculator` — to reguła konwencji LDM,
nie właściwość długości).

## Decyzja: jedna klasa `Length`, nie rodzina {Length, Area, Volume}

**Zamodelowałem wyłącznie `Length` (`shared/length.ts`)** — bliźniaczo do istniejącego
w projekcie `Weight` (spójny language systemu: `Weight.from(24000, 'KG')` ↔
`Length.from(2480, 'MM')`).

```ts
Length.from(13.6, 'M')          // jednostki: MM | CM | M
a.add(b)                        // piętrzenie, sumowanie rzędu
a.isGreaterThan(b)              // kontrole pojemności
a.fitsWithin(available)         // czytelna intencja "czy się mieści"
Length.max(a, ...rest)          // najgłębsza paleta w rzędzie
a.valueIn('M')                  // konwersja TYLKO na granicach (DB, API, komunikaty)
Length.compare(a, b)            // sortowanie
```

### Argumenty ZA jedną klasą

- **Każda operacja ma miejsce wywołania.** Model pokrywa 100% zinwentaryzowanych
  use case'ów (suma, max, porównanie, konwersja) i ani jednej operacji więcej —
  zero martwego kodu, zero syntetycznych testów.
- **Minimalna powierzchnia API jest deklaracją modelu.** Brak `multiply` mówi
  czytelnikowi wprost: w tym kontekście długości się sumuje i porównuje, nigdy
  nie mnoży. Model dokumentuje domenę także tym, czego NIE potrafi.
- **Symetria z istniejącym `Weight`.** Jeden wzorzec VO wielkości w całym
  systemie (`Weight.from(24000, 'KG')` ↔ `Length.from(2480, 'MM')`) — niski
  próg wejścia, spójny ubiquitous language, przewidywalne granice serializacji.
- **Jedno miejsce prawdy o jednostkach.** Cała konwersja mm/cm/m i walidacja
  nieujemności żyje w jednej klasie; nie ma N typów z powielonymi fabrykami,
  `equals`, `toString` do utrzymania.
- **Tania ewolucja.** Rozszerzenie o `Area`/`Volume` jest addytywne
  i nieprzełamujące — decyzję można bezpiecznie odłożyć do pierwszego
  realnego use case'u.

### Argumenty PRZECIW jednej klasie

Uczciwie — słabości tego wariantu:

- **Brak ochrony przed pomyleniem osi.** Wszystko jest `Length`, więc
  `rowWidth.add(unit.totalHeight)` kompiluje się bez ostrzeżenia, choć jest
  semantycznie bezsensowne. Typy per rola (`Width`, `Height`, `Depth` — branded
  types nad wspólnym rdzeniem) wychwyciłyby to w czasie kompilacji. To zresztą
  mocniejsza wersja argumentu o „niekompatybilnych jednostkach": jednostki
  chroni normalizacja w runtime, ale osi nie chroni nic.
- **LDM traci odrębną semantykę.** LDM to konwencja z własnymi regułami
  (metry, zaokrąglenie do 2 miejsc, w wycenie często w górę) — jako zwykłe
  `Length` nic nie broni przed porównaniem `currentLdm` z wysokością palety.
  Reguła zaokrąglania mieszka w `LdmCalculator` zamiast w typie.
- **Gwarancje są runtime'owe, nie kompilacyjne.** Ujemna długość czy błędna
  jednostka wybucha dopiero w czasie wykonania (konstruktor/`valueIn`),
  a nie na etapie typowania — słabiej niż w wariantach z osobnym typem
  per jednostka.
- **Odroczona decyzja też ma koszt.** Gdy domena zacznie liczyć m²/m³, trzeba
  będzie wrócić do modelu i przemyśleć algebrę (czy `multiply` na `Length`,
  czy fabryka `Area.of(w, l)`); zespół, który do tego czasu przywyknie do
  „długości się nie mnoży", może zacząć obchodzić VO przez `valueIn` i liczyć
  powierzchnię na gołych numberach.

## Kontrpropozycja: rodzina Length / Area / Volume (algebra wymiarowa)

W dyskusji nad modelem pojawiła się kontrpropozycja — pełna rodzina typów,
w której system typów odwzorowuje algebrę wymiarów: mnożenie 1D × 1D daje 2D,
a 2D × 1D daje 3D.

```ts
class Length {
  private constructor(private readonly millimeters: number) { /* walidacja >= 0 */ }

  static fromMm(mm: number): Length { return new Length(mm); }
  static fromMeters(m: number): Length { return new Length(m * 1000); }

  toMm(): number { return this.millimeters; }
  toMeters(): number { return this.millimeters / 1000; }

  add(other: Length): Length { return new Length(this.millimeters + other.millimeters); }

  // Mnożenie 1D * 1D daje 2D!
  multiply(other: Length): Area { return Area.fromMm2(this.millimeters * other.millimeters); }
}

class Area {
  private constructor(private readonly squareMillimeters: number) { /* walidacja >= 0 */ }

  static fromMm2(mm2: number): Area { return new Area(mm2); }
  static fromM2(m2: number): Area { return new Area(m2 * 1_000_000); }

  toM2(): number { return this.squareMillimeters / 1_000_000; }

  // Mnożenie 2D * 1D daje 3D!
  multiply(height: Length): Volume { return Volume.fromMm3(this.squareMillimeters * height.toMm()); }
}

class Volume {
  private constructor(private readonly cubicMillimeters: number) { /* walidacja >= 0 */ }

  static fromMm3(mm3: number): Volume { return new Volume(mm3); }
  static fromLiters(liters: number): Volume { return new Volume(liters * 1_000_000); }

  toLiters(): number { return this.cubicMillimeters / 1_000_000; }
  toM3(): number { return this.cubicMillimeters / 1_000_000_000; }
}
```

### Argumenty ZA rodziną typów

- **Spójność wymiarowa w czasie kompilacji**: `Length + Area` się nie kompiluje;
  wynik mnożenia ma poprawny typ. Nie da się pomylić m² z m³.
- **Klasyczny, sprawdzony wzorzec**: tak działają biblioteki wielkości fizycznych
  (Squants w Scali, units-of-measure w F#, JSR-385). Model jest samoopisujący się
  dla każdego, kto zna fizykę.
- **Kompletność**: gdy pojawi się pierwszy use case powierzchni/kubatury,
  model już na niego czeka — nie trzeba wracać do refaktoryzacji.
- **Kanoniczna reprezentacja** (zawsze mm w środku) upraszcza implementację —
  nie trzeba pamiętać jednostki wejściowej.

### Argumenty PRZECIW (dlaczego ostatecznie jedna klasa)

Warto zauważyć, że **w 1D oba warianty są niemal identyczne** — prywatny
konstruktor, walidacja nieujemności, fabryki per jednostka, bezpieczne `add`
z normalizacją. Ochrona przed „dodawaniem niekompatybilnych jednostek" jest
w obu taka sama: `mm + m` normalizuje się poprawnie, a dodanie gołego `number`
nie przechodzi przez kompilator. Spór dotyczy wyłącznie `Area`/`Volume`
i `multiply`:

1. **Zero miejsc wywołania.** Inwentaryzacja całego `tms-api` (sekcja wyżej)
   nie znalazła ani jednego mnożenia wymiarów. Algorytm LDM traktuje szerokość
   i głębokość jako niezależne osie. `Area` i `Volume` byłyby martwym kodem —
   dokładnie przypadek z reguły „nie modeluj czegoś, co miałoby nie być używane".
2. **`multiply` to nie ochrona — to zaproszenie.** Brak `multiply` na `Length`
   jest deklaracją modelu: *w tym kontekście długości się sumuje i porównuje,
   nigdy nie mnoży*. Po dodaniu `multiply` system typów zacznie przepuszczać
   operacje wymiarowo poprawne, a semantycznie bezsensowne
   (`pallet.width.multiply(carrier.height)` kompiluje się bez ostrzeżenia),
   i zachęci do ad-hocowych obliczeń, przed którymi przestrzega lekcja.
   Typ `Area` chroni przed `Area + Length` — ale ten błąd nie ma jak powstać,
   skoro nikt `Area` nie tworzy.
3. **Odroczenie jest darmowe, wysłanie teraz — nie.** Rodzina jest czysto
   addytywna: dopisanie `Area` + `multiply`, gdy pojawi się realny use case
   (wykorzystanie podłogi w %, waga wolumetryczna w wycenie, planowanie
   kubaturowe), to nieprzełamująca zmiana. W drugą stronę: wysłane dziś
   `Area`/`Volume` to kod do utrzymania, syntetyczne testy i fałszywy sygnał
   dla czytelnika, że domena „myśli powierzchniami".

## Efekty refaktoryzacji

1. **Rdzeń domeny bez primitives**: `PalletSpec`, `PalletUnit`, `CarrierSpec`,
   `CargoLoadPlan`, `LdmCalculator` operują wyłącznie na `Length`.
2. **Konwersje jednostek tylko na granicach**: repozytorium (`valueIn('M')` do
   NUMERIC, `valueIn('MM')` do INTEGER), read modele (`widthMm`, `maxLdm` w API —
   kontrakt bez zmian), komunikaty błędów.
3. **Zniknęła odwrotna arytmetyka w repo**: snapshot `PalletUnit` udostępnia teraz
   `cargoHeight` wprost (obok pochodnego `totalHeight`), więc repozytorium nie
   liczy `total - base`.
4. **Niereprezentowalność błędnych stanów**: ujemny wymiar nie przechodzi przez
   konstruktor `Length` (scenariusz Gherkin zaktualizowany — walidacja odpala się
   warstwę wcześniej niż w `PalletSpec`).
5. Testy: 43 scenariusze Cucumber / 142 kroki — zielone; `tsc` czysty.

### Sedno sporu (teza do dyskusji)

**Granica modelu to use case'y, nie fizyka.** O liczbie klas nie decyduje to,
ile wymiarów ma świat rzeczywisty, tylko to, czy w domenie istnieje operacja,
w której dwa wymiary stają się jedną wartością o innej algebrze. W tym
kontekście — nie istnieje. Rodzina Length/Area/Volume jest właściwą odpowiedzią
na inne pytanie: „jak zamodelować wielkości przestrzenne w systemie, który
*liczy* powierzchnie i objętości". Gdy TMS zacznie je liczyć — to będzie
właściwy moment na jej wprowadzenie, a dzisiejszy model niczego wtedy nie blokuje.

## Follow-up: czy LDM to ta sama jednostka długości?

Pytanie: *skoro i w LDM, i w zwykłej długości jest „metr" w nazwie,
czy LDM powinien używać tego samego value objectu co reszta długości?*

**Odpowiedź: fizycznie to ten sam metr, ale domenowo to inna wielkość** —
i pierwotna decyzja („LDM to `Length` w metrach") została zrewidowana.

### Dlaczego LDM ≠ długość geometryczna

1. **LDM się nie mierzy, tylko wylicza.** Szerokość palety można zmierzyć
   miarką; „ldm" nie istnieje na żadnym fizycznym obiekcie. To miara *zużycia
   pojemności podłogi naczepy*, znormalizowana do standardowej szerokości 2,4 m
   (klasyczny wzór spedycyjny: `(długość × szerokość) / 2,4` — czyli bliżej
   powierzchni podzielonej przez stałą niż czystej długości). Kod sam to
   sygnalizuje: komentarz przy vanie mówi wprost, że jego „LDM" to aproksymacja,
   bo metryka jest standaryzowana dla naczep 2,4 m.
2. **Test operacji** (to samo kryterium co przy Area/Volume — use case'y):
   - sensowne dla LDM: porównanie z `maxLdm`, suma LDM przesyłek, cena za ldm,
     zaokrąglenie do 2 miejsc (w wycenie często w górę),
   - bezsensowne: `valueIn('MM')`, dodanie do wysokości palety, porównanie
     z prześwitem — a wspólny typ `Length` wszystko to przepuszczał.
3. **Błąd, który wygląda na poprawny.** Przy wspólnym typie kompilowało się
   `unit.spec.length.fitsWithin(carrier.maxLdm)` — „czy paleta mieści się na
   długość?". Brzmi rozsądnie i jest błędne: dwie palety obok siebie zużywają
   głębokość rzędu raz, więc długości palety nie wolno porównywać z pojemnością
   LDM z pominięciem kalkulatora. Osobny typ czyni ten skrót niekompilowalnym.
4. **Analogia:** `Instant` vs `Duration` — obie wielkości w sekundach, a nikt
   nie modeluje ich jednym typem, bo mają inną algebrę. „Metr" w LDM to
   jednostka zapisu; VO modeluje *pojęcie*, nie jednostkę. Podobnie
   roboczogodzina vs godzina zegarowa.

### Implementacja: dedykowany VO `Ldm`

`src/cargo-plans/ldm/ldm.ts` — celowo w module `cargo-plans`, nie w `shared`:
LDM to pojęcie tego bounded contextu, a nie uniwersalna wielkość fizyczna.

```ts
Ldm.of(13.6)                     // metry, precyzja 2 miejsc W TYPIE (nie w kalkulatorze)
Ldm.zero()
Ldm.fromFloorLength(length)      // JEDYNY most geometria → pojemność
a.isGreaterThan(b)               // porównania tylko Ldm ↔ Ldm
a.valueInMeters                  // granice (DB NUMERIC(5,2), API); brak mm/cm!
```

Skutki:

- `CarrierSpec.maxLdm: Ldm`, `CargoLoadPlan.currentLdm: Ldm`, `LdmCalculator`
  zwraca `Ldm` — geometryczne `Length` wchodzą, `Ldm.fromFloorLength(...)`
  wychodzi; każda wartość LDM w systemie **dowodnie** przeszła przez kalkulator,
- reguła precyzji (2 miejsca) przeniosła się z wnętrza algorytmu do typu,
- pomieszanie LDM z wymiarem geometrycznym przestało się kompilować,
- testy: 43 scenariusze / 142 kroki — zielone, kontrakt API bez zmian
  (`maxLdm`/`currentLdm` dalej serializowane jako liczba metrów).

### Puenta

Kryterium „jedna klasa czy wiele" pozostaje niezmienione: **decydują operacje
domeny**. Dla mm/cm/m odpowiedź brzmiała „jeden typ", bo różnica jest czysto
zapisowa (chroni ją normalizacja w runtime). Dla LDM odpowiedź brzmi „osobny
typ", bo różnica jest pojęciowa: inna algebra, inne niezmienniki, inny słownik.
Ten sam nóż, dwa różne cięcia.

## Pytania do dyskusji

- ~~Czy `maxLdm: Length` to za słabe typowanie?~~ **Rozstrzygnięte w follow-upie:**
  LDM dostał dedykowany VO `Ldm` — patrz sekcja wyżej.
- Czy `Footprint`/`Dimensions` jako *grupujący* VO (bez algebry, sama spójność
  danych) ma sens już teraz, czy dopiero przy rotacji palet?
- Gdzie postawilibyście granicę Length vs Distance (trasa przewozu w km to inny
  bounded context — celowo nie ruszam).
