import { describe, it, expect } from 'vitest';
import { persistRefreshToken } from '../../src/etsy/persistToken';

describe('persistRefreshToken', () => {
  it('writes the token to the repo secret via gh with SECRETS_PAT, token on stdin', async () => {
    const calls: { cmd: string; args: string[]; input: string; env: NodeJS.ProcessEnv }[] = [];
    await persistRefreshToken('rt-new', { SECRETS_PAT: 'pat', GITHUB_REPOSITORY: 'o/r' }, async (cmd, args, input, env) => void calls.push({ cmd, args, input, env }));
    expect(calls[0].cmd).toBe('gh');
    expect(calls[0].args).toEqual(['secret', 'set', 'ETSY_REFRESH_TOKEN', '--repo', 'o/r']);
    expect(calls[0].input).toBe('rt-new');
    expect(calls[0].env.GH_TOKEN).toBe('pat');
  });
  it('fails loudly without SECRETS_PAT so a rotated token is never lost silently', async () => {
    await expect(persistRefreshToken('x', {}, async () => {})).rejects.toThrow(/SECRETS_PAT/);
  });
});
