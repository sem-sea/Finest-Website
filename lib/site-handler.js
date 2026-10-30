// Public site: pages, articles, media, sitemap, robots, feed.
import { getSettings, getDoc, listLive, isLive } from './content.js';
import { renderPage, renderArticle, renderNotFound, renderSitemap, renderFeed } from './render.js';
import { getRaw } from './storage.js';
import { validSlug } from './content.js';

export async function loadCtx(pathname, extra = {}) {
  const [settings, posts, stories] = await Promise.all([getSettings(), listLive('posts'), listLive('stories')]);
  return { settings, path: pathname, lists: { posts, stories }, ...extra };
}

function send(res, status, body, type, cache) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  res.end(body);
}
const HTML = 'text/html; charset=utf-8';
const PAGE_CACHE = 'public, max-age=0, s-maxage=30, stale-while-revalidate=300';

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
      if (doc && isLive(doc)) return send(res, 200, renderPage(doc, { ...ctx, path: '/' }), HTML, PAGE_CACHE);
    } else if (parts.length === 1 && validSlug(parts[0])) {
      const doc = await getDoc('pages', parts[0]);
      if (doc && isLive(doc)) return send(res, 200, renderPage(doc, ctx), HTML, PAGE_CACHE);
    } else if (parts.length === 2 && (parts[0] === 'nieuws' || parts[0] === 'klantverhalen') && validSlug(parts[1])) {
      const kind = parts[0] === 'nieuws' ? 'posts' : 'stories';
      const doc = await getDoc(kind, parts[1]);
      if (doc && isLive(doc)) return send(res, 200, renderArticle(doc, ctx, kind), HTML, PAGE_CACHE);
    }
    return send(res, 404, renderNotFound(ctx), HTML, 'public, max-age=0, s-maxage=30');
  } catch (e) {
    console.error('site error', e);
    return send(res, 500, '<!doctype html><meta charset="utf-8"><title>Fout</title><p>Er ging iets mis. Probeer het zo opnieuw.</p>', HTML, 'no-store');
  }
}
