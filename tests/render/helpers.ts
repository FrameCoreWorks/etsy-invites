import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const run = promisify(execFile);

export async function frameAt(video: string, sec: number, out: string): Promise<string> {
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(sec), '-i', video, '-frames:v', '1', out]);
  return out;
}

/** Compares a PNG with tests/__snapshots__/<name>.png; writes it when missing or UPDATE_SNAPSHOTS=1. Returns diff ratio. */
export async function compareSnapshot(png: string, name: string): Promise<number> {
  const dir = path.resolve(import.meta.dirname, '../__snapshots__');
  const ref = path.join(dir, `${name}.png`);
  const exists = await access(ref).then(() => true, () => false);
  if (!exists || process.env.UPDATE_SNAPSHOTS === '1') {
    await mkdir(dir, { recursive: true });
    await writeFile(ref, await readFile(png));
    return 0;
  }
  const a = PNG.sync.read(await readFile(png));
  const b = PNG.sync.read(await readFile(ref));
  if (a.width !== b.width || a.height !== b.height) return 1;
  const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
  return diff / (a.width * a.height);
}
