import { describe, it, expect } from 'vitest';
import { parseCommand } from '../../src/orders/commands';

describe('parseCommand', () => {
  it('accepts /approve from the owner', () => expect(parseCommand('/approve', 'OWNER')).toEqual({ kind: 'approve' }));
  it('tolerates trailing whitespace and text after the first line', () =>
    expect(parseCommand('/approve  \nthanks', 'OWNER')).toEqual({ kind: 'approve' }));
  it('ignores commands from anyone else', () => {
    for (const a of ['CONTRIBUTOR', 'COLLABORATOR', 'MEMBER', 'NONE', 'FIRST_TIMER']) expect(parseCommand('/approve', a)).toBeNull();
  });
  it('parses /fix: with its text', () =>
    expect(parseCommand('/fix: change the date to 2027-06-12', 'OWNER')).toEqual({ kind: 'fix', text: 'change the date to 2027-06-12' }));
  it('keeps multi-line fix text', () =>
    expect(parseCommand('/fix: line one\nline two', 'OWNER')).toEqual({ kind: 'fix', text: 'line one\nline two' }));
  it('rejects /fix: with no text', () => expect(parseCommand('/fix:   ', 'OWNER')).toBeNull());
  it('ignores commands not at the start', () => expect(parseCommand('looks good /approve', 'OWNER')).toBeNull());
  it('ignores /approved and similar', () => expect(parseCommand('/approved', 'OWNER')).toBeNull());
});
