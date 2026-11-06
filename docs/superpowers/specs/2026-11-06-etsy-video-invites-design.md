# Etsy: animowane zaproszenia wideo FrameCore Works. Spec

Data: 2026-11-06
Status: do akceptacji

## 1. Cel i kryteria sukcesu

Sklep FrameCore Works na Etsy sprzedający animowane zaproszenia wideo w dwóch wariantach: szablon Canva do samodzielnej edycji oraz wersja personalizowana renderowana z danych klienta. Agent (Claude Code + fal + Remotion/HyperFrames) przyspiesza produkcję, ale każdą ofertę publikuje człowiek.

Ograniczenia:
- Czas właściciela: 3–5 h tygodniowo.
- Zgodność z zasadami Etsy (Creativity Standards, aktualizacja AI z 22.10.2026): ujawnienie AI, realny wkład twórczy przy każdym produkcie, brak publikacji przez bota.
- Rynek: USA i UK, język angielski.
- Samodzielne repo, bez integracji z Workbenchem.

Kryteria sukcesu:
- Fala 1: 10 ofert live do 1 grudnia 2026.
- Pierwsza sprzedaż do 31 stycznia 2027.
- Po 8 tygodniach od startu: decyzja skaluj albo zmień kierunek, na podstawie podsumowań tygodniowych.

## 2. Zakres pierwszego wydania

Fala 1 (do 1.12.2026): 5 szablonów ślubnych (botaniczny, minimal, vintage, nowoczesny, watercolor), każdy w odmianie save the date i zaproszenie, czyli 10 ofert. Tylko personalizacja.

Fala 2 (do 15.01.2027): urodziny dziecięce, okrągłe urodziny 30/40/50, baby announcement, gender reveal. Wersje Canva dla 3 najlepiej sprzedających się szablonów z fali 1 (budowane ręcznie w Canvie na tych samych grafikach).

Cennik (oferty w EUR):

| Produkt | Cena |
|---|---|
| Szablon Canva | 12–15 € |
| Personalizacja standard, proof w 48 h | 35 € |
| Ekspres 24 h | +15 € |
| Format 16:9 | +10 € |
| Ilustracja pary lub sali | +25 € |

Poza zakresem v1: wersje językowe PL/DE, strona RSVP, Etsy Ads, inne marketplace'y.

## 3. Architektura

Prywatne repo `FrameCoreWorks/etsy-invites` (dane klientów, więc nie publiczne).

```
templates/<slug>/
  template.json     silnik (remotion|hyperframes), pola, formaty, czas trwania
  src/              kompozycja
  assets/           grafiki (fal + poprawki ręczne)
  CREATION.md       prompty i decyzje człowieka (dowód wkładu twórczego)
render/
  remotion/         wspólny projekt Remotion, rejestruje szablony remotion
  hyperframes/      wrapper CLI HyperFrames
  render.ts         jedno wejście: (slug, dane, tryb proof|final) -> MP4
.claude/skills/
  new-template/     moduł 2
  listing-draft/    moduł 3
.github/workflows/
  intake.yml        co 30 min: nowe odpowiedzi z formularza -> Issues
  render.yml        render proofu i finału, sterowany komentarzami w Issue
  research.yml      raz w tygodniu: raport rynku
  digest.yml        raz w tygodniu: podsumowanie sprzedaży
```

Kontrakt `template.json`:
- `engine`: `remotion` albo `hyperframes`.
- `fields`: lista pól z typem (text, date, image, color), limitem znaków i wartością przykładową.
- `formats`: `9x16` (domyślny), opcjonalnie `16x9`.
- `durationSec`.

`render.ts` wybiera silnik z `template.json`. Reszta pipeline'u nie wie, jakiego silnika użyto.

Licencje: Remotion na darmowej licencji (firma do 3 osób, automatyzacja dozwolona). Gdy FrameCore Works przekroczy 3 osoby, wymagana płatna licencja. HyperFrames na Apache 2.0.

## 4. Przepływ zamówienia (moduł 4)

1. Zakup na Etsy. Plik do pobrania (PDF) i automatyczna wiadomość Etsy zawierają link do formularza (Google Forms z polami ze schematu szablonu, numer zamówienia Etsy jako pole obowiązkowe).
2. `intake.yml` co 30 min czyta nowe odpowiedzi (Google Sheets API) i zakłada Issue: numer zamówienia, szablon, dane, opcje dodatkowe, termin.
3. `render.yml` renderuje proof: 540×960, znak wodny, link w komentarzu. Właściciel dostaje powiadomienie z aplikacji GitHub.
4. Komentarz `/approve`: render finału 1080×1920 (+16:9, jeśli wykupione), upload na Google Drive (folder per zamówienie, link do odczytu), link w komentarzu, etykieta `ready-to-send`.
   Komentarz `/fix: <opis>`: Claude Code (akcja GitHub) poprawia dane lub kompozycję, nowy proof.
5. Właściciel wysyła link klientowi w wiadomości Etsy (ręcznie) i zamyka Issue.
6. `cleanup` (część `digest.yml`): usuwa dane osobowe z Issues i pliki z Drive 30 dni po zamknięciu.

Obsługa błędów:
- Walidacja danych przed renderem (limity znaków, format daty, rozmiar zdjęcia). Błąd: etykieta `needs-info` i gotowa wiadomość do klienta w komentarzu.
- Nieudany render: 1 automatyczny retry, potem etykieta `render-failed` i log w komentarzu.
- Zamówienie bez odpowiedzi w formularzu po 48 h: przypomnienie w podsumowaniu tygodnia.

## 5. Agent: moduły 1, 2, 3, 5

| Moduł | Agent | Właściciel |
|---|---|---|
| 1. Research (`research.yml`, co tydzień) | Etsy Open API v3 (własny klucz, bez scrapowania): oferty w docelowych frazach, ceny, ulubione, wiek. Google Trends, kalendarz sezonów. Issue z 3 propozycjami szablonów. | Wybiera kierunek. |
| 2. Nowy szablon (skill `new-template`) | Brief, moodboard, grafiki w fal, kompozycja, `template.json`, podgląd. Zapis do `CREATION.md`. | Akceptuje styl, wprowadza poprawki. |
| 3. Szkic oferty (skill `listing-draft`) | Wideo do oferty 10–15 s, mockupy, tytuł, 13 tagów, opis z ujawnieniem AI (copy-voice + humanizer), szkic przez `aserper/etsy-mcp` (MIT) rozszerzony o upload plików. | Sprawdza, zaznacza flagę AI, publikuje. |
| 5. Podsumowanie (`digest.yml`, co tydzień) | Sprzedaż, wyświetlenia, konwersja, propozycje poprawek. | Czyta. |

Granice agenta: nie publikuje ofert, nie pisze do klientów, nie zmienia cen.

## 6. Sekrety i konta

Sekrety GitHub: klucz Etsy API, konto serwisowe Google (Sheets + Drive), klucz fal, token do akcji Claude Code. Żaden sekret w kodzie ani w Issues.

Do założenia przez właściciela: sklep Etsy, aplikacja Etsy (osobista, dostęp tylko do własnego sklepu), Google Form + Sheet, folder Drive, repo prywatne.

## 7. Testy

- `render.ts`: test na danych przykładowych każdego szablonu, porównanie klatek kluczowych (snapshot) w CI.
- Walidacja pól: testy jednostkowe dla limitów i formatów.
- `intake.yml`: test na arkuszu testowym.
- Pomiar czasu renderu pierwszego szablonu na runnerze Linux, żeby potwierdzić budżet 2000 min/mies.

## 8. Ryzyka i otwarte punkty

- Etsy API prawdopodobnie nie pozwala wysyłać wiadomości do kupujących, więc wysyłka linku zostaje ręczna. Do potwierdzenia w dokumentacji.
- Flaga „made with AI” prawdopodobnie niedostępna przez API, więc zaznaczana ręcznie.
- Limity Etsy API (raport mówi o 10 000 zapytań dziennie) do potwierdzenia.
- Formalności w Polsce (JDG, VAT-UE dla opłat Etsy, stawka ryczałtu) do ustalenia z księgową przed startem sprzedaży.
- Koszt grafik w fal na szablon do zmierzenia przy pierwszym szablonie.
