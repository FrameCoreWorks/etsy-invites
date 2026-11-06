import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { forms, type forms_v1 } from '@googleapis/forms';
import { googleAuth } from '../google/auth';
import { headerKey } from './formMap';
import type { FormResponse } from './intake';

export function mapFormResponse(slug: string, items: forms_v1.Schema$Item[], r: forms_v1.Schema$FormResponse): FormResponse {
  const keyById = new Map<string, string>();
  for (const i of items) {
    const id = i.questionItem?.question?.questionId;
    const key = i.title ? headerKey(i.title) : null;
    if (id && key) keyById.set(id, key);
  }
  const answers: Record<string, string> = {};
  for (const [id, a] of Object.entries(r.answers ?? {})) {
    const key = keyById.get(id);
    const values = a.textAnswers?.answers?.map((x) => x.value ?? '') ?? [];
    if (key && values.length) answers[key] = values.join(', ');
  }
  return { responseId: r.responseId!, slug, submittedAt: r.lastSubmittedTime!, answers };
}

/** All responses from every form in config/forms.json. */
export async function listAllResponses(configPath = path.resolve(import.meta.dirname, '../../config/forms.json')): Promise<FormResponse[]> {
  const config: Record<string, { formId: string }> = JSON.parse(await readFile(configPath, 'utf8'));
  const api = forms({ version: 'v1', auth: googleAuth() });
  const out: FormResponse[] = [];
  for (const [slug, { formId }] of Object.entries(config)) {
    const items = (await api.forms.get({ formId })).data.items ?? [];
    let pageToken: string | undefined;
    do {
      const page = await api.forms.responses.list({ formId, pageToken });
      for (const r of page.data.responses ?? []) out.push(mapFormResponse(slug, items, r));
      pageToken = page.data.nextPageToken ?? undefined;
    } while (pageToken);
  }
  return out;
}
