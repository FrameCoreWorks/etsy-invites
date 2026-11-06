import type { TemplateManifest } from '../template/schema';

/** Etsy order numbers are digits; the exact length is not documented, so 6 to 12. */
export const ORDER_REGEX = /^\d{6,12}$/;
export const EXTRA_KEYS = ['order', 'express', 'illustration', 'wide'] as const;

export type FormItem = {
  key: string;
  title: string;
  type: 'text' | 'date' | 'checkbox';
  required: boolean;
  maxLength?: number;
  validation?: string;
  help?: string;
};
export type FormSpec = { slug: string; title: string; description: string; items: FormItem[] };

/** "Couple names [names]" -> "names". Every question title carries its field key in brackets. */
export function headerKey(header: string): string | null {
  const m = /\[([a-z0-9_-]+)\]\s*$/i.exec(header);
  return m ? m[1] : null;
}

const title = (label: string, key: string) => `${label} [${key}]`;

/** One Google Form per template (Forms API cannot route sections to submit). */
export function buildFormSpec(t: TemplateManifest): FormSpec {
  const fields: FormItem[] = t.fields.map((f) => {
    if (f.type === 'image') throw new Error(`${t.slug}.${f.key}: image fields are not supported in wave 1 (Google Forms upload needs sign-in)`);
    return {
      key: f.key,
      title: title(f.label, f.key),
      type: f.type === 'date' ? 'date' : 'text',
      required: f.required,
      ...(f.maxLength ? { maxLength: f.maxLength } : {}),
      ...(f.type === 'color'
        ? { validation: '^#[0-9a-fA-F]{6}$', help: 'Hex color, e.g. #8A9A5B. Leave empty for the default.' }
        : { help: `Example: ${f.example}${f.maxLength ? ` (max ${f.maxLength} characters)` : ''}` }),
    };
  });
  const items: FormItem[] = [
    { key: 'order', title: title('Etsy order number', 'order'), type: 'text', required: true, validation: ORDER_REGEX.source, help: 'Digits only, from your Etsy receipt.' },
    ...fields,
    { key: 'express', title: title('I purchased express delivery (24 h)', 'express'), type: 'checkbox', required: false },
    { key: 'illustration', title: title('I purchased a custom illustration', 'illustration'), type: 'checkbox', required: false, help: 'Please send your reference photo in an Etsy message.' },
  ];
  if (t.formats.includes('16x9')) {
    items.push({ key: 'wide', title: title('I purchased the 16:9 version', 'wide'), type: 'checkbox', required: false });
  }
  return {
    slug: t.slug,
    title: `FrameCore Works: your video invitation (${t.slug})`,
    description: 'Fill this in after your Etsy purchase. You will receive a watermarked proof within 48 hours (24 hours with express). Use the same order number if you need to correct something.',
    items,
  };
}
