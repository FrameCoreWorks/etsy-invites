import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { render, ValidationFailed } from '../../render/render';
import { listTemplates } from '../../src/template/schema';
import { frameAt, compareSnapshot } from './helpers';

const TODAY = new Date('2026-11-06T12:00:00Z');
/** Seconds where each text scene is fully visible: save the date shows everything at 8 s, invitations have 4 scenes. */
const snapshotSecs = (durationSec: number) => (durationSec >= 25 ? [3.5, 10, 16, 23] : [8]);

function exampleData(fields: { key: string; example: string }[]) {
  return Object.fromEntries(fields.map((f) => [f.key, f.example]));
}
/** Longest allowed text with non-ASCII characters (Review Focus 3). */
function worstData(fields: { key: string; type: string; maxLength?: number; example: string }[]) {
  const base = 'Zoë & José O’Connor-Łukasiewicz Ångström ';
  return Object.fromEntries(
    fields.map((f) => [f.key, f.type === 'text' && f.maxLength ? base.repeat(5).slice(0, f.maxLength).trimEnd() : f.example]),
  );
}

const templates = await listTemplates();
let out: string;
beforeAll(async () => {
  out = await mkdtemp(path.join(tmpdir(), 'render-'));
});

describe.each(templates.map((t) => [t.slug, t] as const))('%s', (slug, t) => {
  it('final 9x16 from example data: 1080x1920, manifest duration', async () => {
    const r = await render({ slug, data: exampleData(t.fields), mode: 'final', format: '9x16', outDir: out, today: TODAY });
    expect([r.width, r.height]).toEqual([1080, 1920]);
    expect(Math.abs(r.durationSec - t.durationSec)).toBeLessThanOrEqual(0.1);
  }, 600_000);

  it('proof 9x16 is 540x960', async () => {
    const r = await render({ slug, data: exampleData(t.fields), mode: 'proof', format: '9x16', outDir: path.join(out, 'proof'), today: TODAY });
    expect([r.width, r.height]).toEqual([540, 960]);
  }, 600_000);

  it('worst-case text matches snapshot', async () => {
    const r = await render({ slug, data: worstData(t.fields), mode: 'final', format: '9x16', outDir: path.join(out, 'worst'), today: TODAY });
    for (const [i, sec] of snapshotSecs(t.durationSec).entries()) {
      const name = i === 0 ? `${slug}-worst` : `${slug}-worst-${i + 1}`;
      const png = await frameAt(r.file, sec, path.join(out, `${name}.png`));
      expect(await compareSnapshot(png, name), name).toBeLessThan(0.01);
    }
  }, 600_000);

  it('invalid data throws ValidationFailed before rendering', async () => {
    const start = performance.now();
    await expect(render({ slug, data: {}, mode: 'proof', format: '9x16', outDir: out, today: TODAY })).rejects.toBeInstanceOf(ValidationFailed);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});
