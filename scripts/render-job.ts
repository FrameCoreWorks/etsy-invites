/** Usage (render.yml): npx tsx scripts/render-job.ts <issue> proof|final */
import { octokit } from '../src/ops/github';
import { renderGithub } from '../src/orders/githubAdapter';
import { runFinal, runProof } from '../src/orders/renderJob';
import { uploadOrder } from '../src/orders/drive';
import { render } from '../render/render';

const [issueArg, mode] = process.argv.slice(2);
const issue = Number(issueArg);
if (!Number.isInteger(issue) || !['proof', 'final'].includes(mode)) throw new Error('usage: render-job.ts <issue> proof|final');
const deps = { github: renderGithub(octokit()), render, upload: uploadOrder, outDir: 'out' };
await (mode === 'proof' ? runProof(issue, deps) : runFinal(issue, deps));
