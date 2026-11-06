import { OAuth2Client } from 'google-auth-library';

/**
 * Kamil's own Google account via OAuth refresh token (GOOGLE_OAUTH_JSON = {"client_id","client_secret","refresh_token"}).
 * Not a service account: service accounts have no Drive storage quota on a personal Gmail account.
 * The OAuth app must be set to "In production" in Google Cloud, otherwise refresh tokens expire after 7 days.
 * See docs/setup-google.md.
 */
export const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

export function googleAuth(): OAuth2Client {
  const raw = process.env.GOOGLE_OAUTH_JSON;
  if (!raw) throw new Error('GOOGLE_OAUTH_JSON is not set');
  const { client_id, client_secret, refresh_token } = JSON.parse(raw);
  const client = new OAuth2Client({ clientId: client_id, clientSecret: client_secret });
  client.setCredentials({ refresh_token });
  return client;
}
