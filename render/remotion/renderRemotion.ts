import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import type { Format, TemplateManifest } from '../../src/template/schema';
import type { OrderData } from '../../src/template/validate';

const ROOT = path.resolve(import.meta.dirname, '../..');
let bundled: Promise<string> | null = null;

export function getBundle(): Promise<string> {
  bundled ??= bundle({ entryPoint: path.join(ROOT, 'render/remotion/index.ts'), publicDir: path.join(ROOT, 'public') });
  return bundled;
}

const browserExecutable = process.env.REMOTION_BROWSER || null;

export async function renderRemotion(m: TemplateManifest, data: OrderData, format: Format, outFile: string): Promise<void> {
  const serveUrl = await getBundle();
  const inputProps = { ...data, __format: format };
  const composition = await selectComposition({ serveUrl, id: m.slug, inputProps, browserExecutable });
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    outputLocation: outFile,
    browserExecutable,
    chromiumOptions: { gl: 'swangle' },
  });
}

export async function renderStillPng(id: string, inputProps: Record<string, unknown>, output: string): Promise<void> {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable });
  await renderStill({ serveUrl, composition, inputProps, output, browserExecutable, imageFormat: 'png' });
}
