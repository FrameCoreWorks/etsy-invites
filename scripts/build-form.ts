/**
 * Creates (or recreates with --force) the Google Form for a template and records it in config/forms.json.
 * Usage: GOOGLE_SA_JSON=... FORM_EDITOR_EMAIL=you@example.com npx tsx scripts/build-form.ts <slug> [--force]
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { forms } from '@googleapis/forms';
import { drive } from '@googleapis/drive';
import { googleAuth } from '../src/google/auth';
import { loadTemplate } from '../src/template/schema';
import { buildFormSpec } from '../src/orders/formMap';
import { toBatchRequests } from '../src/orders/formRequests';

export type FormsConfig = Record<string, { formId: string; responderUri: string }>;
export const FORMS_CONFIG = path.resolve(import.meta.dirname, '../config/forms.json');

const [slug] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const force = process.argv.includes('--force');
if (!slug) throw new Error('usage: build-form.ts <slug> [--force]');

const config: FormsConfig = JSON.parse(await readFile(FORMS_CONFIG, 'utf8'));
if (config[slug] && !force) {
  console.log(`${slug} already has form ${config[slug].formId}; use --force to create a new one`);
  process.exit(0);
}

const auth = googleAuth();
const f = forms({ version: 'v1', auth });
const spec = buildFormSpec(await loadTemplate(slug));
const created = await f.forms.create({ requestBody: { info: { title: spec.title, documentTitle: `etsy-invites ${slug}` } } });
const formId = created.data.formId!;
await f.forms.batchUpdate({ formId, requestBody: { requests: toBatchRequests(spec) } });
await f.forms.setPublishSettings({ formId, requestBody: { publishSettings: { publishState: { isPublished: true, isAcceptingResponses: true } } } });

const editor = process.env.FORM_EDITOR_EMAIL;
if (editor) {
  await drive({ version: 'v3', auth }).permissions.create({ fileId: formId, sendNotificationEmail: false, requestBody: { role: 'writer', type: 'user', emailAddress: editor } });
}
const responderUri = (await f.forms.get({ formId })).data.responderUri!;
config[slug] = { formId, responderUri };
await writeFile(FORMS_CONFIG, JSON.stringify(config, null, 2) + '\n');
console.log(JSON.stringify({ slug, formId, responderUri }));
