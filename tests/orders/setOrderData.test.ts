import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { applyFix } from '../../src/orders/setOrderData';
import { orderToIssue, parseIssueBody, type Order } from '../../src/orders/issue';

const ROOT = path.resolve(__dirname, '../../templates');
const TODAY = new Date('2026-11-06T12:00:00Z');
const order: Order = {
  order: '3456789012', slug: 'wedding-botanical-std',
  data: { names: 'Emma & Liam', date: '2027-06-12', city: 'Charleston, SC' },
  extras: { express: false, wide: false, illustration: false },
  submittedAt: '2026-11-06T10:00:00.000Z', dueAt: '2026-11-08T10:00:00.000Z', responseIds: ['r1'],
};
const body = orderToIssue(order, []).body;

describe('applyFix', () => {
  it('replaces data only and keeps the rest of the order', async () => {
    const r = await applyFix(body, { ...order.data, date: '2027-07-01' }, ROOT, TODAY);
    expect(r.ok).toBe(true);
    const o = parseIssueBody((r as { body: string }).body);
    expect(o.data.date).toBe('2027-07-01');
    expect({ ...o, data: order.data }).toEqual(order);
  });
  it('rejects data that fails validation and leaves the body unchanged', async () => {
    const r = await applyFix(body, { ...order.data, names: 'x'.repeat(41) }, ROOT, TODAY);
    expect(r).toMatchObject({ ok: false });
    expect((r as { errors: { code: string }[] }).errors[0].code).toBe('too_long');
  });
  it('rejects unknown keys such as an attempt to change extras', async () => {
    const r = await applyFix(body, { ...order.data, wide: 'Yes' }, ROOT, TODAY);
    expect(r).toMatchObject({ ok: false });
  });
});
