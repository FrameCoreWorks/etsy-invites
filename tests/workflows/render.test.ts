import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

type Step = { uses?: string; run?: string; with?: Record<string, unknown>; env?: Record<string, string> };
type Job = { if?: string; steps: Step[]; concurrency?: unknown; permissions?: Record<string, string> };
const wf = load(readFileSync('.github/workflows/render.yml', 'utf8')) as { concurrency?: unknown; permissions?: unknown; jobs: Record<string, Job> };
const fix = wf.jobs.fix;
const allText = JSON.stringify(fix.steps);

describe('render.yml', () => {
  it('has no workflow-level concurrency (unrelated comments must not cancel a pending /approve)', () => {
    expect(wf.concurrency).toBeUndefined();
    expect(wf.jobs.render.concurrency).toBeDefined();
    expect(fix.concurrency).toBeDefined();
  });

  it('route only starts for owner comments on order issues', () => {
    expect(wf.jobs.route.if).toContain("'order'");
    expect(wf.jobs.route.if).toContain('OWNER');
  });

  it('render job does not run after cancellation', () => {
    expect(wf.jobs.render.if).toContain('!cancelled()');
    expect(wf.jobs.render.if).not.toContain('always()');
  });

  it('fix agent cannot write files, push, or edit the issue body', () => {
    const run = fix.steps.find((s) => s.run?.includes('tools='))?.run ?? '';
    const tools = /tools=(.*)"/.exec(run)?.[1] ?? '';
    expect(allText).toContain('--allowedTools \\"${{ steps.prompt.outputs.tools }}\\"');
    expect(tools).not.toBe('');
    for (const banned of ['Edit', 'Write', 'git push', 'git commit', 'npm test', 'render-cli', 'gh pr create']) {
      expect(tools.split(',').some((t) => t.trim().startsWith(banned))).toBe(false);
    }
    expect(tools).not.toMatch(/gh issue edit[^,]*:\*/);
    expect(tools).toMatch(/set-order-data\.ts \$\{?ISSUE/);
  });

  it('fix job checks out without persisted credentials and least privilege', () => {
    const checkout = fix.steps.find((s) => s.uses?.startsWith('actions/checkout'));
    expect(checkout?.with?.['persist-credentials']).toBe(false);
    expect(fix.permissions?.contents).toBe('read');
    expect(wf.permissions).toEqual({});
  });

  it('never interpolates dispatch inputs straight into run scripts', () => {
    const runs = Object.values(wf.jobs).flatMap((j) => j.steps.map((s) => s.run ?? ''));
    for (const r of runs) expect(r).not.toMatch(/\$\{\{\s*(inputs\.|github\.event\.)/);
  });
});
