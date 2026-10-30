// One storage interface, two backends:
//   - Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is set  -> production
//   - local files in .dev-data/ when FINEST_DEV_DIR is set            -> development and tests
// Without either, storage is "none": the public site still renders from the
// seed content in the repo (read-only) so it can never go down for lack of a store.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BLOB = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const DEV_DIR = () => process.env.FINEST_DEV_DIR || '';

export function storageMode() {
  if (DEV_DIR()) return 'fs';
  if (BLOB()) return 'blob';
  return 'none';
}

let blobSdk;
async function sdk() {
  blobSdk ??= await import('@vercel/blob');
  return blobSdk;
}

function devPath(key) {
  const safe = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(DEV_DIR(), safe);
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

/** Read raw bytes. Returns { buffer, contentType, etag } or null. */
export async function getRaw(key) {
  const mode = storageMode();
  if (mode === 'fs') {
    try {
      const buffer = await fs.readFile(devPath(key));
      let contentType = 'application/octet-stream';
      try {
        contentType = JSON.parse(await fs.readFile(devPath(key) + '.meta', 'utf8')).contentType || contentType;
      } catch {}
      return { buffer, contentType, etag: String((await fs.stat(devPath(key))).mtimeMs) };
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }
  if (mode === 'blob') {
    const { get } = await sdk();
    const r = await get(key, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return { buffer: await streamToBuffer(r.stream), contentType: r.blob.contentType, etag: r.blob.etag };
  }
  return null;
}

export async function getJSON(key) {
  const r = await getRaw(key);
  if (!r) return null;
  try {
    return JSON.parse(r.buffer.toString('utf8'));
  } catch {
    return null;
  }
}

/** Write raw bytes. */
export async function putRaw(key, buffer, contentType = 'application/octet-stream') {
  const mode = storageMode();
  if (mode === 'fs') {
    const p = devPath(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, buffer);
    await fs.writeFile(p + '.meta', JSON.stringify({ contentType }));
    return;
  }
  if (mode === 'blob') {
    const { put } = await sdk();
    await put(key, buffer, { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType, cacheControlMaxAge: 60 });
    return;
  }
  throw Object.assign(new Error('Opslag is niet gekoppeld (BLOB_READ_WRITE_TOKEN ontbreekt).'), { status: 503 });
}

export const putJSON = (key, obj) => putRaw(key, Buffer.from(JSON.stringify(obj)), 'application/json');

export async function del(key) {
  const mode = storageMode();
  if (mode === 'fs') {
    await fs.rm(devPath(key), { force: true });
    await fs.rm(devPath(key) + '.meta', { force: true });
    return;
  }
  if (mode === 'blob') {
    const { del: bdel } = await sdk();
    await bdel(key);
    return;
  }
  throw Object.assign(new Error('Opslag is niet gekoppeld.'), { status: 503 });
}

/** List keys under a prefix: [{ key, size, uploadedAt }] */
export async function list(prefix) {
  const mode = storageMode();
  if (mode === 'fs') {
    const out = [];
    async function walk(dir) {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (!e.name.endsWith('.meta')) {
          const key = path.relative(DEV_DIR(), full).split(path.sep).join('/');
          if (key.startsWith(prefix)) {
            const st = await fs.stat(full);
            out.push({ key, size: st.size, uploadedAt: st.mtime.toISOString() });
          }
        }
      }
    }
    await walk(DEV_DIR());
    return out;
  }
  if (mode === 'blob') {
    const { list: blist } = await sdk();
    const out = [];
    let cursor;
    do {
      const r = await blist({ prefix, cursor, limit: 1000 });
      for (const b of r.blobs) out.push({ key: b.pathname, size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() });
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out;
  }
  return [];
}
