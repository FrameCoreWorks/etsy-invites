/**
 * One-time: prints GOOGLE_OAUTH_JSON for the GitHub secret.
 * Usage on the Mac: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npx tsx scripts/google-login.ts
 */
import http from 'node:http';
import { OAuth2Client } from 'google-auth-library';
import { SCOPES } from '../src/google/auth';

const clientId = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
if (!clientId || !clientSecret) throw new Error('set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
const port = 53682;
const client = new OAuth2Client({ clientId, clientSecret, redirectUri: `http://127.0.0.1:${port}` });
const url = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
console.log(`Otwórz w przeglądarce i zaloguj się kontem sklepu:\n\n${url}\n`);

const server = http.createServer(async (req, res) => {
  const code = new URL(req.url ?? '/', `http://127.0.0.1:${port}`).searchParams.get('code');
  if (!code) return void res.end('Brak kodu.');
  const { tokens } = await client.getToken(code);
  res.end('Gotowe, wróć do Terminala.');
  server.close();
  console.log('Wklej to jako sekret GOOGLE_OAUTH_JSON:\n');
  console.log(JSON.stringify({ client_id: clientId, client_secret: clientSecret, refresh_token: tokens.refresh_token }));
});
server.listen(port, '127.0.0.1');
