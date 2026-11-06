import { responseIdsFromBody, scrubMarker } from './issue';

export type ClosedIssue = { number: number; title: string; body: string; labels: string[]; closedAt: string };

export type CleanupDeps = {
  listClosedOrders(): Promise<ClosedIssue[]>;
  listComments(n: number): Promise<{ id: number; body: string }[]>;
  updateBody(n: number, body: string): Promise<void>;
  deleteComment(id: number): Promise<void>;
  addLabel(n: number, label: string): Promise<void>;
  deleteDriveFolder(order: string): Promise<void>;
};

const RETENTION_DAYS = 30;

/** Removes personal data 30 days after an order issue is closed: body, comments and Drive files. */
export async function runCleanup(deps: CleanupDeps, now: Date = new Date()): Promise<{ scrubbed: number }> {
  const cutoff = now.getTime() - RETENTION_DAYS * 86400_000;
  let scrubbed = 0;
  for (const i of await deps.listClosedOrders()) {
    if (i.labels.includes('scrubbed') || new Date(i.closedAt).getTime() > cutoff) continue;
    const order = /^#(\S+)/.exec(i.title)?.[1] ?? '';
    const slug = i.title.split(' ')[1] ?? '';
    try {
      if (order) await deps.deleteDriveFolder(order);
    } catch (e) {
      if ((e as { code?: number }).code !== 404) throw e;
    }
    for (const c of await deps.listComments(i.number)) await deps.deleteComment(c.id);
    const day = now.toISOString().slice(0, 10);
    await deps.updateBody(i.number, `#${order} ${slug}: dane osobowe usunięte ${day}.\n\n${scrubMarker(responseIdsFromBody(i.body))}`);
    await deps.addLabel(i.number, 'scrubbed');
    scrubbed++;
  }
  return { scrubbed };
}
