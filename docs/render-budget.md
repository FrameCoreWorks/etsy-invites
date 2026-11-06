# Budżet renderu w GitHub Actions

Pomiar: 2026-11-06, `render-benchmark` na PR #1, `ubuntu-latest` (4 vCPU, 16 GB RAM), szablon `wedding-botanical-std` (15 s, 30 fps), mediana z 3 przebiegów.

| Tryb | Czas renderu |
|---|---|
| proof 9x16 (render 1080 + FFmpeg 540×960 ze znakiem wodnym) | 0,36 min |
| final 9x16 1080×1920 | 0,28 min |
| final 16x9 1920×1080 | 0,28 min |

Setup joba (checkout, Node, `npm ci`, przeglądarka Remotion): około 0,75 min.

## Minuty na zamówienie

GitHub zaokrągla każdy job w górę do pełnej minuty.

- Proof: 0,75 + 0,36 → 2 min.
- Finał 9x16: 0,75 + 0,28 → 2 min (z 16x9 w tym samym jobie: 0,75 + 0,56 → 2 min).
- Średnio pół poprawki (`/fix:` + nowy proof, z akcją Claude Code): około 2 min.

Razem około 6 min na zamówienie. Przy 2000 min miesięcznie, minus około 300 min na CI, mieści się około **280 zamówień miesięcznie**. Próg ostrzegawczy z planu (150) nie jest zagrożony.

Do ponownego pomiaru przy szablonie HyperFrames (`minimal`) i po podmianie grafik na rastrowe z fal.
