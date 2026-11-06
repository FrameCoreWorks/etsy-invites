/**
 * Minimal Etsy Open API v3 client for draft listings and reports.
 * Request handling adapted from aserper/etsy-mcp (MIT, (c) 2026 Amit Serper), see docs/etsy-mcp-review.md.
 * Hard rule: this client never makes a listing active. Publishing is done by a human in the Etsy UI.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://openapi.etsy.com/v3/application';
const TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

export class EtsyApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`Etsy API ${status}: ${JSON.stringify(body)}`);
    this.name = 'EtsyApiError';
  }
}
export class PublishForbidden extends Error {
  constructor() {
    super('agent may not set a listing active; publish it by hand in Etsy');
    this.name = 'PublishForbidden';
  }
}

export type EtsyClientConfig = {
  apiKey: string;
  sharedSecret: string;
  refreshToken: string;
  onRefreshToken?: (token: string) => Promise<void>;
  fetch?: typeof fetch;
  minIntervalMs?: number;
};

export type DraftListing = {
  title: string;
  description: string;
  price: number;
  quantity: number;
  who_made: 'i_did' | 'someone_else' | 'collective';
  when_made: string;
  taxonomy_id: number;
  type: 'download';
  tags?: string[];
  is_personalizable?: boolean;
  personalization_is_required?: boolean;
  personalization_instructions?: string;
  should_auto_renew?: boolean;
};

export class EtsyClient {
  private accessToken: string | null = null;
  private expiresAt = 0;
  private last = 0;
  private readonly fetchFn: typeof fetch;

  constructor(private cfg: EtsyClientConfig) {
    this.fetchFn = cfg.fetch ?? fetch;
  }

  static fromEnv(onRefreshToken?: (t: string) => Promise<void>): EtsyClient {
    const need = (k: string) => process.env[k] ?? (() => { throw new Error(`${k} is not set`); })();
    return new EtsyClient({ apiKey: need('ETSY_API_KEY'), sharedSecret: need('ETSY_SHARED_SECRET'), refreshToken: need('ETSY_REFRESH_TOKEN'), onRefreshToken });
  }

  private async token(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) return this.accessToken;
    const res = await this.fetchFn(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: this.cfg.apiKey, refresh_token: this.cfg.refreshToken }).toString(),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new EtsyApiError(res.status, body);
    this.accessToken = body.access_token;
    this.expiresAt = Date.now() + body.expires_in * 1000;
    if (body.refresh_token && body.refresh_token !== this.cfg.refreshToken) {
      this.cfg.refreshToken = body.refresh_token;
      await this.cfg.onRefreshToken?.(body.refresh_token);
    }
    return this.accessToken!;
  }

  private async request<T>(method: string, p: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const wait = (this.cfg.minIntervalMs ?? 200) - (Date.now() - this.last);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.last = Date.now();
    const url = new URL(API + p);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    const headers: Record<string, string> = { 'x-api-key': `${this.cfg.apiKey}:${this.cfg.sharedSecret}`, Authorization: `Bearer ${await this.token()}` };
    const isForm = body instanceof FormData;
    if (body && !isForm) headers['Content-Type'] = 'application/json';
    const res = await this.fetchFn(url.toString(), { method, headers, body: isForm ? body : body ? JSON.stringify(body) : undefined });
    if (res.status === 204) return null as T;
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new EtsyApiError(res.status, json);
    return json as T;
  }

  get<T = unknown>(p: string, query?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', p, undefined, query);
  }

  async createDraftListing(shopId: number, listing: DraftListing): Promise<{ listing_id: number }> {
    if ((listing as { state?: string }).state === 'active') throw new PublishForbidden();
    return this.request('POST', `/shops/${shopId}/listings`, listing);
  }

  async updateListing(shopId: number, listingId: number, patch: Record<string, unknown>): Promise<unknown> {
    if (patch.state === 'active') throw new PublishForbidden();
    return this.request('PATCH', `/shops/${shopId}/listings/${listingId}`, patch);
  }

  private async upload(p: string, field: string, file: string, extra: Record<string, string> = {}): Promise<unknown> {
    const form = new FormData();
    form.append(field, new Blob([await readFile(file)]), path.basename(file));
    for (const [k, v] of Object.entries(extra)) form.append(k, v);
    return this.request('POST', p, form);
  }

  uploadListingImage(shopId: number, listingId: number, file: string, rank: number, altText?: string) {
    return this.upload(`/shops/${shopId}/listings/${listingId}/images`, 'image', file, { rank: String(rank), ...(altText ? { alt_text: altText } : {}) });
  }

  uploadListingVideo(shopId: number, listingId: number, file: string) {
    return this.upload(`/shops/${shopId}/listings/${listingId}/videos`, 'video', file);
  }

  uploadListingFile(shopId: number, listingId: number, file: string, name: string, rank = 1) {
    return this.upload(`/shops/${shopId}/listings/${listingId}/files`, 'file', file, { name, rank: String(rank) });
  }
}
