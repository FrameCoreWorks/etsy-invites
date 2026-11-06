import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { loadTemplate, type Format, type TemplateManifest, TEMPLATES_ROOT } from '../src/template/schema';
import { validateOrderData, type OrderData, type ValidationError } from '../src/template/validate';
import { probe, toProof } from './postprocess';

export type RenderMode = 'proof' | 'final';
export type RenderOptions = { slug: string; data: OrderData; mode: RenderMode; format: Format; outDir: string; templatesRoot?: string; today?: Date };
export type RenderResult = { file: string; width: number; height: number; durationSec: number; renderMs: number };

export class ValidationFailed extends Error {
  constructor(public errors: ValidationError[]) {
    super(`invalid order data: ${errors.map((e) => `${e.field}:${e.code}`).join(', ')}`);
    this.name = 'ValidationFailed';
  }
}

type EngineFn = (m: TemplateManifest, data: OrderData, format: Format, outFile: string) => Promise<void>;

async function engineFor(m: TemplateManifest): Promise<EngineFn> {
  if (m.engine === 'remotion') return (await import('./remotion/renderRemotion')).renderRemotion;
  throw new Error(`engine ${m.engine} not implemented yet`);
}

export async function render(opts: RenderOptions): Promise<RenderResult> {
  const m = await loadTemplate(opts.slug, opts.templatesRoot ?? TEMPLATES_ROOT);
  if (!m.formats.includes(opts.format)) throw new Error(`${m.slug} does not support format ${opts.format}`);
  const errors = validateOrderData(m, opts.data, opts.today);
  if (errors.length) throw new ValidationFailed(errors);

  await mkdir(opts.outDir, { recursive: true });
  const base = path.join(opts.outDir, `${m.slug}-${opts.format}-${opts.mode}`);
  const master = `${base}.master.mp4`;
  const file = `${base}.mp4`;
  const t0 = performance.now();
  await (await engineFor(m))(m, opts.data, opts.format, opts.mode === 'final' ? file : master);
  if (opts.mode === 'proof') {
    await toProof(master, file);
    await rm(master, { force: true });
  }
  const renderMs = Math.round(performance.now() - t0);
  return { file, renderMs, ...(await probe(file)) };
}
