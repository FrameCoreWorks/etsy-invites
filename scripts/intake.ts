/** Called by intake.yml: imports new form responses as issues and starts a proof render for each valid new one. */
import { octokit } from '../src/ops/github';
import { intakeGithub, dispatchRender } from '../src/orders/githubAdapter';
import { listAllResponses } from '../src/orders/formsSource';
import { runIntake } from '../src/orders/intake';

const gh = octokit();
const base = intakeGithub(gh);
const touched: number[] = [];
const github = {
  ...base,
  async createIssue(i: Parameters<typeof base.createIssue>[0]) {
    const n = await base.createIssue(i);
    if (!i.labels.includes('needs-info')) touched.push(n);
    return n;
  },
  async updateIssue(n: number, i: Parameters<typeof base.updateIssue>[1]) {
    await base.updateIssue(n, i);
    if (!i.labels?.includes('needs-info')) touched.push(n);
  },
};
const result = await runIntake({ github, listResponses: listAllResponses });
for (const n of touched) await dispatchRender(gh, n, 'proof');
console.log(JSON.stringify({ ...result, proofsQueued: touched }));
