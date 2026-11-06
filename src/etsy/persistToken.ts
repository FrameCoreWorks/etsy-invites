import { spawn } from 'node:child_process';

export type Runner = (cmd: string, args: string[], input: string, env: NodeJS.ProcessEnv) => Promise<void>;

const spawnRunner: Runner = (cmd, args, input, env) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: ['pipe', 'inherit', 'inherit'] });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.stdin.end(input);
  });

/** Etsy rotates refresh tokens; the new one replaces the ETSY_REFRESH_TOKEN repo secret. */
export async function persistRefreshToken(token: string, env: NodeJS.ProcessEnv = process.env, run: Runner = spawnRunner): Promise<void> {
  if (!env.SECRETS_PAT) throw new Error('SECRETS_PAT is not set: cannot store the rotated Etsy refresh token');
  const repo = env.GITHUB_REPOSITORY ?? 'FrameCoreWorks/etsy-invites';
  await run('gh', ['secret', 'set', 'ETSY_REFRESH_TOKEN', '--repo', repo], token, { ...env, GH_TOKEN: env.SECRETS_PAT });
}
