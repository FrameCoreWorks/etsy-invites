import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
export const WATERMARK = 'PROOF  FrameCore Works';

/** Scales to 540px on the short side and draws a diagonal 40% watermark. */
export async function toProof(input: string, output: string): Promise<void> {
  const { width, height } = await probe(input);
  const [w, h] = width < height ? [540, 960] : [960, 540];
  const filter = [
    `[0:v]scale=${w}:${h}[base]`,
    `color=c=black@0:s=${w * 2}x${w * 2},format=rgba,drawtext=text='${WATERMARK}':fontcolor=white@0.4:fontsize=${Math.round(w / 9)}:x=(w-text_w)/2:y=(h-text_h)/2:borderw=2:bordercolor=black@0.25,rotate=-PI/6:c=none:ow=iw:oh=ih[wm]`,
    `[base][wm]overlay=(W-w)/2:(H-h)/2:shortest=1`,
  ].join(';');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-filter_complex', filter, '-c:v', 'libx264', '-crf', '26', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-an', output]);
}

export async function probe(file: string): Promise<{ width: number; height: number; durationSec: number }> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]);
  const j = JSON.parse(stdout);
  return { width: j.streams[0].width, height: j.streams[0].height, durationSec: Number(j.format.duration) };
}
