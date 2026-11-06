import { describe, it, expect, beforeAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { toProof, probe } from '../../render/postprocess';

const run = promisify(execFile);
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'pp-'));
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=1080x1920:rate=30:duration=2', '-pix_fmt', 'yuv420p', path.join(dir, 'in.mp4')]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=1920x1080:rate=30:duration=2', '-pix_fmt', 'yuv420p', path.join(dir, 'wide.mp4')]);
});

describe('toProof', () => {
  it('scales a 9x16 clip to 540x960 and keeps duration', async () => {
    await toProof(path.join(dir, 'in.mp4'), path.join(dir, 'out.mp4'));
    const p = await probe(path.join(dir, 'out.mp4'));
    expect([p.width, p.height]).toEqual([540, 960]);
    expect(p.durationSec).toBeCloseTo(2, 1);
  });
  it('scales a 16x9 clip to 960x540', async () => {
    await toProof(path.join(dir, 'wide.mp4'), path.join(dir, 'wide-out.mp4'));
    const p = await probe(path.join(dir, 'wide-out.mp4'));
    expect([p.width, p.height]).toEqual([960, 540]);
  });
});
