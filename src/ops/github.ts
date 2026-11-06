import { Octokit } from '@octokit/rest';

export function repoContext(): { owner: string; repo: string } {
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? 'FrameCoreWorks/etsy-invites').split('/');
  return { owner, repo };
}

export function octokit(): Octokit {
  const auth = process.env.GITHUB_TOKEN;
  if (!auth) throw new Error('GITHUB_TOKEN is not set');
  return new Octokit({ auth });
}

/** Opens an ops-alert issue unless an open one with the same title exists. */
export async function opsAlert(gh: Octokit, title: string, detail: string): Promise<void> {
  const ctx = repoContext();
  const open = await gh.paginate(gh.issues.listForRepo, { ...ctx, labels: 'ops-alert', state: 'open', per_page: 100 });
  if (open.some((i) => i.title === title)) return;
  const run = process.env.GITHUB_RUN_ID ? `\n\nRun: ${process.env.GITHUB_SERVER_URL}/${ctx.owner}/${ctx.repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
  await gh.issues.create({ ...ctx, title, body: `${detail}${run}`, labels: ['ops-alert'] });
}
