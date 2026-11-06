import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { scaffoldTemplate, FIELD_SETS } from '../../scripts/new-template';
import { loadTemplate } from '../../src/template/schema';

describe('scaffoldTemplate', () => {
  it('creates a std template that loads, with the std field set and 15 s', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'scaffold-'));
    const dir = await scaffoldTemplate('wedding-modern-std', 'modern', 'remotion', 'std', root);
    const m = await loadTemplate('wedding-modern-std', root);
    expect(m.fields.map((f) => f.key)).toEqual(FIELD_SETS.std.map((f) => f.key));
    expect(m.durationSec).toBe(15);
    expect(m.formats).toEqual(['9x16', '16x9']);
    const creation = await readFile(path.join(dir, 'CREATION.md'), 'utf8');
    for (const h of ['## Brief', '## Prompty', '## Decyzje człowieka', '## Koszt fal']) expect(creation).toContain(h);
  });
  it('uses the invitation field set and 25 s for inv', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'scaffold-'));
    await scaffoldTemplate('wedding-modern-inv', 'modern', 'hyperframes', 'inv', root);
    const m = await loadTemplate('wedding-modern-inv', root);
    expect(m.engine).toBe('hyperframes');
    expect(m.durationSec).toBe(25);
    expect(m.fields.map((f) => [f.key, f.type, f.maxLength ?? null])).toEqual([
      ['names', 'text', 40], ['date', 'date', null], ['time', 'text', 10], ['venue', 'text', 50],
      ['address', 'text', 80], ['rsvp', 'text', 80], ['accent', 'color', null],
    ]);
  });
  it('refuses to overwrite an existing slug', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'scaffold-'));
    await scaffoldTemplate('x-std', 'x', 'remotion', 'std', root);
    await expect(scaffoldTemplate('x-std', 'x', 'remotion', 'std', root)).rejects.toThrow(/exists/);
  });
});
