import { describe, it, expect } from 'vitest';
import { runCleanup, type CleanupDeps, type ClosedIssue } from '../../src/orders/cleanup';
import { orderToIssue, responseIdsFromBody, type Order } from '../../src/orders/issue';

const NOW = new Date('2026-12-10T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400_000).toISOString();
const order: Order = {
  order: '3456789012', slug: 'wedding-botanical-std', data: { names: 'Emma & Liam' },
  extras: { express: false, wide: false, illustration: false },
  submittedAt: 't', dueAt: 't', responseIds: ['r1', 'r2'],
};

function setup(issues: ClosedIssue[], driveError?: Error) {
  const state = { bodies: new Map<number, string>(), deletedComments: [] as number[], deletedFolders: [] as string[], labels: new Map<number, string[]>() };
  const deps: CleanupDeps = {
    listClosedOrders: async () => issues,
    listComments: async (n) => [{ id: n * 10, body: 'Proof gotowy' }, { id: n * 10 + 1, body: 'Klient wysłał formularz ponownie: Emma' }],
    updateBody: async (n, b) => void state.bodies.set(n, b),
    deleteComment: async (id) => void state.deletedComments.push(id),
    addLabel: async (n, l) => void state.labels.set(n, [...(state.labels.get(n) ?? []), l]),
    deleteDriveFolder: async (o) => { if (driveError) throw driveError; state.deletedFolders.push(o); },
  };
  return { deps, state };
}

const issue = (n: number, closedDaysAgo: number, labels = ['order']): ClosedIssue => ({
  number: n, title: `#${order.order} ${order.slug}`, body: orderToIssue(order, []).body, labels, closedAt: daysAgo(closedDaysAgo),
});

describe('runCleanup', () => {
  it('scrubs issues closed more than 30 days ago and keeps response ids', async () => {
    const { deps, state } = setup([issue(1, 31)]);
    expect(await runCleanup(deps, NOW)).toEqual({ scrubbed: 1 });
    const body = state.bodies.get(1)!;
    expect(body).not.toContain('Emma');
    expect(responseIdsFromBody(body)).toEqual(['r1', 'r2']);
    expect(state.deletedComments).toEqual([10, 11]);
    expect(state.deletedFolders).toEqual(['3456789012']);
    expect(state.labels.get(1)).toEqual(['scrubbed']);
  });
  it('leaves issues closed 29 days ago', async () => {
    const { deps } = setup([issue(1, 29)]);
    expect(await runCleanup(deps, NOW)).toEqual({ scrubbed: 0 });
  });
  it('skips issues already scrubbed', async () => {
    const { deps } = setup([issue(1, 60, ['order', 'scrubbed'])]);
    expect(await runCleanup(deps, NOW)).toEqual({ scrubbed: 0 });
  });
  it('still scrubs when the drive folder is already gone', async () => {
    const { deps, state } = setup([issue(1, 40)], Object.assign(new Error('not found'), { code: 404 }));
    expect(await runCleanup(deps, NOW)).toEqual({ scrubbed: 1 });
    expect(state.labels.get(1)).toEqual(['scrubbed']);
  });

  it('replaces the issue with a fresh tombstone when it can delete issues, so edit history goes too', async () => {
    const { deps, state } = setup([issue(1, 31)]);
    const tomb: { title: string; body: string }[] = [];
    const deleted: number[] = [];
    deps.createTombstone = async (title, body) => void tomb.push({ title, body });
    deps.deleteIssue = async (n) => void deleted.push(n);
    expect(await runCleanup(deps, NOW)).toEqual({ scrubbed: 1 });
    expect(tomb[0].title).toBe(`#${order.order} ${order.slug}`);
    expect(tomb[0].body).not.toContain('Emma');
    expect(responseIdsFromBody(tomb[0].body)).toEqual(['r1', 'r2']);
    expect(deleted).toEqual([1]);
    expect(state.bodies.size).toBe(0);
  });
  it('raises an ops alert when Google rejects the token', async () => {
    const { deps } = setup([issue(1, 40)], new Error('invalid_grant'));
    const alerts: string[] = [];
    deps.opsAlert = async (t) => void alerts.push(t);
    await expect(runCleanup(deps, NOW)).rejects.toThrow('invalid_grant');
    expect(alerts).toHaveLength(1);
  });
});
