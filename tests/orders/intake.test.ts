import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { runIntake, type FormResponse, type IntakeGithub } from '../../src/orders/intake';
import { parseIssueBody, responseIdsFromBody } from '../../src/orders/issue';

const ROOT = path.resolve(__dirname, '../../templates');
const NOW = new Date('2026-11-06T12:00:00Z');

type FakeIssue = { number: number; title: string; body: string; labels: string[]; comments: string[]; state: 'open' | 'closed' };

function fakeGithub() {
  const issues: FakeIssue[] = [];
  const alerts: string[] = [];
  let failCreate = false;
  const setFailCreate = (v: boolean) => (failCreate = v);
  const gh: IntakeGithub = {
    async findOrderIssue(order) {
      return issues.find((i) => i.title.startsWith(`#${order} `) && !i.labels.includes('scrubbed')) ?? null;
    },
    async processedResponseIds() {
      return new Set(issues.flatMap((i) => responseIdsFromBody(i.body)));
    },
    async createIssue(i) {
      if (failCreate) throw new Error('github down');
      issues.push({ ...i, number: issues.length + 1, comments: [], state: 'open' });
      return issues.length;
    },
    async updateIssue(n, i) {
      Object.assign(issues[n - 1], i);
    },
    async comment(n, body) {
      issues[n - 1].comments.push(body);
    },
    async reopen(n) {
      issues[n - 1].state = 'open';
    },
    async opsAlert(title) {
      alerts.push(title);
    },
  };
  return { gh, issues, alerts, setFailCreate };
}

const response = (id: string, answers: Record<string, string>, submittedAt = '2026-11-06T10:00:00Z'): FormResponse => ({
  responseId: id,
  slug: 'wedding-botanical-std',
  submittedAt,
  answers: { order: '3456789012', names: 'Emma & Liam', date: '2027-06-12', city: 'Charleston, SC', ...answers },
});

describe('runIntake', () => {
  let f: ReturnType<typeof fakeGithub>;
  beforeEach(() => (f = fakeGithub()));
  let ready: number[];
  beforeEach(() => (ready = []));
  const run = (rs: FormResponse[] | Error, templatesRoot = ROOT) =>
    runIntake({ github: f.gh, listResponses: async () => { if (rs instanceof Error) throw rs; return rs; }, now: NOW, templatesRoot, onReady: async (n) => { ready.push(n); } });

  it('creates one issue for a new order with a 48 h due date', async () => {
    expect(await run([response('r1', {})])).toEqual({ created: 1, updated: 0 });
    const o = parseIssueBody(f.issues[0].body);
    expect(o.dueAt).toBe('2026-11-08T10:00:00.000Z');
    expect(f.issues[0].labels).toEqual(['order']);
  });
  it('uses 24 h and the express label for express orders', async () => {
    await run([response('r1', { express: 'Yes' })]);
    expect(parseIssueBody(f.issues[0].body).dueAt).toBe('2026-11-07T10:00:00.000Z');
    expect(f.issues[0].labels).toContain('express');
  });
  it('ignores responses already processed', async () => {
    await run([response('r1', {})]);
    expect(await run([response('r1', {})])).toEqual({ created: 0, updated: 0 });
    expect(f.issues).toHaveLength(1);
  });
  it('updates the existing issue and comments when the same order is submitted again', async () => {
    await run([response('r1', {})]);
    expect(await run([response('r2', { city: 'Savannah, GA' }, '2026-11-06T11:00:00Z')])).toEqual({ created: 0, updated: 1 });
    expect(f.issues).toHaveLength(1);
    const o = parseIssueBody(f.issues[0].body);
    expect(o.data.city).toBe('Savannah, GA');
    expect(o.responseIds).toEqual(['r1', 'r2']);
    expect(f.issues[0].comments[0]).toContain('Savannah, GA');
  });
  it('marks invalid data and bad order numbers needs-info', async () => {
    await run([response('r1', { order: '#12', names: 'x'.repeat(41) })]);
    expect(f.issues[0].labels).toContain('needs-info');
    expect(f.issues[0].body).toContain('order number');
  });
  it('raises an ops alert and rethrows when the form source fails auth', async () => {
    await expect(run(Object.assign(new Error('unauthorized'), { code: 401 }))).rejects.toThrow();
    expect(f.alerts).toHaveLength(1);
  });

  it('starts a proof right after each valid issue, not for needs-info', async () => {
    await run([response('r1', {}), response('r2', { order: '1111111', names: 'x'.repeat(41) }, '2026-11-06T10:30:00Z')]);
    expect(ready).toEqual([1]);
  });
  it('keeps going after one response fails, alerts, and retries it on the next run', async () => {
    const bad = { ...response('r1', {}), slug: 'no-such-template' };
    expect(await run([bad, response('r2', { order: '2222222' }, '2026-11-06T11:00:00Z')])).toEqual({ created: 1, updated: 0 });
    expect(f.alerts[0]).toContain('r1');
    expect(ready).toEqual([1]);
    expect(await run([bad])).toEqual({ created: 0, updated: 0 });
    expect(f.alerts).toHaveLength(2);
  });
  it('does not lose a proof when GitHub fails midway', async () => {
    await run([response('r1', {})]);
    f.setFailCreate(true);
    await run([response('r2', { order: '2222222' }, '2026-11-06T11:00:00Z')]);
    expect(ready).toEqual([1]);
    f.setFailCreate(false);
    await run([response('r2', { order: '2222222' }, '2026-11-06T11:00:00Z')]);
    expect(ready).toEqual([1, 2]);
  });
  it('reopens a closed order when the customer resubmits', async () => {
    await run([response('r1', {})]);
    f.issues[0].state = 'closed';
    await run([response('r2', { city: 'Savannah, GA' }, '2026-11-06T11:00:00Z')]);
    expect(f.issues[0].state).toBe('open');
    expect(f.issues[0].comments[0]).toContain('otwarte ponownie');
  });
  it('opens a new issue when the earlier issue for that order was scrubbed', async () => {
    await run([response('r1', {})]);
    f.issues[0].labels = ['order', 'scrubbed'];
    f.issues[0].body = 'scrubbed <!-- responses: r1 -->';
    expect(await run([response('r2', {}, '2026-11-06T11:00:00Z')])).toEqual({ created: 1, updated: 0 });
  });
});
