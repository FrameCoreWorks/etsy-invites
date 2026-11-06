import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { persistRefreshToken } from '../../src/etsy/persistToken';

const backup = () => path.join(mkdtempSync(path.join(tmpdir(), 'etsy-')), 'token');

describe('persistRefreshToken', () => {
  it('writes the token to the repo secret via gh with SECRETS_PAT, token on stdin', async () => {
    const calls: { cmd: string; args: string[]; input: string; env: NodeJS.ProcessEnv }[] = [];
    await persistRefreshToken('rt-new', { SECRETS_PAT: 'pat', GITHUB_REPOSITORY: 'o/r', ETSY_TOKEN_BACKUP: backup() }, async (cmd, args, input, env) => void calls.push({ cmd, args, input, env }));
    expect(calls[0].cmd).toBe('gh');
    expect(calls[0].args).toEqual(['secret', 'set', 'ETSY_REFRESH_TOKEN', '--repo', 'o/r']);
    expect(calls[0].input).toBe('rt-new');
    expect(calls[0].env.GH_TOKEN).toBe('pat');
  });
  it('fails loudly without SECRETS_PAT so a rotated token is never lost silently', async () => {
    await expect(persistRefreshToken('x', { ETSY_TOKEN_BACKUP: backup() }, async () => {})).rejects.toThrow(/SECRETS_PAT/);
  });
  it('keeps a 0600 local copy first, so the token survives a failed secret update', async () => {
    const file = backup();
    await expect(persistRefreshToken('rt-keep', { SECRETS_PAT: 'pat', ETSY_TOKEN_BACKUP: file }, async () => { throw new Error('gh failed'); })).rejects.toThrow('gh failed');
    expect(readFileSync(file, 'utf8')).toBe('rt-keep');
    expect(statSync(file).mode & 0o777).toBe(0o600);
  });
});
