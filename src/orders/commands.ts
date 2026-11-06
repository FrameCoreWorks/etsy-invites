export type Command = { kind: 'approve' } | { kind: 'fix'; text: string } | null;

/** Only the repo owner can steer orders; anyone else's comment is ignored. */
export function parseCommand(body: string, association: string): Command {
  if (association !== 'OWNER') return null;
  const text = body.replace(/\r\n/g, '\n');
  const first = text.split('\n')[0].trim();
  if (first === '/approve') return { kind: 'approve' };
  const m = /^\/fix:([\s\S]*)$/.exec(text.trimStart());
  if (m && m[1].trim()) return { kind: 'fix', text: m[1].trim() };
  return null;
}
