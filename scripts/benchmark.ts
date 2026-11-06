import { parseArgs } from 'node:util';
import os from 'node:os';
import { render } from '../render/render';
import { loadTemplate } from '../src/template/schema';

export type BenchmarkResult = { proofMs: number; finalMs: number; final169Ms?: number };

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

export async function benchmark(slug: string, runs = 3, outDir = 'out'): Promise<BenchmarkResult> {
  const m = await loadTemplate(slug);
  const data = Object.fromEntries(m.fields.map((f) => [f.key, f.example]));
  const time = async (mode: 'proof' | 'final', format: '9x16' | '16x9') => {
    const ms: number[] = [];
    for (let i = 0; i < runs; i++) ms.push((await render({ slug, data, mode, format, outDir })).renderMs);
    return median(ms);
  };
  const result: BenchmarkResult = { proofMs: await time('proof', '9x16'), finalMs: await time('final', '9x16') };
  if (m.formats.includes('16x9')) result.final169Ms = await time('final', '16x9');
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: { runs: { type: 'string', default: '3' }, out: { type: 'string', default: 'out' } } });
  const slug = positionals[0];
  const r = await benchmark(slug, Number(values.runs), values.out);
  const min = (ms?: number) => (ms === undefined ? '-' : (ms / 60000).toFixed(2));
  console.log(`## Render benchmark: ${slug}\n`);
  console.log(`Runner: ${os.cpus().length} vCPU, ${(os.totalmem() / 2 ** 30).toFixed(0)} GB RAM\n`);
  console.log('| Tryb | Mediana [min] |\n|---|---|');
  console.log(`| proof 9x16 | ${min(r.proofMs)} |\n| final 9x16 | ${min(r.finalMs)} |\n| final 16x9 | ${min(r.final169Ms)} |`);
  console.log(`\n\`\`\`json\n${JSON.stringify(r)}\n\`\`\``);
}
