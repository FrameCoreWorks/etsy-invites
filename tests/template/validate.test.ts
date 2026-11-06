import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadTemplate } from '../../src/template/schema';
import { validateOrderData, customerMessage } from '../../src/template/validate';

const FIXTURES = path.resolve(__dirname, '../fixtures/templates');
const TODAY = new Date('2026-11-06T12:00:00Z');
const ok = { names: 'Emma & Liam', date: '2027-06-12' };

describe('validateOrderData', async () => {
  const m = await loadTemplate('ok', FIXTURES);
  const codes = (d: Record<string, string>) => validateOrderData(m, d, TODAY).map((e) => `${e.field}:${e.code}`);

  it('accepts valid data', () => expect(codes(ok)).toEqual([]));
  it('flags missing required field', () => expect(codes({ date: ok.date })).toEqual(['names:required']));
  it('treats whitespace as missing', () => expect(codes({ ...ok, names: '   ' })).toEqual(['names:required']));
  it('allows maxLength, rejects maxLength+1', () => {
    expect(codes({ ...ok, names: 'a'.repeat(40) })).toEqual([]);
    expect(codes({ ...ok, names: 'a'.repeat(41) })).toEqual(['names:too_long']);
  });
  it('counts graphemes, not code units', () => {
    const decomposed = 'Zoë'; // "Zoë" with combining diaeresis
    expect(codes({ ...ok, names: decomposed + 'a'.repeat(37) })).toEqual([]);
    expect(codes({ ...ok, names: '👩‍❤️‍👨' + 'a'.repeat(39) })).toEqual([]);
  });
  it('rejects impossible date', () => expect(codes({ ...ok, date: '2027-02-30' })).toEqual(['date:bad_date']));
  it('rejects non-ISO date', () => expect(codes({ ...ok, date: '12/03/2027' })).toEqual(['date:bad_date']));
  it('rejects past date', () => expect(codes({ ...ok, date: '2026-11-05' })).toEqual(['date:past_date']));
  it('accepts today', () => expect(codes({ ...ok, date: '2026-11-06' })).toEqual([]));
  it('rejects bad color', () => expect(codes({ ...ok, accent: '#12345' })).toEqual(['accent:bad_color']));
  it('accepts empty optional field', () => expect(codes({ ...ok, accent: '' })).toEqual([]));
  it('flags unknown field', () => expect(codes({ ...ok, venue: 'x' })).toEqual(['venue:unknown_field']));
});

describe('customerMessage', async () => {
  const m = await loadTemplate('ok', FIXTURES);
  it('names each field with an error and hides codes', () => {
    const errs = validateOrderData(m, { names: 'a'.repeat(41), date: '2026-01-01' }, TODAY);
    const msg = customerMessage(errs);
    expect(msg).toContain('names');
    expect(msg).toContain('date');
    expect(msg).not.toMatch(/too_long|past_date/);
  });
});
