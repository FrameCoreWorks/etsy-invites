import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { render } from '../../render/render';
import { renderStillPng } from '../../render/remotion/renderRemotion';
import { loadTemplate } from '../template/schema';

const run = promisify(execFile);
const ffmpeg = (args: string[]) => run('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
const PAPER = '0xf4efe6';
export const LISTING_VIDEO_SEC = 12;

const exampleData = async (slug: string) => Object.fromEntries((await loadTemplate(slug)).fields.map((f) => [f.key, f.example]));

async function finalExample(slug: string, outDir: string): Promise<string> {
  return (await render({ slug, data: await exampleData(slug), mode: 'final', format: '9x16', outDir: path.join(outDir, 'src') })).file;
}

/** 12 s silent listing video with a "your details here" label for the first 3 seconds. */
export async function listingVideo(slug: string, outDir: string, source?: string): Promise<string> {
  const src = source ?? (await finalExample(slug, outDir));
  const out = path.join(outDir, `${slug}-listing.mp4`);
  const label = "drawtext=text='Personalized with your names and date':fontcolor=0x33402f:fontsize=44:x=(w-text_w)/2:y=140:box=1:boxcolor=0xf4efe6@0.85:boxborderw=24:enable='lt(t,3)'";
  await ffmpeg(['-i', src, '-t', String(LISTING_VIDEO_SEC), '-vf', label, '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  return out;
}

/** Five 2000x2000 listing images: phone hero, two key frames, how it works, options. */
export async function mockups(slug: string, outDir: string, source?: string): Promise<string[]> {
  const src = source ?? (await finalExample(slug, outDir));
  const frame = (sec: number, file: string) => ffmpeg(['-ss', String(sec), '-i', src, '-frames:v', '1', file]);
  const f8 = path.join(outDir, `${slug}-f8.png`);
  const f3 = path.join(outDir, `${slug}-f3.png`);
  await frame(8, f8);
  await frame(3, f3);
  const pad = async (input: string, output: string) =>
    ffmpeg(['-i', input, '-vf', `scale=-2:1800,pad=2000:2000:(ow-iw)/2:(oh-ih)/2:color=${PAPER}`, output]);
  const dataUrl = `data:image/png;base64,${(await readFile(f8)).toString('base64')}`;
  const files = [1, 2, 3, 4, 5].map((i) => path.join(outDir, `${slug}-image-${i}.png`));
  await renderStillPng('listing-mockup', { kind: 'hero', frame: dataUrl }, files[0]);
  await pad(f8, files[1]);
  await pad(f3, files[2]);
  await renderStillPng('listing-mockup', { kind: 'steps' }, files[3]);
  await renderStillPng('listing-mockup', { kind: 'options' }, files[4]);
  return files;
}
