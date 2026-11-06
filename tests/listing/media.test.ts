import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { listingVideo, mockups } from '../../src/listing/media';
import { probe } from '../../render/postprocess';

const run = promisify(execFile);
let out: string;
beforeAll(async () => {
  out = await mkdtemp(path.join(tmpdir(), 'listing-'));
});

describe('listing media', () => {
  it('listing video is 12 s, 1080x1920, without audio', async () => {
    const file = await listingVideo('wedding-botanical-std', out);
    const p = await probe(file);
    expect([p.width, p.height]).toEqual([1080, 1920]);
    expect(Math.abs(p.durationSec - 12)).toBeLessThanOrEqual(0.1);
    const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file]);
    expect(stdout.trim()).toBe('');
  }, 600_000);

  it('mockups are five 2000x2000 PNGs', async () => {
    const files = await mockups('wedding-botanical-std', out);
    expect(files).toHaveLength(5);
    for (const f of files) {
      const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]);
      expect(stdout.trim()).toBe('2000,2000');
    }
  }, 600_000);
});
