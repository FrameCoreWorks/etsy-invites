# Przegląd aserper/etsy-mcp (2026-11-06)

Repo: https://github.com/aserper/etsy-mcp, commit `77e764a` (2026-04-01), licencja MIT (c) 2026 Amit Serper. Kod przejrzany przed jakimkolwiek uruchomieniem, nic nie było uruchamiane.

| Sprawdzone | Wynik |
|---|---|
| Licencja | MIT, użycie komercyjne dozwolone, wymaga zachowania notki. |
| Zależności | `@modelcontextprotocol/sdk`, `dotenv`, `open`, `zod`. Brak telemetrii. |
| Sieć | Tylko `www.etsy.com/oauth/connect`, `api.etsy.com/v3/public/oauth/token`, `openapi.etsy.com/v3/application`. |
| Tokeny | Plik JSON z uprawnieniami 0600 (`token-store.ts`). |
| Upload | Obrazy i wideo są, pliku cyfrowego (`/listings/{id}/files`) brak, zgodnie z raportem. |
| Ryzyko | Narzędzie `update_listing` pozwala ustawić `state: "active"`, czyli opublikować ofertę. |

## Decyzja

Nie robimy forka ani serwera MCP. Ta sesja nie może zakładać repozytoriów, a potrzebujemy tylko 5 wywołań (szkic, obrazy, wideo, plik, odczyt). Logikę żądań (nagłówek `x-api-key: key:secret`, odświeżanie tokenu, multipart) zaadaptowano w `src/etsy/client.ts` z notką o licencji MIT. Klient dodatkowo blokuje ustawienie oferty jako `active` (`PublishForbidden`).

Jeśli kiedyś przyda się pełny MCP do pracy interaktywnej, można go dodać obok bez zmian w pipeline.
