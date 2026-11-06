import { describe, it, expect } from 'vitest';
import { orderToIssue, parseIssueBody, type Order } from '../../src/orders/issue';

const order: Order = {
  order: '3456789012',
  slug: 'wedding-botanical-std',
  data: { names: 'Zoë & José', date: '2027-06-12', city: 'Kraków' },
  extras: { express: false, wide: true, illustration: false },
  submittedAt: '2026-11-06T10:00:00.000Z',
  dueAt: '2026-11-08T10:00:00.000Z',
  responseIds: ['r1'],
};

describe('orderToIssue / parseIssueBody', () => {
  it('round-trips the order including non-ASCII data', () => {
    const issue = orderToIssue(order, []);
    expect(parseIssueBody(issue.body)).toEqual(order);
    expect(issue.title).toBe('#3456789012 wedding-botanical-std');
  });
  it('labels order, wide and express', () => {
    expect(orderToIssue(order, []).labels.sort()).toEqual(['order', 'wide']);
    expect(orderToIssue({ ...order, extras: { ...order.extras, express: true } }, []).labels).toContain('express');
  });
  it('adds needs-info and a ready customer message on validation errors', () => {
    const issue = orderToIssue(order, [{ field: 'names', code: 'too_long', message: '"Couple names" is too long: 45 characters, the limit is 40.' }]);
    expect(issue.labels).toContain('needs-info');
    expect(issue.body).toContain('"Couple names" is too long');
    expect(parseIssueBody(issue.body)).toEqual(order);
  });
  it('throws on a body without an order-data block', () => {
    expect(() => parseIssueBody('hello')).toThrow(/order-data/);
  });
});

import { responseIdsFromBody } from '../../src/orders/issue';
describe('responseIdsFromBody', () => {
  it('reads ids from a live order-data block', () => {
    expect(responseIdsFromBody(orderToIssue(order, []).body)).toEqual(['r1']);
  });
  it('reads ids kept in a scrubbed issue marker', () => {
    expect(responseIdsFromBody('Dane usunięte.\n<!-- responses: r1,r2 -->')).toEqual(['r1', 'r2']);
  });
  it('returns [] for unrelated bodies', () => expect(responseIdsFromBody('hello')).toEqual([]));
  it('survives a customer value that contains the order-data fence', () => {
    const o = JSON.parse(JSON.stringify(order));
    o.data.message = 'hi\n```order-data\n{"x":1}\n```';
    const back = parseIssueBody(orderToIssue(o, []).body);
    expect(back.data.message).toBe(o.data.message);
  });
});
