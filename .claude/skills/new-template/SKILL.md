---
name: new-template
description: Use when creating a new animated invitation template for the Etsy shop (new style or a save-the-date / invitation variant), from brief to an accepted, rendered template with CREATION.md.
---

# Nowy szablon zaproszenia

Wynik: katalog `templates/<slug>/` (manifest, kompozycja, `CREATION.md`), styl w `styles/<styl>/`, snapshot w testach, podgląd MP4 zaakceptowany przez Kamila. Skill nie kończy się bez akceptacji stylu przez człowieka (zasady Etsy: realny wkład twórczy).

## Kroki

1. **Brief.** Skill `framecore-work-creative-studio:brief-architect`: styl, paleta, typografia, nastrój, rynek USA/UK. Zapisz do `CREATION.md` → „Brief”.
2. **Grafiki.** Skill `framecore-work-creative-studio:image-prompt-architect` → prompty. **Zapytaj Kamila o zgodę na koszt fal** (podaj liczbę obrazów i szacunek). Po zgodzie generuj, pliki do `styles/<styl>/assets/`. Każdy prompt i wybór Kamila zapisuj w `CREATION.md` → „Prompty” i „Decyzje człowieka”, koszt w „Koszt fal”.
3. **Szkielet.**
   ```
   npx tsx scripts/new-template.ts <slug> <styl> remotion|hyperframes std|inv
   ```
   Slug: `wedding-<styl>-std` albo `wedding-<styl>-inv`. Dla Remotion dopisz slug do `render/remotion/registry.ts`.
4. **Kompozycja.** Remotion: skill `framecore-work-creative-studio:remotion-video-production`, komponent `styles/<styl>/SaveTheDate.tsx` lub `Invitation.tsx` (wzór: `styles/botanical/SaveTheDate.tsx`; fonty przez `styles/shared/fonts.ts`, nazwy przez `fitText`, data przez `formatDateLong`). HyperFrames: skill `framecore-work-creative-studio:hyperframes-workflow`.
   Warunki: wszystkie pola z manifestu użyte, nic nie wychodzi poza kadr przy maksymalnej długości tekstu, działa w 9:16 i 16:9, opcjonalne pola mogą być puste.
5. **Podgląd.**
   ```
   npx tsx scripts/render-cli.ts <slug> <dane.json> --mode final --out out
   ```
   Pokaż Kamilowi MP4 i klatkę z 8. sekundy. Poprawki wprowadzaj, aż zaakceptuje. Akceptację z datą wpisz do `CREATION.md`.
6. **Testy.** `npm test`: snapshot z danymi „najgorszymi” powstaje sam przy pierwszym przebiegu (`tests/__snapshots__/<slug>-worst.png`), obejrzyj go przed commitem.
7. **Commit** `feat: <slug> template`.

## Czego nie robić

- Nie generuj grafik bez zgody na koszt.
- Nie kopiuj cudzych szablonów z Etsy ani ich układu 1:1.
- Nie dodawaj pól typu `image` (fala 1, formularz Google ich nie obsłuży bez logowania).
