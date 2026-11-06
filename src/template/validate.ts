import type { TemplateManifest } from './schema';

export type OrderData = Record<string, string>;

export type ValidationError = {
  field: string;
  code: 'required' | 'too_long' | 'bad_date' | 'past_date' | 'bad_color' | 'unknown_field';
  message: string;
};

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const graphemes = (s: string) => [...segmenter.segment(s.normalize('NFC'))].length;

function isoDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
}

export function validateOrderData(m: TemplateManifest, data: OrderData, today: Date = new Date()): ValidationError[] {
  const errors: ValidationError[] = [];
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  for (const f of m.fields) {
    const value = (data[f.key] ?? '').trim();
    const err = (code: ValidationError['code'], message: string) => errors.push({ field: f.key, code, message });
    if (!value) {
      if (f.required) err('required', `"${f.label}" is required.`);
      continue;
    }
    if (f.type === 'text' && f.maxLength && graphemes(value) > f.maxLength) {
      err('too_long', `"${f.label}" is too long: ${graphemes(value)} characters, the limit is ${f.maxLength}.`);
    } else if (f.type === 'date') {
      const d = isoDay(value);
      if (!d) err('bad_date', `"${f.label}" is not a valid date.`);
      else if (d.getTime() < todayUtc) err('past_date', `"${f.label}" is in the past.`);
    } else if (f.type === 'color' && !/^#[0-9a-fA-F]{6}$/.test(value)) {
      err('bad_color', `"${f.label}" should be a color like #8A9A5B.`);
    }
  }
  const known = new Set(m.fields.map((f) => f.key));
  for (const key of Object.keys(data)) {
    if (!known.has(key)) errors.push({ field: key, code: 'unknown_field', message: `Unexpected field "${key}".` });
  }
  return errors;
}

export function customerMessage(errors: ValidationError[]): string {
  const lines = errors.filter((e) => e.code !== 'unknown_field').map((e) => `- ${e.message}`);
  return [
    'Hi! Thank you for your order. Before I can prepare your proof, a few details need a quick fix:',
    '',
    ...lines,
    '',
    'Please submit the form again with the same Etsy order number and I will get started right away.',
  ].join('\n');
}
