# Example Mapping — System obsługi zleceń DELIVEROO

---

### 🟡 US-1: Dobór typu naczepy do rodzaju ładunku

**Jako** dyspozytor **chcę** automatycznie dopasować typ naczepy do zadeklarowanego rodzaju ładunku, **aby** uniknąć ryzyka mandatu, uszkodzenia towaru i zatrzymania przez służby kontrolne.

---

**🔵 Reguła R1:** Ładunek niewymagający kontroli temperatury (np. elektronika, palety z towarem suchym, tekstylia) musi być przypisany do naczepy firanki (kurtynowej).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Elektronika na palecie, brak wymagań temp. | Rodzaj: elektronika, palety, temp. otoczenia | System przypisuje naczepę firankę; zlecenie przechodzi weryfikację |

**🔴 Pytanie do eksperta:** Czy istnieje lista SKU / kategorii ładunków z predefiniowanym typem naczepy, czy dyspozytor wybiera ręcznie?
**🔴 Pytanie do eksperta:** Czy firanka może być używana do ładunków wymagających utrzymania temperatury pokojowej (np. 15–25°C) bez agregatu?

---

**🔵 Reguła R2:** Ładunek wymagający kontrolowanej temperatury (chłodzenie lub mrożenie) musi być przypisany wyłącznie do naczepy chłodni lub mroźni z aktywnym agregatem.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Świeże mięso, wymagane 0°C–4°C | Rodzaj: żywność świeża, temperatura: +2°C | System przypisuje chłodnię z agregatem; zlecenie przechodzi weryfikację |
| 2 | Mrożonki, wymagane -18°C | Rodzaj: mrożonki, temperatura: -18°C | System przypisuje mroźnię; zlecenie przechodzi weryfikację |

---

**🔵 Reguła R3:** Ładunek ponadgabarytowy (przekraczający standardowe limity wymiarowe lub masowe) musi być przypisany do naczepy platformy (niskopodwoziowej lub standardowej platformy).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Elementy stalowe 2,63 m szerokości | Rodzaj: konstrukcja stalowa, szerokość 2,63 m | System przypisuje platformę ponadgabarytową; zlecenie wymaga zezwolenia |

---

**🔵 Reguła R4:** Przypisanie pojazdu niezgodnego z rodzajem ładunku blokuje przyjęcie zlecenia — system nie pozwala kontynuować.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Elektronika przypisana do chłodni | Rodzaj: elektronika; wybrano: chłodnia | System blokuje zlecenie — niezgodność typu pojazdu z ładunkiem |

**🔴 Pytanie do eksperta:** Co w przypadku ładunków mieszanych (np. część palety sucha, część wymagająca chłodzenia)? Czy zlecenie jest dzielone czy odrzucane?

---

### 🟡 US-2: Weryfikacja gabarytów i masy ładunku względem dopuszczalnych limitów

**Jako** dyspozytor **chcę** sprawdzić, czy podane wymiary i masa ładunku mieszczą się w dopuszczalnych limitach prawnych, **aby** nie dopuścić do przejazdu pojazdu przeciążonego lub ponadgabarytowego bez wymaganych zezwoleń.

---

**🔵 Reguła R1:** Całkowita masa zestawu (ciągnik + naczepa + ładunek) nie może przekraczać 40 ton dla zestawów 5-osiowych bez zezwolenia — zgodnie z polskim prawem drogowym i przepisami UE.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Ładunek w normie masowej | Masa ładunku: 22 t (zestaw 5-osiowy, DMC 40 t) | Parametr masy OK; zlecenie przechodzi dalej |
| 2 | Przekroczona masa — przykład z rozmowy | Deklarowana masa: 22 t, faktyczna: 25,2 t (zestaw 5-osiowy, DMC 40 t) | System blokuje — przekroczenie DMC o 5,2 t (~13%); kara ITD do 10 000 zł |

**🔴 Pytanie do eksperta:** Czy system ma mieć możliwość automatycznego wyliczania masy zestawu (masa własna ciągnika + naczepy + ładunek), czy klient podaje tylko masę ładunku?
**🔴 Pytanie do eksperta:** Jaki jest próg tolerancji dla danych podawanych przez klienta (np. ±2%)? Czy istnieje procedura reważenia przy odbiorze?

---

**🔵 Reguła R2:** Szerokość pojazdu wraz z ładunkiem nie może przekraczać 2,55 m dla naczep standardowych (firanka, platforma) i 2,60 m dla naczep chłodniczych — bez zezwolenia na przejazd ponadnormatywny.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Szerokość w normie | Szerokość: 2,40 m; naczepa: firanka | Parametr szerokości OK; zlecenie przechodzi dalej |
| 2 | Przekroczona szerokość — przykład z rozmowy | Szerokość: 2,63 m; naczepa standardowa (limit 2,55 m) | System flaguje jako ponadgabaryt; wymaga zezwolenia kat. I lub wyżej |
| 3 | Ładunek w normie dla chłodni | Szerokość: 2,58 m; naczepa: chłodnia (limit 2,60 m) | Parametr OK (chłodnia ma wyższy limit); zlecenie przechodzi |

---

**🔵 Reguła R3:** Wysokość pojazdu wraz z ładunkiem nie może przekraczać 4,00 m bez zezwolenia.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Wysokość w normie | Wysokość: 3,80 m | Parametr wysokości OK; zlecenie przechodzi dalej |
| 2 | Przekroczenie wysokości | Wysokość: 4,20 m | System flaguje jako ponadgabaryt; wymaga zezwolenia; pilot wymagany przy >4,5 m |

---

**🔵 Reguła R4:** Jeśli którykolwiek z parametrów przekracza limity standardowe, system musi automatycznie oznaczyć zlecenie jako wymagające zezwolenia na przejazd ponadnormatywny (kategoria I–V).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Flagowanie ponadgabarytu | Szerokość: 2,63 m; naczepa standardowa | Zlecenie automatycznie oznaczone jako wymagające zezwolenia kat. I |

**🔴 Pytanie do eksperta:** Jak jest obsługiwane zezwolenie ponadgabarytowe — czy to firma pozyskuje je sama, czy klient? Kto ponosi koszt?

---

**🔵 Reguła R5:** Zlecenie z parametrami przekraczającymi limity bez zezwolenia nie może być potwierdzone — pozostaje zablokowane do czasu uzyskania dokumentu.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Brak zezwolenia przy ponadgabarycie | Szerokość: 2,63 m; brak zezwolenia na przejazd | Potwierdzenie zlecenia zablokowane do czasu dostarczenia dokumentu |

---

**🔵 Reguła R6:** Dane dotyczące gabarytów i masy muszą być podane przez klienta jako wartości dokładne (zmierzone), nie szacunkowe — system wymaga potwierdzenia przez klienta.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Dane „na oko" | Klient wpisał: „około 20 ton" | System odrzuca zapis — wymagana wartość dokładna z potwierdzeniem |

---

### 🟡 US-3: Weryfikacja dostępności kierowcy i jego uprawnień

**Jako** dyspozytor **chcę** sprawdzić, czy w terminie realizacji zlecenia dostępny jest wypoczęty kierowca z wymaganymi uprawnieniami, **aby** nie naruszać przepisów o czasie pracy i bezpiecznie zrealizować transport.

---

**🔵 Reguła R1:** Kierowca może zostać przypisany do zlecenia wyłącznie wtedy, gdy od zakończenia poprzedniej trasy minął wymagany minimalny dzienny okres odpoczynku — co najmniej 11 godzin (regularny) lub 9 godzin (skrócony, maksymalnie 3 razy między dwoma tygodniowymi odpoczynkami) zgodnie z Rozporządzeniem WE 561/2006.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Kierowca wypoczęty, ładunek zwykły | Kierowca A: wrócił 14 h temu; ładunek: palety | Kierowca dostępny; zlecenie można potwierdzić |
| 2 | Kierowca zbyt krótko odpoczywał | Kierowca B: wrócił 7 h temu; zlecenie startuje za 2 h | Kierowca niedostępny — brak wymaganego min. odpoczynku 9 h; system blokuje przypisanie |

**🔴 Pytanie do eksperta:** Czy system integruje się z tachografem cyfrowym w czasie rzeczywistym, czy dyspozytor wpisuje dane ręcznie z raportu?
**🔴 Pytanie do eksperta:** Co jeśli kierowca ma wystarczający odpoczynek, ale jego karta tachografu jest uszkodzona lub niedostępna?

---

**🔵 Reguła R2:** Kierowca musi mieć aktualny tygodniowy odpoczynek — co najmniej 45 godzin regularnego odpoczynku tygodniowego nie może być pominięty.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Kierowca bez odpoczynku tygodniowego | Kierowca C: nie miał 45 h odpoczynku tygodniowego w bieżącym tygodniu | Kierowca niedostępny — obowiązkowy odpoczynek tygodniowy jeszcze nie zrealizowany; system blokuje przypisanie |

---

**🔵 Reguła R3:** W przypadku transportu materiałów niebezpiecznych (ADR) kierowca musi posiadać aktualne zaświadczenie ADR odpowiednie dla klasy przewożonego towaru (zaświadczenie ważne 5 lat od egzaminu).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | ADR wymagane, kierowca bez certyfikatu | Ładunek: materiały klasy 3 (łatwopalne ciecze); Kierowca D: brak ADR | System blokuje — brak uprawnienia ADR; szuka innych kierowców z ADR klasy 3 |
| 2 | ADR wymagane, kierowca z certyfikatem | Ładunek: materiały klasy 3; Kierowca E: ADR ważne do 2027 | Kierowca dostępny i uprawniony; zlecenie przechodzi |

**🔴 Pytanie do eksperta:** Czy ADR jest weryfikowane per klasa towaru (1–9), czy wystarczy ogólne zaświadczenie ADR?

---

**🔵 Reguła R4:** Jeśli żaden dostępny kierowca nie spełnia warunków odpoczynku i/lub uprawnień w wymaganym terminie, zlecenie nie może zostać potwierdzone na ten termin.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Brak dostępnych kierowców w terminie | Wszyscy 3 kierowcy odpoczywają — żaden nie spełnia min. odpoczynku | System informuje: brak dostępności w żądanym terminie; proponuje najbliższy możliwy termin |

---

### 🟡 US-4: Weryfikacja dostępności pojazdu

**Jako** dyspozytor **chcę** sprawdzić, czy odpowiedni pojazd jest wolny i sprawny technicznie w planowanym terminie, **aby** nie przypisać do zlecenia pojazdu już zajętego lub w serwisie.

---

**🔵 Reguła R1:** Pojazd może być przypisany do zlecenia wyłącznie wtedy, gdy nie jest aktualnie przypisany do innego zlecenia w nakładającym się terminie.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Pojazd wolny i sprawny | Naczepa FIR-001: wolna, przegląd ważny do 2025-12; zlecenie: 2025-01-15 | Pojazd dostępny; przypisanie możliwe |
| 2 | Pojazd zajęty innym zleceniem | Naczepa FIR-001: przypisana do zlecenia #442 (14–16 sty); nowe zlecenie: 15 sty | System blokuje — konflikt terminów; wskazuje alternatywne dostępne pojazdy |

**🔴 Pytanie do eksperta:** Czy system obsługuje rezerwację pojazdu „wstępną" (miękką) przed potwierdzeniem zlecenia?
**🔴 Pytanie do eksperta:** Jak długo pojazd pozostaje zablokowany po przypisaniu zlecenia — do faktycznego załadunku czy do powrotu?
**🔴 Pytanie do eksperta:** Kto ma uprawnienia do ręcznego odblokowania pojazdu (np. w przypadku anulowania zlecenia)?

---

**🔵 Reguła R2:** Pojazd będący w serwisie (planowanym lub awaryjnym) nie może być przypisany do żadnego zlecenia na czas trwania serwisu.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Pojazd w serwisie | Chłodnia CHL-003: w serwisie 12–20 sty; nowe zlecenie: 18 sty | System blokuje — pojazd niedostępny; sugeruje inną chłodnię |

---

**🔵 Reguła R3:** Typ pojazdu przypisywanego do zlecenia musi być zgodny z wybranym typem naczepy (US-1) — nie można przypisać ciągnika z firanką, gdy zlecenie wymaga platformy.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Zły typ pojazdu | Zlecenie wymaga platformy; dostępna tylko firanka | System informuje o braku platformy w danym terminie |

---

### 🟡 US-5: Obsługa zleceń pilnych (czas załadunku < 12 godzin)

**Jako** dyspozytor **chcę** obsłużyć zlecenie z wymaganym załadunkiem w ciągu 12 godzin w skróconej ścieżce decyzyjnej z automatyczną dopłatą, **aby** sprawnie realizować ekspresowe zlecenia przy zachowaniu opłacalności.

---

**🔵 Reguła R1:** Zlecenie z deklarowanym czasem do załadunku krótszym niż 12 godzin jest automatycznie oznaczane jako „pilne" i kierowane na skróconą ścieżkę weryfikacji.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Zlecenie ekspresowe | Czas do załadunku: 8 h | System automatycznie oznacza zlecenie jako „pilne" |
| 2 | Zlecenie standardowe (poza progiem) | Czas do załadunku: 36 h | Zlecenie standardowe — brak oznaczenia „pilne"; pełna ścieżka weryfikacji |
| 3 | Granica 12 godzin | Czas do załadunku: dokładnie 12 h | 🔴 Wymaga wyjaśnienia: czy 12 h to „pilne" czy „standardowe"? |

**🔴 Pytanie do eksperta:** Czy próg 12 godzin jest twardy (włącznie = pilne, czy 12 h = standardowe)?

---

**🔵 Reguła R2:** Do każdego zlecenia pilnego jest automatycznie doliczana dopłata ekspresowa w wysokości 20% ceny bazowej.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Wyliczenie dopłaty ekspresowej | Czas do załadunku: 8 h; cena bazowa: 5 000 zł | Dopłata: 1 000 zł (20%); cena łączna: 6 000 zł |

**🔴 Pytanie do eksperta:** Czy dopłata 20% jest stała, czy skaluje się wraz ze skróceniem czasu (np. >50% za <4 h)?
**🔴 Pytanie do eksperta:** Czy pilność dotyczy też nocnych lub weekendowych zleceń? Czy wtedy dopłata jest inna?

---

**🔵 Reguła R3:** Standardowa procedura weryfikacji (pełny obieg dokumentów) nie jest wymagana przed potwierdzeniem zlecenia pilnego — decyzja operacyjna może zostać podjęta przez upoważnionego dyspozytora bez pełnego obiegu.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Zlecenie pilne — brak pełnego obiegu | Czas do załadunku: 8 h; dyspozytor upoważniony | Zlecenie potwierdzone bez pełnego obiegu dokumentów; decyzja operacyjna dyspozytora wystarczy |

**🔴 Pytanie do eksperta:** Kto jest upoważniony do potwierdzenia zlecenia pilnego w skróconej ścieżce — tylko szef działu, czy każdy dyspozytor?

---

**🔵 Reguła R4:** Zlecenie pilne bez dostępnego kierowcy lub pojazdu w ciągu 12 godzin musi zostać odrzucone lub przekierowane — nie można go potwierdzić bez zasobów.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Zlecenie ekspresowe, brak zasobów | Czas do załadunku: 6 h; brak dostępnych kierowców | Zlecenie odrzucone — brak możliwości realizacji w terminie |

---

### 🟡 US-6: Weryfikacja dokumentacji ADR dla ładunków niebezpiecznych

**Jako** dyspozytor **chcę** sprawdzić kompletność dokumentacji ADR przed przyjęciem zlecenia dotyczącego materiałów niebezpiecznych, **aby** transport był zgodny z przepisami i nie narażał firmy na odpowiedzialność prawną.

---

**🔵 Reguła R1:** Każde zlecenie dotyczące materiałów niebezpiecznych musi zawierać przed potwierdzeniem: dokument przewozowy z numerem UN towaru i prawidłową nazwą przewozową, instrukcje pisemne dla kierowcy (w języku zrozumiałym dla kierowcy), zaświadczenie ADR kierowcy (ważne 5 lat) oraz list przewozowy CMR.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Pełna dokumentacja ADR | Klasa 3 (benzyna); nr UN: 1203; dok. przewozowy: TAK; instrukcje: TAK; ADR kierowcy: TAK (ważne 2027); CMR: TAK; certyfikat pojazdu: TAK | Dokumentacja kompletna; zlecenie przechodzi do weryfikacji zasobów |

**🔴 Pytanie do eksperta:** Czy system automatycznie klasyfikuje ładunki jako ADR na podstawie słów kluczowych w opisie (np. „chemikalia", „gazy"), czy opiera się wyłącznie na deklaracji klienta?
**🔴 Pytanie do eksperta:** Jak postępować, gdy klient twierdzi, że towar jest zwolniony z ADR (np. ilości wyłączone)? Kto weryfikuje tę deklarację?

---

**🔵 Reguła R2:** Brak choćby jednego z wymaganych dokumentów ADR blokuje przyjęcie zlecenia — nie można go potwierdzić ani nawet wstępnie zarezerwować pojazdu.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Brak zaświadczenia ADR kierowcy | Klasa 3; wszystkie dok. OK; ADR kierowcy: BRAK | Zlecenie zablokowane — przypisanie kierowcy niemożliwe; system szuka kierowców z ADR klasy 3 |

---

**🔵 Reguła R3:** Świadectwo dopuszczenia pojazdu ADR musi być aktualne i odpowiadać klasie przewożonych materiałów niebezpiecznych.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Przeterminowane świadectwo ADR pojazdu | Certyfikat pojazdu wygasł 3 miesiące temu | Zlecenie zablokowane — pojazd nie może być użyty do ADR bez aktualnego certyfikatu |

---

**🔵 Reguła R4:** Jeśli dokumentacja jest niekompletna, zlecenie przechodzi w status „oczekujące na dokumenty" — nie jest odrzucane, ale blokuje ostateczne potwierdzenie do czasu uzupełnienia.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Brak dokumentu przewozowego z nr UN | Klasa 3; brak nr UN w dokumencie | Status: „oczekujące na dokumenty"; klient jest informowany o brakach; zlecenie nie jest odrzucane |
| 2 | Materiały nieoznaczone jako ADR przez klienta | Klient deklaruje „chemikalia przemysłowe" bez klasy ADR | 🔴 Wymaga wyjaśnienia — patrz pytania |

**🔴 Pytanie do eksperta:** Czy firma posiada doradcę DGSA (Dangerous Goods Safety Adviser) i czy jest on konsultowany przy każdym zleceniu ADR?

---

### 🟡 US-7: Weryfikacja dokumentacji celnej przy przewozach międzynarodowych

**Jako** dyspozytor **chcę** sprawdzić kompletność dokumentów celnych przed przyjęciem zlecenia międzynarodowego, **aby** uniknąć zatrzymania ładunku na granicy i opóźnień w całym łańcuchu dostaw.

---

**🔵 Reguła R1:** Każde zlecenie dotyczące przewozu poza obszar UE lub do Polski spoza UE musi zawierać przed potwierdzeniem: fakturę handlową (z danymi sprzedawcy/kupującego, opisem towaru, wartością, warunkami INCOTERMS, masą netto/brutto), list przewozowy CMR, specyfikację pakowania (packing list) oraz świadectwo pochodzenia towaru.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Pełna dokumentacja celna (spoza UE) | Import z Niemiec do Polski; faktura: TAK; CMR: TAK; packing list: TAK; świadectwo pochodzenia: TAK | Dokumentacja kompletna; zlecenie przechodzi do weryfikacji operacyjnej |
| 2 | Transport wewnątrz UE — brak wymogu celnego | Transport Polska → Francja (UE → UE) | Odprawa celna nie dotyczy (rynek wewnętrzny UE); standard CMR wystarczy |

**🔴 Pytanie do eksperta:** Czy system obsługuje transport wewnątrz UE inaczej niż poza UE, czy weryfikacja dokumentów jest taka sama dla obu przypadków?
**🔴 Pytanie do eksperta:** Kto w firmie odpowiada za merytoryczną weryfikację faktury handlowej (poprawność INCOTERMS, wartość celna)? Dyspozytor czy dedykowany agent celny?

---

**🔵 Reguła R2:** Brak kompletu dokumentów celnych powoduje zawieszenie zlecenia w statusie „oczekujące na dokumenty" — zlecenie nie może być potwierdzone, ale nie jest odrzucane.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Brak faktury handlowej | Import spoza UE; brak faktury; CMR: TAK; packing list: TAK | Status: „oczekujące na dokumenty"; klient informowany o braku faktury; zlecenie zablokowane |
| 2 | Brak świadectwa pochodzenia | Eksport do UK; faktura: TAK; CMR: TAK; brak świadectwa pochodzenia | Status: „oczekujące"; klient powiadamiany; zablokowana finalna weryfikacja |

---

**🔵 Reguła R3:** Klient może dosłać brakujące dokumenty na późniejszym etapie — dopiero po ich wpłynięciu do systemu zlecenie jest odblokowywane do finalnej weryfikacji.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Klient dosyła dokumenty po terminie | Zlecenie zawieszone; brakująca faktura dostarczona 2 dni później | Zlecenie odblokowane — przechodzi do finalnej weryfikacji; termin załadunku aktualizowany |

---

**🔵 Reguła R4:** Jeśli towar podlega ograniczeniom handlowym (pozwolenia importowe/eksportowe MRiT, certyfikaty CITES), odpowiednie zezwolenia muszą zostać dostarczone przed potwierdzeniem zlecenia.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Towar objęty pozwoleniem eksportowym | Eksport sprzętu objętego kontrolą MRiT; brak pozwolenia eksportowego | Zlecenie zablokowane — wymagane pozwolenie eksportowe przed potwierdzeniem |

**🔴 Pytanie do eksperta:** Czy firma posiada status AEO (Authorised Economic Operator), który upraszcza odprawy?

---

### 🟡 US-8: Zarządzanie przestrzenią magazynową przy tymczasowym składowaniu

**Jako** dyspozytor **chcę** sprawdzić dostępność odpowiedniej strefy magazynowej i zarezerwować miejsce dla ładunku wymagającego tymczasowego składowania, **aby** zapewnić ciągłość operacji gdy towar nie może być natychmiast dostarczony do odbiorcy.

---

**🔵 Reguła R1:** Przed przyjęciem towaru do składu system musi zweryfikować dostępność miejsca w strefie odpowiedniej dla danej kategorii ładunku: strefa sucha (towary niewymagające specjalnych warunków), strefa chłodnicza (0°C–8°C), strefa mroźnicza (poniżej -18°C).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Towar suchy, miejsce dostępne | Kategoria: sucha; potrzeba: 20 palet; dostępność strefy suchej: 50 palet wolnych | Rezerwacja 20 palet w strefie suchej; potwierdzenie dostępności |

**🔴 Pytanie do eksperta:** Jaka jest całkowita pojemność każdej strefy (palety/m²)? Czy pojemność jest stała, czy zmienia się sezonowo?

---

**🔵 Reguła R2:** Towar nie może być umieszczony w strefie nieodpowiedniej dla jego kategorii — np. towar wymagający chłodzenia nie może trafiać do strefy suchej.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Błędna kategoria strefy | Towar: świeże warzywa (wymaga 2–6°C); klient wnioskuje o strefę suchą | System blokuje — niezgodność kategorii; automatycznie proponuje strefę chłodniczą |

---

**🔵 Reguła R3:** Klient może z wyprzedzeniem zablokować (zarezerwować) określoną ilość przestrzeni magazynowej — rezerwacja jest wówczas uwzględniana w wycenie zlecenia.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Klient rezerwuje miejsce z wyprzedzeniem | Klient retail: 30 palet strefa sucha, 3 dni przed kampanią promocyjną | Rezerwacja przyjęta; koszt składowania uwzględniony w wycenie |

**🔴 Pytanie do eksperta:** Czy rezerwacja miejsca magazynowego blokuje fizyczne miejsce od razu, czy dopiero od daty przyjęcia towaru?

---

**🔵 Reguła R4:** Każda kategoria magazynowa (sucha, chłodnicza, mroźnicza) posiada odrębną, ograniczoną pulę miejsc — przekroczenie dostępnej pojemności w danej kategorii uniemożliwia przyjęcie kolejnego towaru do tej strefy.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Mrożonki, brak miejsca w mroźni | Kategoria: mroźnia (-18°C); potrzeba: 10 palet; dostępność mroźni: 0 wolnych miejsc | System blokuje — brak miejsca w mroźni; klient informowany; zlecenie nie może być przyjęte |

---

**🔵 Reguła R5:** Magazynowanie jest usługą dodatkową — nie jest standardowo dołączane do każdej oferty, lecz aktywowane na wniosek klienta lub gdy okoliczności operacyjne uniemożliwiają natychmiastowe dostarczenie towaru.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Opóźniony odbiór — przykład z rozmowy | Transport z Niemiec, wjazd piątek, odbiór poniedziałek; kategoria: sucha | Automatyczne wskazanie magazynu jako konieczne; rezerwacja na weekend (2 dni w cenie transportu) |

**🔴 Pytanie do eksperta:** Jak jest obsługiwane przedłużenie składowania ponad czas deklarowany przez klienta — czy system automatycznie nalicza dodatkowe opłaty?

---

### 🟡 US-9: Wycena usługi składowania tymczasowego

**Jako** specjalista ds. wycen **chcę** automatycznie naliczyć koszt składowania na podstawie kategorii strefy i liczby dni składowania, **aby** klient otrzymał transparentną wycenę i firma pokrywała rzeczywiste koszty operacyjne.

---

**🔵 Reguła R1:** Pierwsze dwa dni składowania są wliczone w cenę usługi transportowej (brak dodatkowej opłaty).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Składowanie dokładnie 2 dni | Kategoria: sucha; liczba dni: 2 | Opłata za składowanie: 0 zł (wliczone w cenę transportu) |
| 2 | Składowanie 1 dzień | Kategoria: sucha; liczba dni: 1 | Opłata: 0 zł (mieści się w 2 dniach wliczonych) |

**🔴 Pytanie do eksperta:** Czy „dzień" rozliczeniowy to 24 godziny od przyjęcia towaru, czy kalendarzowa doba (do 24:00)?
**🔴 Pytanie do eksperta:** Co jeśli klient nie odbiera towaru po upłynięciu deklarowanego czasu składowania? Czy istnieje maksymalny czas składowania i procedura eskalacji?

---

**🔵 Reguła R2:** Każdy kolejny dzień składowania po dwóch dniach wliczonych powoduje naliczenie dodatkowej opłaty dziennej — stawka jest zależna od kategorii strefy (sucha / chłodnicza / mroźnicza).

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Składowanie 5 dni, strefa sucha | Kategoria: sucha; liczba dni: 5; stawka sucha: X zł/dzień | Opłata: 3 × X zł (3 dni ponad limit wliczone); pozycja na wycenie |
| 2 | Składowanie 4 dni, chłodnia | Kategoria: chłodnicza; liczba dni: 4; stawka chłodnia: Y zł/dzień | Opłata: 2 × Y zł (2 dni ponad limit) |

**🔴 Pytanie do eksperta:** Jakie są konkretne stawki dzienne dla każdej kategorii strefy (sucha / chłodnicza / mroźnicza)? Bez tych danych przykłady są niekompletne.

---

**🔵 Reguła R3:** Każda kategoria magazynowa ma odrębną stawkę dzienną — mroźnia jest droższa od chłodni, chłodnia jest droższa od strefy suchej.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Porównanie stawek: sucha vs. chłodnia | Składowanie 3 dni; raz strefa sucha (X zł/dzień), raz chłodnia (Y zł/dzień) | Opłata za suchą: 1 × X zł; opłata za chłodnię: 1 × Y zł; Y > X |
| 2 | Porównanie stawek: chłodnia vs. mroźnia | Składowanie 3 dni; raz chłodnia (Y zł/dzień), raz mroźnia (Z zł/dzień) | Opłata za chłodnię: 1 × Y zł; opłata za mroźnię: 1 × Z zł; Z > Y |

**🔴 Pytanie do eksperta:** Czy stawki za składowanie różnią się w zależności od wymiarów/masy towaru (np. cena za paletę vs. m²), czy są ryczałtowe?

---

**🔵 Reguła R4:** Koszt składowania musi być jasno wyszczególniony jako odrębna pozycja na wycenie — klient musi wiedzieć, za co płaci.

**🟢 Przykład:**

| # | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|---|-----------|----------------|-----------------|
| 1 | Wycena ze składowaniem | Transport 5 000 zł; składowanie 5 dni strefa sucha: 3 × X zł | Wycena zawiera 2 pozycje: „transport: 5 000 zł" i „składowanie (3 dni): 3X zł" — wyszczególnione osobno |

---

## Podsumowanie

| ID | Tytuł User Story | Reguły | Przykłady | Pytania |
|----|-----------------|--------|-----------|---------|
| US-1 | Dobór typu naczepy | 4 | 5 | 3 |
| US-2 | Weryfikacja gabarytów i masy | 6 | 7 | 3 |
| US-3 | Dostępność kierowcy i uprawnienia | 4 | 5 | 3 |
| US-4 | Dostępność pojazdu | 3 | 4 | 3 |
| US-5 | Zlecenia pilne (<12 h) | 4 | 6 | 4 |
| US-6 | Dokumentacja ADR | 4 | 5 | 3 |
| US-7 | Dokumentacja celna | 4 | 6 | 3 |
| US-8 | Zarządzanie przestrzenią magazynową | 5 | 5 | 3 |
| US-9 | Wycena składowania tymczasowego | 4 | 7 | 4 |

---

## Wartości prawne użyte w przykładach (zweryfikowane)

| Parametr | Wartość | Podstawa |
|---------|---------|---------|
| Max. szerokość zestawu standardowego | 2,55 m | Rozp. MI Dz.U.2024.502 |
| Max. szerokość naczepy chłodniczej | 2,60 m | j.w. (wyjątek dla izotermalnych) |
| Max. wysokość z ładunkiem | 4,00 m | j.w. |
| DMC zestawu 5-osiowego | 40 t | Prawo o ruchu drogowym / UE |
| Kara ITD za przekroczenie DMC | 1 000–10 000 zł | Taryfikator ITD 2024 |
| Min. odpoczynek dzienny (regularny) | 11 h | Rozp. WE 561/2006 |
| Min. odpoczynek dzienny (skrócony) | 9 h | j.w. |
| Min. odpoczynek tygodniowy | 45 h | j.w. |
| Ważność zaświadczenia ADR | 5 lat | Ustawa o przewozie towarów niebezpiecznych |
| Próg ponadgabaryt (szerokość) | > 2,55 m | Prawo o ruchu drogowym |
