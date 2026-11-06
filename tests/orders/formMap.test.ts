import { describe, it, expect } from 'vitest';
import type { TemplateManifest } from '../../src/template/schema';
import { headerKey, buildFormSpec, ORDER_REGEX } from '../../src/orders/formMap';

const t = (slug: string, extra: Partial<TemplateManifest> = {}): TemplateManifest => ({
  slug,
  engine: 'remotion',
  durationSec: 15,
  formats: ['9x16'],
  fields: [
    { key: 'names', label: 'Couple names', type: 'text', maxLength: 40, required: true, example: 'Emma & Liam' },
    { key: 'date', label: 'Wedding date', type: 'date', required: true, example: '2027-06-12' },
  ],
  ...extra,
});

describe('headerKey', () => {
  it('extracts key in brackets', () => expect(headerKey('Couple names [names]')).toBe('names'));
  it('returns null without brackets', () => expect(headerKey('Timestamp')).toBeNull());
});

describe('buildFormSpec', () => {
  const spec = buildFormSpec(t('wedding-a'));

  it('starts with a required order number matching the regex', () => {
    const q = spec.items[0];
    expect(q.key).toBe('order');
    expect(q.required).toBe(true);
    expect(q.validation).toBe(ORDER_REGEX.source);
    expect(ORDER_REGEX.test('3456789012')).toBe(true);
    expect(ORDER_REGEX.test('#3456')).toBe(false);
  });
  it('names the template in the title', () => expect(spec.title).toContain('wedding-a'));
  it('maps date fields to the Google date question and keeps limits', () => {
    const fields = spec.items.filter((i) => ['names', 'date'].includes(i.key));
    expect(fields.map((i) => [i.key, i.type])).toEqual([['names', 'text'], ['date', 'date']]);
    expect(fields[0].title).toBe('Couple names [names]');
    expect(fields[0].maxLength).toBe(40);
  });
  it('offers 16:9 only where the template supports it', () => {
    expect(spec.items.some((i) => i.key === 'wide')).toBe(false);
    expect(buildFormSpec(t('wedding-b', { formats: ['9x16', '16x9'] })).items.some((i) => i.key === 'wide')).toBe(true);
  });
  it('has express and illustration checkboxes and no image questions', () => {
    const keys = spec.items.map((i) => i.key);
    expect(keys).toContain('express');
    expect(keys).toContain('illustration');
    expect(JSON.stringify(spec)).not.toContain('"image"');
  });
  it('rejects templates with image fields in wave 1', () => {
    const bad = t('wedding-c');
    bad.fields.push({ key: 'photo', label: 'Photo', type: 'image', required: false, example: '' });
    expect(() => buildFormSpec(bad)).toThrow(/image/);
  });
  it('every question title carries its key', () => {
    for (const i of spec.items) expect(headerKey(i.title)).toBe(i.key);
  });
});
