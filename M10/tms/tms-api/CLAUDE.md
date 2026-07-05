# tms-api — zasady pracy z kodem

## Wielkości domenowe żyją w value objectach

W kodzie domenowym liczba, o którą można sensownie zapytać **„w jakiej
jednostce?"**, nie może być gołym `number`. Wielkości domenowe mają swoje
value objecty i to na nich wyraża się obliczenia:

- `Weight` (`src/shared/weight.ts`) — masa; kg/tony/funty,
- `Length` (`src/shared/length.ts`) — wymiar geometryczny 1D; mm/cm/m,
- `Ldm` (`src/cargo-plans/ldm/ldm.ts`) — metry ładowne (pojemność podłogi
  naczepy); to NIE jest długość geometryczna — jedyny most z geometrii to
  `Ldm.fromFloorLength`.

Zasady:

1. **Operacje na wielkościach wyrażaj metodami ich klas** (`add`,
   `isGreaterThan`, `fitsWithin`, `Length.max`, …). Jeśli metody brakuje,
   a operacja ma biznesową nazwę i realne miejsce użycia — dodaj ją do VO,
   zamiast liczyć na wyłuskanych prymitywach.
2. **Wyłuskanie do prymitywu (`valueInKg`, `valueIn(...)`, `valueInMeters`)
   jest legalne wyłącznie na granicach**: repozytoria, read modele, queries,
   klasy błędów (formatowanie komunikatów), steps testowe. Pilnuje tego
   `npm run lint:vo-leaks` — uruchom po zmianach w domenie.
3. **Liczb technicznych bez jednostki nie opakowuj** — indeksy, liczniki,
   wersje (optimistic lock), offsety paginacji to zwykłe `number` i tak ma
   zostać.
4. **Nie dodawaj do VO operacji bez miejsca wywołania.** Minimalne API jest
   deklaracją modelu (np. `Length` celowo nie ma `multiply` — w tym kontekście
   długości się sumuje i porównuje, nigdy nie mnoży). Nowa operacja wchodzi
   razem z pierwszym realnym use casem, nie „na zapas".
5. Nowa wielkość domenowa (fizyczna lub nie — pieniądze, czas trwania, procent)
   używana w więcej niż jednym miejscu → nowy VO wzorowany na `Weight`/`Length`.
   Pojęcia specyficzne dla bounded contextu (jak `Ldm`) trzymaj w module
   kontekstu, nie w `src/shared/`.
6. W razie wątpliwości, czy coś opakować — zgłoś propozycję w podsumowaniu,
   nie refaktoryzuj samowolnie.

Kontekst decyzji i pełna argumentacja: `plans/length-value-object-model.md`.

## Testy

- `npm run test:cucumber` — scenariusze Gherkin (`*.feature` + `*.steps.ts`
  obok kodu domenowego); uruchamiaj po każdej zmianie w `src/cargo-plans/`.
- `npx tsc --noEmit` — kontrakty typów.
- `npm run lint:vo-leaks` — strażnik wycieków VO (opis wyżej).
