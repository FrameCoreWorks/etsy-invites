# Handover: Etsy, animowane zaproszenia wideo FrameCore Works (2026-11-06)

Dokument dla nowego projektu Claude. Zakłada, że czytelnik nie widział rozmowy, z której powstał. Razem z nim wgraj do projektu dwa pliki:
- `docs/superpowers/specs/2026-11-06-etsy-video-invites-design.md`: spec, zaakceptowany przez Kamila 2026-11-06.
- `Najbardziej opłacalne produkty na Etsy.md`: raport z researchu rynku.

## 1. Kontekst

Kamil prowadzi studio kreatywne FrameCore Works (motion design: Remotion, HyperFrames, Blender, generowanie AI, sound design). Chce zarabiać na Etsy na produktach cyfrowych z pomocą agenta AI (Claude Code + fal.ai).

Kolejność rozmowy:
1. Wstępna analiza: pełny autopilot (agent sam generuje i publikuje) odpada przez zasady Etsy i nasycenie rynku. Agent ma być asystentem, a człowiek publikuje.
2. Głęboki research w 4 wątkach (kategorie, ekonomia i zasady, nisze motion, narzędzia do automatyzacji). Wynik: raport.
3. Wybór niszy: animowane zaproszenia wideo.
4. Brainstorming (superpowers:brainstorming): 3 sekcje projektu zaakceptowane, spec zapisany i zaakceptowany.

## 2. Status

- DONE: research rynku (raport, około 2850 słów, źródła w tekście, twierdzenia oznaczone [dostawca] i [niezweryfikowane]).
- DONE: spec projektu, zaakceptowany przez Kamila 2026-11-06 („działamy”).
- NOT STARTED: plan wdrożenia (skill superpowers:writing-plans).
- NOT STARTED: cały kod, repo na GitHubie, sklep Etsy, konta i sekrety.

Repo istnieje tylko lokalnie w sesji chmurowej (`/home/claude/etsy-invites`, 2 commity na `main`, bez remote). Ta sesja zniknie, więc źródłem prawdy są pliki wgrane do projektu Claude. Repo `FrameCoreWorks/etsy-invites` na GitHubie trzeba dopiero założyć.

## 3. Decyzje i uzasadnienia

| Decyzja | Dlaczego |
|---|---|
| Nisza: animowane zaproszenia wideo (ślub, potem urodziny, baby announcement, gender reveal) | Około 8,3 tys. konkurencyjnych ofert dla „wedding video invitation” (trudność 26/100) wobec ponad 400 tys. statycznych szablonów ślubnych i około 1 mln planerów. Sklepy z 1,6–4,7 tys. sprzedaży przy 34–89 ofertach. Bariera umiejętności chroni przed tanim AI. Dane z RankHero i stron sklepów, listopad 2026. |
| Dwa warianty: szablon Canva + personalizacja | Wybór Kamila. Canva daje tani wolumen, personalizacja daje marżę. |
| Czas Kamila: 3–5 h tygodniowo | Wybór Kamila. Wymusza automatyczny render personalizacji. |
| Oba silniki: Remotion i HyperFrames | Wybór Kamila. Każdy szablon deklaruje silnik w `template.json`, a pipeline jest wspólny przez `render.ts`. |
| Render w GitHub Actions, nie na Macu | Wybór Kamila. Oba silniki działają na linuksowym runnerze. Remotion: darmowa licencja dla firm do 3 osób, automatyzacja dozwolona (remotion.dev/docs/license/faq, sprawdzone 2026-11-06). HyperFrames: Apache 2.0. |
| Bez integracji z Workbenchem | Wybór Kamila. Samodzielne repo, skille w `.claude/skills/`. Podpięcie można dodać później bez zmian architektury. |
| Agent nie publikuje ofert, nie pisze do klientów, nie zmienia cen | Zasady Etsy z 22.10.2026 zakazują ofert generowanych przez boty bez udziału człowieka. `CREATION.md` przy każdym szablonie dokumentuje wkład człowieka. |
| Fala 1: 5 szablonów ślubnych x 2 odmiany = 10 ofert do 1.12.2026, tylko personalizacja | Szczyt zaręczyn to grudzień–luty. Wersje Canva dopiero dla 3 bestsellerów w fali 2, do 15.01.2027. |
| Ceny w EUR: Canva 12–15 €, personalizacja 35 €, ekspres +15 €, 16:9 +10 €, ilustracja +25 € | Oferty w EUR, bo inaczej Etsy pobiera 2,5% za przewalutowanie. Mediana rynku 11–15 USD, zarabia się na personalizacji. |
| Kolejka zamówień = GitHub Issues, akceptacja komentarzem `/approve` lub `/fix:` | Akceptacja z telefonu w aplikacji GitHub, bez dodatkowej infrastruktury. |
| Formularz zamówienia: Google Forms + Sheets, odpytywane co 30 min przez `intake.yml` | Bez serwera do webhooków. |
| Rynek: USA i UK, angielski | 83% konkurencji to sprzedawcy z USA. Wersje PL/DE dopiero po pierwszych sprzedażach. |

Rozważone i odrzucone:
- Generowanie każdego zamówienia przez AI wideo (fal/Veo): wyniki niepowtarzalne, tekst z błędami, koszt za każdy render, ryzyko z zasadami Etsy.
- Pełny autopilot publikacji: zakazany przez Etsy od 22.10.2026, a flaga „made with AI” prawdopodobnie niedostępna przez API.

## 4. Kluczowe fakty z researchu

Opłaty Etsy dla sklepu z Polski (etsy.com/legal/fees, aktualizacja 2026-10-05):
- 0,20 USD za wystawienie.
- 6,5% prowizji od transakcji.
- 4% + 0,30 € za przetwarzanie płatności.
- 2,5% za przewalutowanie, gdy waluta oferty różni się od waluty wypłaty.
- Offsite Ads 15% (12% powyżej 10 tys. USD rocznie, wtedy obowiązkowe). Poniżej tego progu można je wyłączyć i trzeba to zrobić.

Przy cenie 15 USD Etsy bierze około 17–19%, a z Offsite Ads ponad 30%.

Zasady AI (Creativity Standards 2025-06-10 i aktualizacja 2026-10-22, ta druga znana z prasy, nie z pierwotnej strony Etsy):
- Ujawnienie AI w opisie i realny wkład twórczy przy każdym produkcie.
- Podgląd zawartości dla plików cyfrowych.
- Zakaz ofert z botów, wzorów i instrukcji z AI oraz paczek promptów.

API Etsy:
- Aplikacja zarządzająca tylko własnym sklepem jest zatwierdzana automatycznie.
- Szkice przez API są w porządku, masowa publikacja bez człowieka nie.
- Limity, według źródła wtórnego: 10 000 zapytań dziennie, 10 na sekundę.

Podatki w Polsce (do potwierdzenia z księgową):
- Etsy sam pobiera VAT od kupujących z UE na pliki cyfrowe.
- Opłaty Etsy to import usług. VAT trzeba od nich rozliczyć nawet przy zwolnieniu, co zwykle wymaga rejestracji VAT-UE.
- Działalność nierejestrowana nie pasuje do zorganizowanej sprzedaży, więc przewidzieć JDG.
- DAC7: Etsy raportuje dane sprzedawcy do urzędu skarbowego.

Gotowe projekty do użycia:
- `aserper/etsy-mcp` (MIT, 37 narzędzi, brak uploadu plików cyfrowych, trzeba dopisać).
- `oguzhankayan/etsy-engine` (MIT, wzorcowy pipeline od trendu do szkicu; README to marketing płatnej usługi, bez dowodów sprzedaży).
- `amitray007/etsy-python-sdk` i `Granga/etsy-ts` (MIT).
- Unikać `anitabyte/etsyv3` (GPL-3.0) i repozytoriów bez licencji.

Konkurencja wzorcowa:
- DigitalVideoinvites (4 074 sprzedaży, realizacja tego samego dnia dla zamówień przed 18:00 CST, proof mailem).
- RHIONN (4 697).
- ANIMATIONFX (1 660).
- StreamFoxxy (846 sprzedaży w około 18 miesięcy, czyli realistyczny punkt odniesienia dla nowego sklepu).

## 5. Weryfikacja

- Licencje Remotion i HyperFrames: sprawdzone 2026-11-06 na remotion.dev oraz w README heygen-com/hyperframes.
- Spec: ręczny przegląd (brak placeholderów, brak sprzeczności, brak pauz typu em dash). Commit `92e0235`.
- NIEZWERYFIKOWANE:
  - czy Etsy API pozwala wysyłać wiadomości do kupujących (zakładamy, że nie),
  - czy flagę AI da się ustawić przez API (zakładamy, że nie),
  - realne limity API,
  - czy opłata regulacyjna (Regulatory Operating Fee) obejmuje Polskę,
  - czas renderu na runnerze GitHub Actions (budżet 2000 min miesięcznie),
  - koszt grafik w fal na szablon,
  - stawka ryczałtu dla plików cyfrowych.

## 6. Blokery i sprawy po stronie Kamila

| Sprawa | Co odblokowuje |
|---|---|
| Formalności (JDG, VAT-UE, ryczałt) | Rozmowa z księgową przed pierwszą sprzedażą. |
| Sklep Etsy i aplikacja Etsy API | Kamil zakłada sklep i aplikację osobistą na developers.etsy.com. |
| Repo `FrameCoreWorks/etsy-invites` (prywatne) | Kamil zakłada repo albo daje sesji uprawnienie push. |
| Google Form + Sheet, folder Drive, konto serwisowe Google | Do założenia przy module zamówień. |
| Sekrety GitHub: Etsy API, Google, fal, token Claude Code | Wpisywane przez Kamila w ustawieniach repo. |

Żaden z tych punktów nie blokuje napisania planu wdrożenia.

## 7. Następny krok

Uruchomić skill `superpowers:writing-plans` na zaakceptowanym specu i napisać plan wdrożenia. Najpierw fala 1, w kolejności:
1. Szkielet repo + `render.ts` + pierwszy szablon ślubny w Remotion. Pomiar czasu renderu w GitHub Actions.
2. Pipeline zamówień: `intake.yml`, `render.yml`, komendy `/approve` i `/fix:`.
3. Skille `new-template` i `listing-draft` (z rozszerzeniem `etsy-mcp`).
4. Pozostałe 4 szablony ślubne.
5. `research.yml` i `digest.yml`.

Twardy termin: 10 ofert live do 1.12.2026.

## 8. Preferencje Kamila do przestrzegania

- Po polsku, krótko i konkretnie. Najpierw wynik, potem ewentualne wyjaśnienie.
- Bez pauz typu em dash w tekstach dla Kamila.
- Polecenia do Terminala i prompty w osobnych blokach kodu, gotowe do wklejenia w zsh.
- Pliki zapisywać w `/Volumes/Codex&Claude/Claude/projekty/etsy-invites/`, gdy jest dostęp do Maca. W sesji chmurowej powiedzieć to wprost i przekazać plik jako załącznik.
- Teksty sprzedażowe (opisy ofert) pisać przez copy-voice, a na końcu przepuszczać przez humanizer.
- Praca kreatywna przez wtyczkę FrameCore Works Creative Studio i jej skille.
- Przed budowaniem sprawdzać gotowe rozwiązania (GitHub, npm, PyPI) i podawać licencję.
- Pytać przed kosztownymi krokami: płatne API, generowanie wideo.

## 9. Przegląd skilli

- ✅ deep-research: 4 wątki równolegle, raport ze źródłami. Luki opisane w raporcie: ceny narzędzi SaaS i historie sklepów AI z Reddita, bo części wątków zablokowano wyszukiwanie.
- ✅ superpowers:brainstorming: ścieżka architektoniczna, pytania pojedynczo, 3 sekcje zaakceptowane, spec zapisany i zaakceptowany.
- ⚠️ Zapis na Macu: sesja chmurowa nie miała podłączonego `/Volumes/Codex&Claude`, więc pliki przekazano jako załączniki.
