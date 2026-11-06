/**
 * Used by the /fix: agent. Usage: npx tsx scripts/set-order-data.ts <issue> '<json data>'
 * Validates and writes the new order data into the issue; prints errors and exits 1 otherwise.
 */
import { octokit, repoContext } from '../src/ops/github';
import { applyFix } from '../src/orders/setOrderData';

const [issueArg, json] = process.argv.slice(2);
const gh = octokit();
const ctx = repoContext();
const issue = await gh.issues.get({ ...ctx, issue_number: Number(issueArg) });
const r = await applyFix(issue.data.body ?? '', JSON.parse(json));
if (!r.ok) {
  console.error(JSON.stringify(r.errors, null, 2));
  process.exit(1);
}
await gh.issues.update({ ...ctx, issue_number: Number(issueArg), body: r.body });
await gh.issues.removeLabel({ ...ctx, issue_number: Number(issueArg), name: 'needs-info' }).catch(() => {});
console.log('order data updated');
