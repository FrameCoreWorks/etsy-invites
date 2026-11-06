import { loadTemplate, TEMPLATES_ROOT } from '../template/schema';
import { validateOrderData, type OrderData, type ValidationError } from '../template/validate';
import { orderToIssue, parseIssueBody } from './issue';

export type FixResult = { ok: true; body: string; labels: string[] } | { ok: false; errors: ValidationError[] };

/** The only way /fix: changes an order: new data must pass the template's validation; extras, dates and ids stay as they were. */
export async function applyFix(body: string, data: OrderData, templatesRoot = TEMPLATES_ROOT, today?: Date): Promise<FixResult> {
  const o = parseIssueBody(body);
  const errors = validateOrderData(await loadTemplate(o.slug, templatesRoot), data, today);
  if (errors.length) return { ok: false, errors };
  const draft = orderToIssue({ ...o, data }, []);
  return { ok: true, body: draft.body, labels: draft.labels };
}
