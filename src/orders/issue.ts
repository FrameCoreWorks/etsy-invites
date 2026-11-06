import type { OrderData, ValidationError } from '../template/validate';
import { customerMessage } from '../template/validate';

export type Order = {
  order: string;
  slug: string;
  data: OrderData;
  extras: { express: boolean; wide: boolean; illustration: boolean };
  submittedAt: string;
  dueAt: string;
  responseIds: string[];
};

export type IssueDraft = { title: string; body: string; labels: string[] };

const FENCE = '```order-data';

export function orderToIssue(o: Order, errors: ValidationError[]): IssueDraft {
  const labels = ['order'];
  if (o.extras.express) labels.push('express');
  if (o.extras.wide) labels.push('wide');
  if (o.extras.illustration) labels.push('illustration');
  if (errors.length) labels.push('needs-info');

  // Customer text: one table line per field, no pipes or backticks that could break the layout or the data fence.
  const cell = (v: string) => v.replace(/\r?\n/g, ' ').replace(/([|`])/g, '\\$1');
  const rows = Object.entries(o.data).map(([k, v]) => `| ${k} | ${cell(v)} |`);
  const body = [
    `**Zamówienie Etsy:** ${o.order}  `,
    `**Szablon:** \`${o.slug}\`  `,
    `**Termin proofu:** ${o.dueAt}${o.extras.express ? ' (ekspres)' : ''}`,
    '',
    '| Pole | Wartość |',
    '|---|---|',
    ...rows,
    '',
    ...(errors.length
      ? ['### Brakujące lub błędne dane', '', 'Gotowa wiadomość do klienta (wyślij w Etsy):', '', '```text', customerMessage(errors), '```', '']
      : []),
    'Komendy: `/approve` renderuje finał, `/fix: <opis>` poprawia dane.',
    '',
    FENCE,
    JSON.stringify(o, null, 2),
    '```',
  ].join('\n');
  return { title: `#${o.order} ${o.slug}`, body, labels };
}

export function parseIssueBody(body: string): Order {
  // The real fence is the last one on its own line; JSON inside it cannot contain raw newlines.
  const start = body.replace(/\r\n/g, '\n').lastIndexOf(`\n${FENCE}\n`);
  if (start < 0) throw new Error('issue body has no order-data block');
  const rest = body.replace(/\r\n/g, '\n').slice(start + FENCE.length + 1);
  const end = rest.indexOf('\n```');
  return JSON.parse(rest.slice(0, end));
}

/** Response ids survive the 30-day scrub as an HTML comment, so intake never re-imports a scrubbed order. */
export const scrubMarker = (ids: string[]) => `<!-- responses: ${ids.join(',')} -->`;

export function responseIdsFromBody(body: string): string[] {
  const m = /<!-- responses: ([^>]*) -->/.exec(body);
  if (m) return m[1].split(',').filter(Boolean);
  try {
    return parseIssueBody(body).responseIds;
  } catch {
    return [];
  }
}
