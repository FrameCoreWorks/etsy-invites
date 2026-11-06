/**
 * One-time on the Mac: OAuth PKCE login to Etsy, prints the refresh token for the ETSY_REFRESH_TOKEN secret.
 * Usage: ETSY_API_KEY=... npx tsx scripts/etsy-login.ts
 * In the Etsy app settings, add the callback URL http://localhost:3003/callback
 */
import { createHash, randomBytes } from 'node:crypto';
import http from 'node:http';

const apiKey = process.env.ETSY_API_KEY;
if (!apiKey) throw new Error('set ETSY_API_KEY');
const redirect = 'http://localhost:3003/callback';
const verifier = randomBytes(32).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');
const state = randomBytes(16).toString('hex');
const scopes = ['listings_r', 'listings_w', 'shops_r', 'transactions_r'];
const url = `https://www.etsy.com/oauth/connect?${new URLSearchParams({ response_type: 'code', client_id: apiKey, redirect_uri: redirect, scope: scopes.join(' '), state, code_challenge: challenge, code_challenge_method: 'S256' }).toString().replace(/\+/g, '%20')}`;
console.log(`Otwórz w przeglądarce i zaloguj się na konto sklepu:\n\n${url}\n`);

const server = http.createServer(async (req, res) => {
  const q = new URL(req.url ?? '/', redirect).searchParams;
  if (q.get('state') !== state || !q.get('code')) return void res.end('Zły stan albo brak kodu.');
  const r = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: apiKey, redirect_uri: redirect, code: q.get('code')!, code_verifier: verifier }).toString(),
  });
  const body = await r.json();
  res.end('Gotowe, wróć do Terminala.');
  server.close();
  console.log('Sekret ETSY_REFRESH_TOKEN:\n');
  console.log(body.refresh_token);
  console.log(`\nShop ID (sekret ETSY_SHOP_ID) odczytasz potem: user_id z tokenu = ${String(body.access_token).split('.')[0]}`);
});
server.listen(3003, '127.0.0.1');
