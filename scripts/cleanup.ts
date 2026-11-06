/** Scrubs personal data from order issues closed more than 30 days ago (cleanup.yml, later digest.yml). */
import { octokit, repoContext } from '../src/ops/github';
import { runCleanup } from '../src/orders/cleanup';
import { deleteOrderFolder } from '../src/orders/drive';

const gh = octokit();
const ctx = repoContext();
const result = await runCleanup({
  async listClosedOrders() {
    const issues = await gh.paginate(gh.issues.listForRepo, { ...ctx, labels: 'order', state: 'closed', per_page: 100 });
    return issues.map((i) => ({
      number: i.number, title: i.title, body: i.body ?? '', closedAt: i.closed_at ?? new Date().toISOString(),
      labels: i.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')),
    }));
  },
  async listComments(n) {
    const cs = await gh.paginate(gh.issues.listComments, { ...ctx, issue_number: n, per_page: 100 });
    return cs.map((c) => ({ id: c.id, body: c.body ?? '' }));
  },
  updateBody: async (n, body) => void (await gh.issues.update({ ...ctx, issue_number: n, body })),
  deleteComment: async (id) => void (await gh.issues.deleteComment({ ...ctx, comment_id: id })),
  addLabel: async (n, label) => void (await gh.issues.addLabels({ ...ctx, issue_number: n, labels: [label] })),
  deleteDriveFolder: deleteOrderFolder,
});
console.log(JSON.stringify(result));
