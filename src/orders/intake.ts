import { loadTemplate, TEMPLATES_ROOT } from '../template/schema';
import { validateOrderData, type OrderData, type ValidationError } from '../template/validate';
import { ORDER_REGEX, EXTRA_KEYS } from './formMap';
import { orderToIssue, parseIssueBody, type IssueDraft, type Order } from './issue';

export type FormResponse = { responseId: string; slug: string; submittedAt: string; answers: Record<string, string> };

export interface IntakeGithub {
  /** The live issue for an order number; scrubbed tombstones are not returned. */
  findOrderIssue(order: string): Promise<{ number: number; body: string; state: string } | null>;
  processedResponseIds(): Promise<Set<string>>;
  createIssue(i: IssueDraft): Promise<number>;
  updateIssue(n: number, i: Partial<IssueDraft>): Promise<void>;
  comment(n: number, body: string): Promise<void>;
  reopen(n: number): Promise<void>;
  opsAlert(title: string, detail: string): Promise<void>;
}

export type IntakeDeps = {
  github: IntakeGithub;
  listResponses: () => Promise<FormResponse[]>;
  /** Called right after a valid order issue is created or updated (starts the proof render). */
  onReady?: (issue: number) => Promise<void>;
  now?: Date;
  templatesRoot?: string;
};

const HOUR = 3600_000;

export async function toOrder(r: FormResponse, templatesRoot = TEMPLATES_ROOT, today?: Date): Promise<{ order: Order; errors: ValidationError[] }> {
  const yes = (k: string) => r.answers[k] === 'Yes';
  const data: OrderData = {};
  for (const [k, v] of Object.entries(r.answers)) if (!(EXTRA_KEYS as readonly string[]).includes(k) && v !== '') data[k] = v.trim();
  const express = yes('express');
  const order: Order = {
    order: (r.answers.order ?? '').trim(),
    slug: r.slug,
    data,
    extras: { express, wide: yes('wide'), illustration: yes('illustration') },
    submittedAt: new Date(r.submittedAt).toISOString(),
    dueAt: new Date(new Date(r.submittedAt).getTime() + (express ? 24 : 48) * HOUR).toISOString(),
    responseIds: [r.responseId],
  };
  const errors = validateOrderData(await loadTemplate(r.slug, templatesRoot), data, today);
  if (!ORDER_REGEX.test(order.order)) {
    errors.unshift({ field: 'order', code: 'required', message: 'The Etsy order number should be digits only, as shown on your Etsy receipt.' });
  }
  return { order, errors };
}

export async function runIntake(deps: IntakeDeps): Promise<{ created: number; updated: number }> {
  const { github } = deps;
  let responses: FormResponse[];
  try {
    responses = await deps.listResponses();
  } catch (e) {
    await github.opsAlert('intake: nie można odczytać formularzy', String((e as Error).message ?? e));
    throw e;
  }
  const seen = await github.processedResponseIds();
  let created = 0;
  let updated = 0;
  for (const r of [...responses].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))) {
    if (seen.has(r.responseId)) continue;
    try {
      if ((await importResponse(deps, r)) === 'created') created++;
      else updated++;
      seen.add(r.responseId);
    } catch (e) {
      // One bad response must not block the queue; it is retried on the next run.
      await github.opsAlert(`intake: odpowiedź ${r.responseId} nie została zaimportowana`, String((e as Error).stack ?? e));
    }
  }
  return { created, updated };
}

async function importResponse(deps: IntakeDeps, r: FormResponse): Promise<'created' | 'updated'> {
  const { github } = deps;
  const { order, errors } = await toOrder(r, deps.templatesRoot, deps.now);
  const existing = ORDER_REGEX.test(order.order) ? await github.findOrderIssue(order.order) : null;
  let n: number;
  let kind: 'created' | 'updated';
  if (existing) {
    const prev = parseIssueBody(existing.body);
    const merged: Order = { ...order, responseIds: [...prev.responseIds, r.responseId] };
    const draft = orderToIssue(merged, errors);
    await github.updateIssue(existing.number, { body: draft.body, labels: draft.labels });
    const reopened = existing.state !== 'open';
    if (reopened) await github.reopen(existing.number);
    await github.comment(
      existing.number,
      `Klient wysłał formularz ponownie (${r.submittedAt})${reopened ? '. Zamówienie było zamknięte, otwarte ponownie' : ''}. Nowe dane:\n\n${draft.body.split('\n\nKomendy:')[0]}`,
    );
    n = existing.number;
    kind = 'updated';
  } else {
    n = await github.createIssue(orderToIssue(order, errors));
    kind = 'created';
  }
  if (errors.length === 0) await deps.onReady?.(n);
  return kind;
}
