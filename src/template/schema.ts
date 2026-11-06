import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

export type FieldType = 'text' | 'date' | 'image' | 'color';
export type Format = '9x16' | '16x9';

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  maxLength?: number;
  required: boolean;
  example: string;
};

export type TemplateManifest = {
  slug: string;
  engine: 'remotion' | 'hyperframes';
  fields: Field[];
  formats: Format[];
  durationSec: number;
};

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export const TEMPLATES_ROOT = path.resolve(import.meta.dirname, '../../templates');

const fieldSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*$/),
    label: z.string().min(1),
    type: z.enum(['text', 'date', 'image', 'color']),
    maxLength: z.number().int().positive().optional(),
    required: z.boolean(),
    example: z.string(),
  })
  .refine((f) => f.type !== 'text' || f.maxLength !== undefined, { message: 'text field needs maxLength' });

const manifestSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    engine: z.enum(['remotion', 'hyperframes']),
    fields: z.array(fieldSchema).min(1),
    formats: z.array(z.enum(['9x16', '16x9'])).min(1),
    durationSec: z.number().positive(),
  })
  .refine((m) => m.formats.includes('9x16'), { message: 'formats must include 9x16' })
  .refine((m) => new Set(m.fields.map((f) => f.key)).size === m.fields.length, { message: 'duplicate field key' });

export async function loadTemplate(slug: string, root: string = TEMPLATES_ROOT): Promise<TemplateManifest> {
  const file = path.join(root, slug, 'template.json');
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, 'utf8'));
  } catch (e) {
    throw new TemplateError(`cannot read ${file}: ${(e as Error).message}`);
  }
  const parsed = manifestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TemplateError(`${slug}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  }
  if (parsed.data.slug !== slug) throw new TemplateError(`${slug}: slug "${parsed.data.slug}" differs from directory`);
  return parsed.data;
}

export async function listTemplates(root: string = TEMPLATES_ROOT): Promise<TemplateManifest[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const slugs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('_')).map((e) => e.name).sort();
  return Promise.all(slugs.map((s) => loadTemplate(s, root)));
}
