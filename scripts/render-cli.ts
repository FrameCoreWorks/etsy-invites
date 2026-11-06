import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { render, ValidationFailed } from '../render/render';
import type { Format } from '../src/template/schema';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { mode: { type: 'string', default: 'proof' }, format: { type: 'string', default: '9x16' }, out: { type: 'string', default: 'out' } },
});
const [slug, dataFile] = positionals;
if (!slug || !dataFile) {
  console.error('usage: npm run render -- <slug> <data.json> [--mode proof|final] [--format 9x16|16x9] [--out dir]');
  process.exit(2);
}
try {
  const data = JSON.parse(await readFile(dataFile, 'utf8'));
  const r = await render({ slug, data, mode: values.mode as 'proof' | 'final', format: values.format as Format, outDir: values.out! });
  console.log(JSON.stringify(r));
} catch (e) {
  if (e instanceof ValidationFailed) console.error(JSON.stringify(e.errors, null, 2));
  else console.error(e);
  process.exit(1);
}
