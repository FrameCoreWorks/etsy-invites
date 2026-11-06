import { describe, it, expect, beforeEach } from 'vitest';
import { runProof, runFinal, type RenderJobDeps } from '../../src/orders/renderJob';
import { orderToIssue, type Order } from '../../src/orders/issue';
import { ValidationFailed } from '../../render/render';

const order: Order = {
  order: '3456789012', slug: 'wedding-botanical-std',
  data: { names: 'Emma & Liam', date: '2027-06-12', city: 'Charleston, SC' },
  extras: { express: false, wide: false, illustration: false },
  submittedAt: '2026-11-06T10:00:00.000Z', dueAt: '2026-11-08T10:00:00.000Z', responseIds: ['r1'],
};

function setup(o: Order = order, labels?: string[]) {
  const issue = orderToIssue(o, []);
  const state = { labels: labels ?? issue.labels, comments: [] as string[], renders: [] as string[], uploads: [] as string[][], failures: 0 };
  const deps: RenderJobDeps = {
    github: {
      getIssue: async () => ({ body: issue.body, labels: [...state.labels], state: 'open' }),
      comment: async (_n, b) => void state.comments.push(b),
      addLabels: async (_n, ls) => void state.labels.push(...ls.filter((l) => !state.labels.includes(l))),
      removeLabel: async (_n, l) => void (state.labels = state.labels.filter((x) => x !== l)),
    },
    render: async (opts) => {
      if (state.failures > 0) { state.failures--; throw new Error('chrome crashed\nline2'); }
      state.renders.push(`${opts.mode}:${opts.format}`);
      return { file: `/tmp/${opts.mode}-${opts.format}.mp4`, width: 0, height: 0, durationSec: 15, renderMs: 1 };
    },
    upload: async (_order, files) => { state.uploads.push(files); return 'https://drive.google.com/drive/folders/x'; },
    outDir: '/tmp/out',
  };
  return { deps, state };
}

describe('runProof', () => {
  it('renders a 9x16 proof, uploads it, comments the link and labels proof-sent', async () => {
    const { deps, state } = setup();
    await runProof(1, deps);
    expect(state.renders).toEqual(['proof:9x16']);
    expect(state.comments[0]).toContain('https://drive.google.com/drive/folders/x');
    expect(state.labels).toContain('proof-sent');
  });
  it('retries once after a failed render', async () => {
    const { deps, state } = setup();
    state.failures = 1;
    await runProof(1, deps);
    expect(state.renders).toEqual(['proof:9x16']);
    expect(state.labels).not.toContain('render-failed');
  });
  it('labels render-failed with the log after two failures', async () => {
    const { deps, state } = setup();
    state.failures = 2;
    await runProof(1, deps);
    expect(state.labels).toContain('render-failed');
    expect(state.comments.at(-1)).toContain('chrome crashed');
  });
  it('does nothing for needs-info issues', async () => {
    const { deps, state } = setup(order, ['order', 'needs-info']);
    await runProof(1, deps);
    expect(state.renders).toEqual([]);
  });
  it('turns validation errors into needs-info with a customer message, without retry', async () => {
    const { deps, state } = setup();
    let calls = 0;
    deps.render = async () => { calls++; throw new ValidationFailed([{ field: 'date', code: 'past_date', message: '"Wedding date" is in the past.' }]); };
    await runProof(1, deps);
    expect(calls).toBe(1);
    expect(state.labels).toContain('needs-info');
    expect(state.comments[0]).toContain('"Wedding date" is in the past.');
  });
});

describe('runFinal', () => {
  it('renders final 9x16, uploads, labels ready-to-send and drops proof-sent', async () => {
    const { deps, state } = setup(order, ['order', 'proof-sent']);
    await runFinal(1, deps);
    expect(state.renders).toEqual(['final:9x16']);
    expect(state.labels).toContain('ready-to-send');
    expect(state.labels).not.toContain('proof-sent');
  });
  it('adds the 16x9 file when the customer bought it', async () => {
    const { deps, state } = setup({ ...order, extras: { ...order.extras, wide: true } });
    await runFinal(1, deps);
    expect(state.renders).toEqual(['final:9x16', 'final:16x9']);
    expect(state.uploads[0]).toHaveLength(2);
  });
});
