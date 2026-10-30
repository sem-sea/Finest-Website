// Local server that behaves like the Vercel deployment: static files first,
// then /api/* (admin + contact) and everything else through the page renderer.
// Storage is a folder (.dev-data/) instead of Vercel Blob.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.FINEST_DEV_DIR ||= path.join(root, '.dev-data');
process.env.FINEST_NO_CACHE ||= '1';
process.env.CMS_SETUP_TOKEN ||= 'dev-setup-token-1234567890';

const { handleCms } = await import('../lib/cms-handler.js');
const { handleSite } = await import('../lib/site-handler.js');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain',
};

async function tryStatic(req, res, pathname) {
  if (!/^\/(assets|admin)(\/|$)|^\/og-image\.jpg$/.test(pathname)) return false;
  let file = path.join(root, decodeURIComponent(pathname));
  if (!file.startsWith(root)) return false;
  try {
    let st = await fs.stat(file);
    if (st.isDirectory()) {
      file = path.join(file, 'index.html');
      st = await fs.stat(file);
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(file));
    return true;
  } catch {
    return false;
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    const p = url.pathname;
    if (await tryStatic(req, res, p)) return;
    if (p.startsWith('/api/')) {
      const route = p.replace(/^\/api\/(cms\/?)?/, '');
      const q = new URLSearchParams(url.search);
      if (!q.has('route')) q.set('route', route);
      req.url = `/api/cms?${q.toString()}`;
      return handleCms(req, res);
    }
    req.url = `/api/site?path=${encodeURIComponent(p.replace(/^\/+/, ''))}`;
    return handleSite(req, res);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, '127.0.0.1', () => console.log(`CMS dev server on http://127.0.0.1:${port}  (setup token: ${process.env.CMS_SETUP_TOKEN})`));
}
