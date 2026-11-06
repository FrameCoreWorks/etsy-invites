import { GoogleAuth } from 'google-auth-library';

export const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive',
];

/** Service account from GOOGLE_SA_JSON (the JSON key as a string, stored as a GitHub secret). */
export function googleAuth(): GoogleAuth {
  const raw = process.env.GOOGLE_SA_JSON;
  if (!raw) throw new Error('GOOGLE_SA_JSON is not set');
  return new GoogleAuth({ credentials: JSON.parse(raw), scopes: SCOPES });
}
