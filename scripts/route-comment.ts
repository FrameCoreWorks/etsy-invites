/** Reads the issue_comment event and prints command=<approve|fix|none> to $GITHUB_OUTPUT. */
import { appendFile, readFile } from 'node:fs/promises';
import { parseCommand } from '../src/orders/commands';

const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH!, 'utf8'));
const isOrder = (event.issue?.labels ?? []).some((l: { name: string }) => l.name === 'order') && !event.issue?.pull_request;
const cmd = isOrder ? parseCommand(event.comment?.body ?? '', event.comment?.author_association ?? 'NONE') : null;
const out = `command=${cmd?.kind ?? 'none'}\n`;
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, out);
console.log(out.trim());
