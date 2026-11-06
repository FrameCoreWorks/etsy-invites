# Konfiguracja Google (formularze i Dysk)

Jednorazowo, około 15 minut. Wszystko na koncie Google, które ma obsługiwać sklep.

1. https://console.cloud.google.com: nowy projekt `etsy-invites`.
2. „APIs & Services” → „Library”: włącz **Google Forms API** i **Google Drive API**.
3. „OAuth consent screen”: typ **External**, nazwa `etsy-invites`, Twój e-mail. Zakresy pomiń. Dodaj siebie jako test user.
4. Na tym samym ekranie kliknij **Publish app** (status „In production”). Bez tego token wygasa po 7 dniach i pipeline staje. Aplikacja nie musi przechodzić weryfikacji: przy logowaniu Google pokaże ostrzeżenie „unverified app”, kliknij „Advanced” → „Go to etsy-invites”.
5. „Credentials” → „Create credentials” → „OAuth client ID” → typ **Desktop app**. Skopiuj Client ID i Client secret.
6. Na Macu, w katalogu repo:

```
GOOGLE_CLIENT_ID=wklej GOOGLE_CLIENT_SECRET=wklej npx tsx scripts/google-login.ts
```

7. Wynik (jedna linia JSON) wklej jako sekret repo **GOOGLE_OAUTH_JSON**: GitHub → Settings → Secrets and variables → Actions → New repository secret.
8. Formularz dla szablonu (powstaje na Twoim koncie, link trafia do `config/forms.json`):

```
GOOGLE_OAUTH_JSON='wklej' npx tsx scripts/build-form.ts wedding-botanical-std
```

Raz w miesiącu usuń stare odpowiedzi w formularzach (Responses → ⋮ → Delete all responses). API Google nie pozwala zrobić tego automatycznie.
