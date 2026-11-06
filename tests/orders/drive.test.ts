import { describe, it, expect } from 'vitest';
import { uploadOrder } from '../../src/orders/drive';

type F = { id: string; name: string; parents: string[]; mimeType?: string; trashed?: boolean };

function fakeDrive() {
  const files: F[] = [];
  const queries: string[] = [];
  let next = 1;
  const parse = (q: string) => ({
    name: /name = '((?:[^'\\]|\\.)*)'/.exec(q)?.[1]?.replace(/\\(.)/g, '$1'),
    parent: /'([^']+)' in parents/.exec(q)?.[1],
    folder: q.includes("mimeType = 'application/vnd.google-apps.folder'"),
  });
  const d = {
    files: {
      async list({ q }: { q: string }) {
        queries.push(q);
        const p = parse(q);
        return { data: { files: files.filter((f) => !f.trashed && (!p.name || f.name === p.name) && (!p.parent || f.parents.includes(p.parent)) && (!p.folder || f.mimeType === 'application/vnd.google-apps.folder')) } };
      },
      async create({ requestBody }: { requestBody: { name: string; mimeType?: string; parents?: string[] } }) {
        const f = { id: `f${next++}`, name: requestBody.name, mimeType: requestBody.mimeType, parents: requestBody.parents ?? [] };
        files.push(f);
        return { data: { id: f.id } };
      },
      async update({ fileId, requestBody }: { fileId: string; requestBody: { trashed: boolean } }) {
        files.find((f) => f.id === fileId)!.trashed = requestBody.trashed;
        return { data: {} };
      },
      async get() {
        return { data: { webViewLink: 'https://drive.google.com/drive/folders/x' } };
      },
    },
    permissions: { async create() { return { data: {} }; } },
  };
  return { d, files, queries };
}

describe('uploadOrder', () => {
  it('replaces the previous proof instead of adding a second file with the same name', async () => {
    const { d, files } = fakeDrive();
    await uploadOrder('3456789012', ['/tmp/a/wedding-botanical-std-9x16-proof.mp4'], 'proof', d as never, () => 'x' as never);
    await uploadOrder('3456789012', ['/tmp/a/wedding-botanical-std-9x16-proof.mp4'], 'proof', d as never, () => 'x' as never);
    const live = files.filter((f) => !f.trashed && f.name.endsWith('.mp4'));
    expect(live).toHaveLength(1);
  });
  it('escapes quotes in folder names used in Drive queries', async () => {
    const { d, queries } = fakeDrive();
    await uploadOrder("12' or name contains '", ['/tmp/a.mp4'], 'proof', d as never, () => 'x' as never);
    expect(queries.some((q) => q.includes("name = '12\\' or name contains \\''"))).toBe(true);
  });
});
