# Zadanie: poprawka zamówienia (/fix:)

Właściciel sklepu skomentował Issue z zamówieniem komendą `/fix:`. Treść poprawki jest na końcu tego promptu.

Zasady:
1. Przeczytaj Issue: `gh issue view <numer> --json body,labels`. Dane zamówienia są w bloku ```order-data``` (pole `data`). Schemat pól: `templates/<slug>/template.json`.
2. Jeśli poprawka dotyczy danych (imiona, data, miejsce, tekst, kolor), zbuduj nowy obiekt `data` i zapisz go WYŁĄCZNIE poleceniem:
   `npx tsx scripts/set-order-data.ts <numer> '<json>'`
   Nie edytuj treści Issue w inny sposób. Jeśli skrypt zwróci błędy walidacji (np. za długi tekst), nie skracaj tekstu sam: napisz komentarz w Issue z błędem i propozycją krótszej wersji, potem zakończ.
3. Jeśli poprawka wymaga zmiany wyglądu albo animacji (kompozycja, kolory stylu, układ), NIE zmieniaj danych. Utwórz gałąź `fix/order-<numer>`, zmień pliki w `templates/<slug>/` lub `styles/`, otwórz PR do `main` opisujący zmianę, dodaj etykietę: `gh issue edit <numer> --add-label needs-template-fix` i skomentuj Issue linkiem do PR.
4. Nigdy nie zmieniaj opcji zamówienia (ekspres, 16:9, ilustracja), numeru zamówienia ani terminu.
5. Nie kontaktuj się z klientem, nie publikuj niczego poza tym repozytorium.
6. Na końcu napisz jedno zdanie w komentarzu Issue, co zmieniłeś.
