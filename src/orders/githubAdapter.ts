import type { Octokit } from '@octokit/rest';
import { opsAlert, repoContext } from '../ops/github';
import { responseIdsFromBody } from './issue';
import type { IntakeGithub } from './intake';

export function intakeGithub(gh: Octokit): IntakeGithub {
  const ctx = repoContext();
  const orderIssues = () => gh.paginate(gh.issues.listForRepo, { ...ctx, labels: 'order', state: 'all', per_page: 100 });
  return {
    async findOrderIssue(order) {
      const isScrubbed = (i: { labels: (string | { name?: string })[] }) => i.labels.some((l) => (typeof l === 'string' ? l : l.name) === 'scrubbed');
      const hit = (await orderIssues()).find((i) => i.title.startsWith(`#${order} `) && !isScrubbed(i));
      return hit ? { number: hit.number, body: hit.body ?? '', state: hit.state } : null;
    },
    async processedResponseIds() {
      const ids = new Set<string>();
      for (const i of await orderIssues()) {
        responseIdsFromBody(i.body ?? '').forEach((id) => ids.add(id));
      }
      return ids;
    },
    async createIssue(i) {
      const r = await gh.issues.create({ ...ctx, ...i });
      return r.data.number;
    },
    async updateIssue(n, i) {
      await gh.issues.update({ ...ctx, issue_number: n, ...i });
    },
    async comment(n, body) {
      await gh.issues.createComment({ ...ctx, issue_number: n, body });
    },
    async reopen(n) {
      await gh.issues.update({ ...ctx, issue_number: n, state: 'open' });
    },
    opsAlert: (title, detail) => opsAlert(gh, title, detail),
  };
}

/** Starts render.yml for an issue; workflow_dispatch is the one event GITHUB_TOKEN may trigger. */
export async function dispatchRender(gh: Octokit, issue: number, mode: 'proof' | 'final'): Promise<void> {
  await gh.actions.createWorkflowDispatch({ ...repoContext(), workflow_id: 'render.yml', ref: process.env.GITHUB_REF_NAME ?? 'main', inputs: { issue: String(issue), mode } });
}

import type { RenderGithub } from './renderJob';

export function renderGithub(gh: Octokit): RenderGithub {
  const ctx = repoContext();
  return {
    async getIssue(n) {
      const { data } = await gh.issues.get({ ...ctx, issue_number: n });
      return { body: data.body ?? '', state: data.state, labels: data.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')) };
    },
    async comment(n, body) {
      await gh.issues.createComment({ ...ctx, issue_number: n, body });
    },
    async addLabels(n, labels) {
      await gh.issues.addLabels({ ...ctx, issue_number: n, labels });
    },
    async removeLabel(n, label) {
      await gh.issues.removeLabel({ ...ctx, issue_number: n, name: label });
    },
    opsAlert: (title, detail) => opsAlert(gh, title, detail),
  };
}
