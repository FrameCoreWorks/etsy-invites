# Etsy Open API v3: ustalenia (2026-11-06)

Źródło: schemat OpenAPI Etsy w `aserper/etsy-mcp/src/client/types.d.ts` (wygenerowany z https://www.etsy.com/openapi/generated/oas/3.0.0.json, stan z kwietnia 2026). Do ponownego sprawdzenia na żywym API po założeniu aplikacji.

| Pytanie ze specu | Odpowiedź |
|---|---|
| Upload pliku cyfrowego | `POST /v3/application/shops/{shop_id}/listings/{listing_id}/files`, multipart: `file`, `name`, `rank`. Endpoint „General Release”. |
| Flaga „made with AI” przez API | Brak takiego pola w `createDraftListing` ani `updateListing` (stan z kwietnia 2026). Zaznaczana ręcznie. |
| Wiadomości do kupujących | Brak endpointu do wysyłania wiadomości. Link wysyłany ręcznie. |
| Limity | Nie ma ich w schemacie. Klient trzyma 5 req/s. Rzeczywiste limity widać w nagłówkach odpowiedzi, sprawdzić przy pierwszym wywołaniu. |
| Nagłówek klucza | `x-api-key: <keystring>:<shared_secret>`. |
| Tokeny | OAuth 2 z PKCE, refresh token rotowany przy odświeżeniu; nowy zapisujemy do sekretu przez `SECRETS_PAT`. |
| Wymagane pola szkicu | `quantity`, `title`, `description`, `price`, `who_made`, `when_made`, `taxonomy_id`; dla plików cyfrowych `type: "download"`. |
