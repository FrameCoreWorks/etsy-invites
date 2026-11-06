import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadTemplate, listTemplates, TemplateError } from '../../src/template/schema';

const FIXTURES = path.resolve(__dirname, '../fixtures/templates');

async function withManifest(slug: string, patch: (m: any) => void): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'tpl-'));
  const m = JSON.parse(await readFile(path.join(FIXTURES, 'ok/template.json'), 'utf8'));
  m.slug = slug;
  patch(m);
  await mkdir(path.join(root, slug));
  await writeFile(path.join(root, slug, 'template.json'), JSON.stringify(m));
  return root;
}

describe('loadTemplate', () => {
  it('loads a valid manifest', async () => {
    const m = await loadTemplate('ok', FIXTURES);
    expect(m.engine).toBe('remotion');
    expect(m.fields).toHaveLength(3);
    expect(m.formats).toContain('9x16');
  });
  it('rejects formats without 9x16', async () => {
    const root = await withManifest('a', (m) => (m.formats = ['16x9']));
    await expect(loadTemplate('a', root)).rejects.toBeInstanceOf(TemplateError);
  });
  it('rejects unknown engine', async () => {
    const root = await withManifest('b', (m) => (m.engine = 'blender'));
    await expect(loadTemplate('b', root)).rejects.toBeInstanceOf(TemplateError);
  });
  it('rejects text field without maxLength', async () => {
    const root = await withManifest('c', (m) => delete m.fields[0].maxLength);
    await expect(loadTemplate('c', root)).rejects.toBeInstanceOf(TemplateError);
  });
  it('rejects duplicate field keys', async () => {
    const root = await withManifest('d', (m) => (m.fields[1].key = 'names'));
    await expect(loadTemplate('d', root)).rejects.toBeInstanceOf(TemplateError);
  });
  it('rejects slug different from directory name', async () => {
    const root = await withManifest('e', (m) => (m.slug = 'other'));
    await expect(loadTemplate('e', root)).rejects.toBeInstanceOf(TemplateError);
  });
  it('rejects missing template', async () => {
    await expect(loadTemplate('nope', FIXTURES)).rejects.toBeInstanceOf(TemplateError);
  });
});

describe('listTemplates', () => {
  it('lists all manifests in root', async () => {
    const all = await listTemplates(FIXTURES);
    expect(all.map((t) => t.slug)).toEqual(['ok']);
  });
});
