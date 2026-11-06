import { describe, it, expect } from 'vitest';
import { listTemplates } from '../../src/template/schema';
import { registry } from '../../render/remotion/registry';

describe('remotion registry', () => {
  it('lists every remotion template with the manifest duration', async () => {
    const remotion = (await listTemplates()).filter((t) => t.engine === 'remotion');
    expect(Object.keys(registry).sort()).toEqual(remotion.map((t) => t.slug).sort());
    for (const t of remotion) expect(registry[t.slug].durationSec).toBe(t.durationSec);
  });
});
