import { ValidationFailed, type RenderOptions, type RenderResult } from '../../render/render';
import { customerMessage } from '../template/validate';
import type { Format } from '../template/schema';
import { parseIssueBody, type Order } from './issue';
import { isGoogleAuthError } from '../google/auth';

export interface RenderGithub {
  getIssue(n: number): Promise<{ body: string; labels: string[]; state: string }>;
  comment(n: number, body: string): Promise<void>;
  addLabels(n: number, labels: string[]): Promise<void>;
  removeLabel(n: number, label: string): Promise<void>;
  opsAlert(title: string, detail: string): Promise<void>;
}

export type RenderJobDeps = {
  github: RenderGithub;
  render: (opts: RenderOptions) => Promise<RenderResult>;
  upload: (order: string, files: string[], kind: 'proof' | 'final') => Promise<string>;
  outDir: string;
};

const tail = (s: string, lines = 50) => s.split('\n').slice(-lines).join('\n');

async function renderWithRetry(deps: RenderJobDeps, opts: RenderOptions): Promise<RenderResult> {
  try {
    return await deps.render(opts);
  } catch (e) {
    if (e instanceof ValidationFailed) throw e;
    return deps.render(opts);
  }
}

async function guarded(n: number, deps: RenderJobDeps, work: (o: Order) => Promise<void>): Promise<void> {
  const issue = await deps.github.getIssue(n);
  if (!issue.labels.includes('order')) return;
  if (issue.state !== 'open') {
    await deps.github.comment(n, 'Pominięte: zamówienie jest zamknięte. Otwórz Issue i powtórz komendę.');
    return;
  }
  if (issue.labels.includes('needs-info')) {
    await deps.github.comment(n, 'Pominięte: zamówienie ma etykietę needs-info. Popraw dane (`/fix:`) albo zdejmij etykietę i powtórz komendę.');
    return;
  }
  const o = parseIssueBody(issue.body);
  try {
    await work(o);
    await deps.github.removeLabel(n, 'render-failed').catch(() => {});
  } catch (e) {
    if (e instanceof ValidationFailed) {
      await deps.github.addLabels(n, ['needs-info']);
      await deps.github.comment(n, `Dane nie przechodzą walidacji. Wiadomość do klienta:\n\n\`\`\`text\n${customerMessage(e.errors)}\n\`\`\``);
      return;
    }
    if (isGoogleAuthError(e)) {
      await deps.github.opsAlert('Google: token odrzucony', `Issue #${n}: ${String((e as Error).message ?? e)}. Zaloguj się ponownie (docs/setup-google.md) i zaktualizuj sekret GOOGLE_OAUTH_JSON.`);
      await deps.github.addLabels(n, ['render-failed']);
      await deps.github.comment(n, 'Google odrzucił logowanie (Drive). Szczegóły w Issue ops-alert. Po odnowieniu tokenu powtórz komendę.');
      return;
    }
    await deps.github.addLabels(n, ['render-failed']);
    await deps.github.comment(n, `Render nie udał się dwa razy. Ostatnie linie logu:\n\n\`\`\`\n${tail(String((e as Error).stack ?? e))}\n\`\`\``);
  }
}

export async function runProof(n: number, deps: RenderJobDeps): Promise<void> {
  await guarded(n, deps, async (o) => {
    const r = await renderWithRetry(deps, { slug: o.slug, data: o.data, mode: 'proof', format: '9x16', outDir: deps.outDir });
    const link = await deps.upload(o.order, [r.file], 'proof');
    await deps.github.comment(n, `Proof gotowy (540×960, znak wodny): ${link}\n\nOdpowiedz \`/approve\` albo \`/fix: <opis>\`.`);
    await deps.github.removeLabel(n, 'ready-to-send').catch(() => {});
    await deps.github.addLabels(n, ['proof-sent']);
  });
}

export async function runFinal(n: number, deps: RenderJobDeps): Promise<void> {
  await guarded(n, deps, async (o) => {
    const formats: Format[] = o.extras.wide ? ['9x16', '16x9'] : ['9x16'];
    const files: string[] = [];
    for (const format of formats) {
      files.push((await renderWithRetry(deps, { slug: o.slug, data: o.data, mode: 'final', format, outDir: deps.outDir })).file);
    }
    const link = await deps.upload(o.order, files, 'final');
    await deps.github.comment(n, `Finał gotowy (${formats.join(' + ')}): ${link}\n\nWyślij link klientowi w wiadomości Etsy i zamknij Issue.`);
    await deps.github.removeLabel(n, 'proof-sent').catch(() => {});
    await deps.github.addLabels(n, ['ready-to-send']);
  });
}
