import { createReadStream } from 'node:fs';
import path from 'node:path';
import { drive as driveApi, type drive_v3 } from '@googleapis/drive';
import { googleAuth } from '../google/auth';

const FOLDER = 'application/vnd.google-apps.folder';
const ROOT_NAME = 'etsy-invites-orders';

async function findOrCreateFolder(d: drive_v3.Drive, name: string, parent?: string): Promise<string> {
  const q = [`name = '${name.replace(/'/g, "\\'")}'`, `mimeType = '${FOLDER}'`, 'trashed = false', parent ? `'${parent}' in parents` : null].filter(Boolean).join(' and ');
  const found = await d.files.list({ q, fields: 'files(id)', pageSize: 1 });
  if (found.data.files?.[0]?.id) return found.data.files[0].id;
  const created = await d.files.create({ requestBody: { name, mimeType: FOLDER, parents: parent ? [parent] : undefined }, fields: 'id' });
  return created.data.id!;
}

/** Uploads files to etsy-invites-orders/<order>/<kind>/ and returns a link anyone can open. */
export async function uploadOrder(order: string, files: string[], kind: 'proof' | 'final'): Promise<string> {
  const d = driveApi({ version: 'v3', auth: googleAuth() });
  const root = await findOrCreateFolder(d, ROOT_NAME);
  const orderFolder = await findOrCreateFolder(d, order, root);
  const folder = await findOrCreateFolder(d, kind, orderFolder);
  for (const file of files) {
    await d.files.create({ requestBody: { name: path.basename(file), parents: [folder] }, media: { mimeType: 'video/mp4', body: createReadStream(file) }, fields: 'id' });
  }
  await d.permissions.create({ fileId: folder, requestBody: { role: 'reader', type: 'anyone' } });
  const meta = await d.files.get({ fileId: folder, fields: 'webViewLink' });
  return meta.data.webViewLink!;
}

/** Deletes etsy-invites-orders/<order> (cleanup after 30 days). Missing folder is not an error. */
export async function deleteOrderFolder(order: string): Promise<void> {
  const d = driveApi({ version: 'v3', auth: googleAuth() });
  const root = await findOrCreateFolder(d, ROOT_NAME);
  const found = await d.files.list({ q: `name = '${order}' and '${root}' in parents and trashed = false`, fields: 'files(id)' });
  for (const f of found.data.files ?? []) await d.files.delete({ fileId: f.id! });
}
