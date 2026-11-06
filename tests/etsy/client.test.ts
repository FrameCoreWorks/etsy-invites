import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { EtsyClient, PublishForbidden } from '../../src/etsy/client';

type Call = { url: string; init: RequestInit };

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Call[] = [];
  const fn = async (url: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const r = responses.shift() ?? { status: 200, body: {} };
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } });
  };
  return { fn: fn as typeof fetch, calls };
}

const base = { apiKey: 'key', sharedSecret: 'secret', refreshToken: 'rt-old', minIntervalMs: 0 };

describe('EtsyClient', () => {
  it('refreshes the token first, sends x-api-key key:secret and reports the new refresh token', async () => {
    const f = fakeFetch([{ status: 200, body: { access_token: 'at', refresh_token: 'rt-new', expires_in: 3600 } }, { status: 200, body: { results: [] } }]);
    const saved: string[] = [];
    const c = new EtsyClient({ ...base, fetch: f.fn, onRefreshToken: async (t) => void saved.push(t) });
    await c.get('/shops/1/listings');
    expect(f.calls[0].url).toBe('https://api.etsy.com/v3/public/oauth/token');
    expect(String(f.calls[0].init.body)).toContain('grant_type=refresh_token');
    const h = f.calls[1].init.headers as Record<string, string>;
    expect(h['x-api-key']).toBe('key:secret');
    expect(h.Authorization).toBe('Bearer at');
    expect(saved).toEqual(['rt-new']);
  });
  it('uploads a digital file as multipart with file, name and rank', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'etsy-'));
    const file = path.join(dir, 'next-steps.pdf');
    await writeFile(file, 'pdf');
    const f = fakeFetch([{ status: 200, body: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 } }, { status: 201, body: { listing_file_id: 5 } }]);
    const c = new EtsyClient({ ...base, fetch: f.fn });
    await c.uploadListingFile(7, 9, file, 'Next steps.pdf', 1);
    expect(f.calls[1].url).toBe('https://openapi.etsy.com/v3/application/shops/7/listings/9/files');
    const form = f.calls[1].init.body as FormData;
    expect(form.get('name')).toBe('Next steps.pdf');
    expect(form.get('rank')).toBe('1');
    expect(form.get('file')).toBeInstanceOf(Blob);
  });
  it('never sets a listing active', async () => {
    const f = fakeFetch([]);
    const c = new EtsyClient({ ...base, fetch: f.fn });
    await expect(c.updateListing(7, 9, { state: 'active' })).rejects.toBeInstanceOf(PublishForbidden);
    await expect(c.createDraftListing(7, { state: 'active' } as never)).rejects.toBeInstanceOf(PublishForbidden);
    expect(f.calls).toHaveLength(0);
  });
  it('raises on 401 after a fresh token', async () => {
    const f = fakeFetch([{ status: 200, body: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 } }, { status: 401, body: { error: 'invalid_token' } }]);
    const c = new EtsyClient({ ...base, fetch: f.fn });
    await expect(c.get('/shops/1')).rejects.toMatchObject({ status: 401 });
  });
});
