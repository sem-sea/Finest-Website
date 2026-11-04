// Public site: pages, articles, media, sitemap, robots, feed.
import { getSettings, getDoc, listLive, isLive } from './content.js';
import { renderPage, renderArticle, renderNotFound, renderSitemap, renderFeed, renderTeaser } from './render.js';
import { userFromRequest } from './auth.js';
import { parseCookies, sha } from './util.js';
import { timingSafeEqual } from 'node:crypto';
import { getRaw } from './storage.js';
import { validSlug } from './content.js';

export async function loadCtx(pathname, extra = {}) {
  const [settings, posts, stories] = await Promise.all([getSettings(), listLive('posts'), listLive('stories')]);
  return { settings, path: pathname, lists: { posts, stories }, ...extra };
}

function send(res, status, body, type, cache, extra = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': cache,
    ...extra,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  res.end(body);
}
const HTML = 'text/html; charset=utf-8';
// short CDN cache: a change (or switching the teaser on) is visible within about a minute
const PAGE_CACHE = 'public, max-age=0, s-maxage=15, stale-while-revalidate=45';

const safeEq = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Who may see the real site while the teaser is on: logged-in CMS users and holders of the preview link. */
async function teaserBypass(req, key) {
  try {
    if (await userFromRequest(req)) return { ok: true };
  } catch {
    /* no session secret / storage: not a bypass */
  }
  if (!key) return { ok: false };
  const token = sha(key + '|teaser-preview');
  const url = new URL(req.url, 'http://local');
  const given = url.searchParams.get('voorbeeld');
  if (given && safeEq(given, key)) {
    const secure = !/^(127\.0\.0\.1|localhost)/.test(req.headers.host || '');
    return { ok: true, cookie: `fi_preview=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure ? '; Secure' : ''}` };
  }
  const have = parseCookies(req.headers.cookie).fi_preview;
  return { ok: !!have && safeEq(have, token) };
}

export function requestPath(req) {
  const url = new URL(req.url, 'http://local');
  let p = url.searchParams.get('path');
  if (p === null) p = url.pathname;
  p = '/' + String(p).replace(/^\/+/, '').replace(/\/+$/, '');
  return p;
}

export async function handleSite(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain', 'no-store');
  const p = requestPath(req);

  try {
    if (p.startsWith('/media/')) {
      const name = p.slice(7);
      if (!/^[a-z0-9][a-z0-9._-]{3,120}$/i.test(name)) return send(res, 404, 'Not found', 'text/plain', 'no-store');
      const f = await getRaw(`media/${name}`);
      if (!f) return send(res, 404, 'Not found', 'text/plain', 'public, max-age=60');
      return send(res, 200, f.buffer, f.contentType, 'public, max-age=31536000, immutable');
    }

    const ctx = await loadCtx(p);
    const site = ctx.settings.siteUrl || '';
    let privateCache = null;
    let extraHeaders = {};

    // teaser mode: everyone except CMS users and preview-link holders sees the teaser (503, not indexed)
    if (ctx.settings.teaser?.enabled && p !== '/robots.txt') {
      const by = await teaserBypass(req, ctx.settings.teaser.previewKey);
      if (!by.ok) return send(res, 503, renderTeaser(ctx), HTML, 'no-store', { 'Retry-After': '3600', 'X-Robots-Tag': 'noindex, nofollow' });
      privateCache = 'private, no-store';
      extraHeaders = by.cookie ? { 'Set-Cookie': by.cookie } : {};
    }

    if (p === '/robots.txt') return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`, 'text/plain; charset=utf-8', PAGE_CACHE);

    if (p === '/sitemap.xml') {
      const pages = (await listLive('pages')).filter((d) => !d.seo?.noindex);
      const items = [
        ...pages.map((d) => ({ path: d.slug === 'home' ? '/' : `/${d.slug}`, lastmod: d.updatedAt })),
        ...ctx.lists.posts.map((d) => ({ path: `/nieuws/${d.slug}`, lastmod: d.updatedAt })),
        ...ctx.lists.stories.map((d) => ({ path: `/klantverhalen/${d.slug}`, lastmod: d.updatedAt })),
      ];
      return send(res, 200, renderSitemap(ctx, items), 'application/xml; charset=utf-8', PAGE_CACHE);
    }
    if (p === '/feed.xml') return send(res, 200, renderFeed(ctx, ctx.lists.posts), 'application/rss+xml; charset=utf-8', PAGE_CACHE);

    const parts = p.split('/').filter(Boolean);
    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'home')) {
      const doc = await getDoc('pages', 'home');
      if (doc && isLive(doc)) return send(res, 200, renderPage(doc, { ...ctx, path: '/' }), HTML, privateCache || PAGE_CACHE, extraHeaders);
    } else if (parts.length === 1 && validSlug(parts[0])) {
      const doc = await getDoc('pages', parts[0]);
      if (doc && isLive(doc)) return send(res, 200, renderPage(doc, ctx), HTML, privateCache || PAGE_CACHE, extraHeaders);
    } else if (parts.length === 2 && (parts[0] === 'nieuws' || parts[0] === 'klantverhalen') && validSlug(parts[1])) {
      const kind = parts[0] === 'nieuws' ? 'posts' : 'stories';
      const doc = await getDoc(kind, parts[1]);
      if (doc && isLive(doc)) return send(res, 200, renderArticle(doc, ctx, kind), HTML, privateCache || PAGE_CACHE, extraHeaders);
    }
    return send(res, 404, renderNotFound(ctx), HTML, privateCache || 'public, max-age=0, s-maxage=15', extraHeaders);
  } catch (e) {
    console.error('site error', e);
    return send(res, 500, '<!doctype html><meta charset="utf-8"><title>Fout</title><p>Er ging iets mis. Probeer het zo opnieuw.</p>', HTML, 'no-store');
  }
}
