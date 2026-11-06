/** Called by intake.yml: imports new form responses as issues and starts a proof render right after each valid one. */
import { octokit } from '../src/ops/github';
import { intakeGithub, dispatchRender } from '../src/orders/githubAdapter';
import { listAllResponses } from '../src/orders/formsSource';
import { runIntake } from '../src/orders/intake';

const gh = octokit();
const proofsQueued: number[] = [];
const result = await runIntake({
  github: intakeGithub(gh),
  listResponses: listAllResponses,
  onReady: async (n) => {
    await dispatchRender(gh, n, 'proof');
    proofsQueued.push(n);
  },
});
console.log(JSON.stringify({ ...result, proofsQueued }));
