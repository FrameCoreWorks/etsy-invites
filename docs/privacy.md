# Dane osobowe w zamówieniach

Dane z formularza (imiona, data, miejsce) trafiają do Issue zamówienia i do folderu Drive `etsy-invites-orders/<numer>/`. 30 dni po zamknięciu Issue `cleanup.yml` je usuwa.

## Jak działa cleanup

- Usuwa folder zamówienia z Drive.
- Z sekretem `CLEANUP_PAT`: tworzy nowe, zamknięte Issue-nagrobek (`#<numer> <slug>`, etykiety `order` i `scrubbed`, same identyfikatory odpowiedzi formularza) i kasuje oryginalne Issue razem z komentarzami i historią edycji.
- Bez `CLEANUP_PAT`: czyści treść i komentarze w miejscu. Stare wersje treści zostają w historii edycji („edited”) i trzeba je usunąć ręcznie: na Issue kliknij „edited”, wybierz każdą wersję i „Delete revision”.

Identyfikatory odpowiedzi w nagrobku sprawiają, że intake nie zaimportuje zamówienia drugi raz. Odpowiedzi zostają w Google Forms, bo Forms API nie umie ich usuwać. Usuwaj je ręcznie w formularzu raz w miesiącu (Odpowiedzi → ⋮ → Usuń wszystkie odpowiedzi), dopiero po zamknięciu wszystkich zamówień z tego formularza.

## CLEANUP_PAT

Classic PAT właściciela repo ze scope `repo` (kasowanie Issue wymaga uprawnień admina). Dodaj go jako sekret repo `CLEANUP_PAT`. Nie zostało to jeszcze sprawdzone na żywym repo.
