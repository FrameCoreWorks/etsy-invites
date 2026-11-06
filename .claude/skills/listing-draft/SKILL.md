---
name: listing-draft
description: Use when preparing an Etsy listing for a finished invitation template: listing video, mockups, title, 13 tags, description, buyer PDF, and an Etsy draft that a human publishes.
---

# Szkic oferty Etsy

Wynik: `listings/<slug>/listing.json` (teksty), media w `listings/<slug>/media/`, szkic w Etsy (stan draft) i lista kontrolna dla Kamila. Agent nigdy nie publikuje oferty, nie ustawia cen poza 35 € bazowej i nie pisze do klientów.

## Warunki wstępne

- Szablon zaakceptowany przez Kamila (`CREATION.md` ma wpis akceptacji).
- Formularz istnieje: `config/forms.json` zawiera slug (inaczej `scripts/build-form.ts <slug>`).
- Do uploadu: sekrety `ETSY_API_KEY`, `ETSY_SHARED_SECRET`, `ETSY_REFRESH_TOKEN`, `ETSY_SHOP_ID`, `SECRETS_PAT` w środowisku.

## Kroki

1. **Teksty.** Napisz tytuł (do 140 znaków, fraza główna na początku), 13 tagów (każdy do 20 znaków, bez powtórzeń) i opis po angielsku dla USA/UK. Najpierw skill `framecore-work-creative-studio:copy-voice`, na końcu `framecore-work-creative-studio:humanizer`.
   Opis musi zawierać dosłownie `PERSONALIZATION_LINE` z `src/listing/check.ts`, a gdy `CREATION.md` pokazuje grafiki z AI, także `AI_DISCLOSURE`. Ustaw `usesAi` zgodnie z `CREATION.md`.
   `taxonomyId`: kategoria Etsy dla zaproszeń cyfrowych, odczytana raz z `GET /seller-taxonomy/nodes` i zapisana w `listing.json`.
2. **Media i walidacja.**
   ```
   npx tsx scripts/listing-draft.ts <slug>
   ```
   Obejrzyj wideo (12 s) i 5 obrazów. Popraw, jeśli coś jest ucięte albo nieczytelne.
3. **Szkic w Etsy** (po zgodzie Kamila na ten slug):
   ```
   npx tsx scripts/listing-draft.ts <slug> --upload
   ```
4. **Lista dla Kamila** (w wiadomości, nie w Etsy):
   - sprawdź tytuł, zdjęcia i opis w edytorze szkicu (link z wyniku skryptu),
   - zaznacz ujawnienie AI w formularzu Etsy, jeśli `usesAi`,
   - dodaj warianty: ekspres +15 €, 16:9 +10 €, ilustracja +25 €,
   - upewnij się, że Offsite Ads są wyłączone,
   - opublikuj.
