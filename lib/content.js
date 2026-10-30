// Content model: pages (made of blocks), posts (news), stories (klantverhalen),
// settings. Everything is validated and sanitised here before it is stored.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getJSON, putJSON, del, list, storageMode } from './storage.js';
import { cleanHtml, cleanText, cleanUrl, cleanImageUrl } from './sanitize.js';
import { rid, now, slugify, RESERVED_SLUGS, SPECIAL_PAGES } from './util.js';

const SEED_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content-seed');
export const COLLECTIONS = ['pages', 'posts', 'stories'];
export const SCENES = ['stats', 'mess', 'hub', 'balance'];
const TTL = () => (process.env.FINEST_NO_CACHE ? 0 : 10_000);

const cache = new Map();
async function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL()) return hit.v;
  const v = await loader();
  cache.set(key, { t: Date.now(), v });
  return v;
}
export const clearCache = () => cache.clear();

// ---------- seed / bootstrap ----------
async function readSeed(rel) {
  try {
    return JSON.parse(await fs.readFile(path.join(SEED_DIR, rel), 'utf8'));
  } catch {
    return null;
  }
}
async function seedFiles(col) {
  try {
    return (await fs.readdir(path.join(SEED_DIR, col))).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

const summary = (d) => ({
  slug: d.slug,
  title: d.title,
  status: d.status,
  publishAt: d.publishAt || '',
  date: d.date || '',
  category: d.category || '',
  author: d.author || '',
  excerpt: d.excerpt || '',
  image: d.image || null,
  updatedAt: d.updatedAt,
});

let bootstrapped = false;
export async function ensureBootstrapped() {
  if (bootstrapped || storageMode() === 'none') return;
  if (await getJSON('data/_seeded.json')) {
    bootstrapped = true;
    return;
  }
  const settings = await readSeed('settings.json');
  if (settings) await putJSON('data/settings.json', settings);
  for (const col of COLLECTIONS) {
    const idx = [];
    for (const slug of await seedFiles(col)) {
      const doc = await readSeed(`${col}/${slug}.json`);
      if (!doc) continue;
      await putJSON(`data/${col}/${slug}.json`, doc);
      idx.push(summary(doc));
    }
    await putJSON(`data/index/${col}.json`, idx);
  }
  await putJSON('data/_seeded.json', { at: now() });
  bootstrapped = true;
}

// ---------- settings ----------
export async function getSettings() {
  return cached('settings', async () => {
    const seed = (await readSeed('settings.json')) || {};
    if (storageMode() === 'none') return seed;
    await ensureBootstrapped();
    const saved = (await getJSON('data/settings.json')) || {};
    return { ...seed, ...saved };
  });
}

export function normalizeSettings(input, current = {}) {
  const links = (arr) =>
    (Array.isArray(arr) ? arr : []).slice(0, 20).map((l) => ({ label: cleanText(l.label, 60), url: cleanUrl(l.url) })).filter((l) => l.label && l.url);
  const m = input.motion || {};
  const dur = Number(String(m.smoothDuration ?? 1.1).replace(',', '.'));
  return {
    ...current,
    siteName: cleanText(input.siteName, 80) || current.siteName || 'Website',
    wordmark: cleanText(input.wordmark, 60),
    tagline: cleanText(input.tagline, 160),
    siteUrl: (cleanUrl(input.siteUrl, 200) || current.siteUrl || '').replace(/\/+$/, ''),
    defaultSeo: { description: cleanText(input.defaultSeo?.description, 320), image: cleanImageUrl(input.defaultSeo?.image) },
    contact: { email: cleanText(input.contact?.email, 150), notifyEmail: cleanText(input.contact?.notifyEmail, 150) },
    whatsapp: { number: String(input.whatsapp?.number || '').replace(/\D/g, '').slice(0, 15), message: cleanText(input.whatsapp?.message, 200) },
    loginUrl: cleanUrl(input.loginUrl) || '#',
    menu: links(input.menu),
    footer: { platform: links(input.footer?.platform), legal: links(input.footer?.legal), note: cleanText(input.footer?.note, 200) },
    motion: {
      animations: m.animations !== false,
      smoothScroll: m.smoothScroll !== false,
      smoothDuration: Number.isFinite(dur) ? Math.min(3, Math.max(0.3, dur)) : 1.1,
      reveals: m.reveals !== false,
      pinnedRail: m.pinnedRail !== false,
      progressBar: m.progressBar !== false,
    },
  };
}

export async function saveSettings(input) {
  const current = (await getSettings()) || {};
  const next = normalizeSettings(input, current);
  await putJSON('data/settings.json', next);
  clearCache();
  return next;
}

// ---------- documents ----------
const colType = { pages: 'page', posts: 'post', stories: 'story' };
export const validSlug = (s) => /^[a-z0-9][a-z0-9-]{0,78}$/.test(String(s || ''));

export async function getDoc(col, slug) {
  if (!COLLECTIONS.includes(col) || !validSlug(slug)) return null;
  return cached(`doc:${col}:${slug}`, async () => {
    if (storageMode() === 'none') return readSeed(`${col}/${slug}.json`);
    await ensureBootstrapped();
    return getJSON(`data/${col}/${slug}.json`);
  });
}

export async function listIndex(col) {
  return cached(`index:${col}`, async () => {
    if (storageMode() === 'none') {
      const out = [];
      for (const s of await seedFiles(col)) {
        const d = await readSeed(`${col}/${s}.json`);
        if (d) out.push(summary(d));
      }
      return out;
    }
    await ensureBootstrapped();
    return (await getJSON(`data/index/${col}.json`)) || [];
  });
}

/** published, or scheduled and due */
export function isLive(d, at = Date.now()) {
  if (!d) return false;
  if (d.status === 'published') return true;
  if (d.status === 'scheduled' && d.publishAt) return new Date(d.publishAt).getTime() <= at;
  return false;
}

export async function listLive(col) {
  const idx = await listIndex(col);
  return idx.filter((d) => isLive(d)).sort((a, b) => String(b.date || b.updatedAt).localeCompare(String(a.date || a.updatedAt)));
}

// ---------- normalisation ----------
const oneOf = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
const bool = (v) => v === true || v === 'true' || v === 1;

export function normalizeBlock(b) {
  const id = /^[a-f0-9]{6,20}$/.test(b.id || '') ? b.id : rid(4);
  const t = String(b.type);
  switch (t) {
    case 'hero':
      return { id, type: t, image: cleanImageUrl(b.image), alt: cleanText(b.alt, 200), eyebrow: cleanText(b.eyebrow, 80), title: cleanText(b.title, 200), lead: cleanText(b.lead, 400), buttonLabel: cleanText(b.buttonLabel, 60), buttonUrl: cleanUrl(b.buttonUrl) };
    case 'section':
      return { id, type: t, variant: oneOf(b.variant, ['default', 'dark', 'klei'], 'default'), narrow: bool(b.narrow), html: cleanHtml(b.html) };
    case 'explainer':
      return { id, type: t, variant: oneOf(b.variant, ['default', 'dark', 'klei'], 'default'), reverse: bool(b.reverse), scene: oneOf(b.scene, SCENES, 'stats'), html: cleanHtml(b.html) };
    case 'photo':
      return { id, type: t, src: cleanImageUrl(b.src), alt: cleanText(b.alt, 200) };
    case 'faq':
      return {
        id, type: t, heading: cleanText(b.heading, 120),
        items: (Array.isArray(b.items) ? b.items : []).slice(0, 60).map((i) => ({ q: cleanText(i.q, 200), a: cleanText(i.a, 2000) })).filter((i) => i.q),
        buttonLabel: cleanText(b.buttonLabel, 60), buttonUrl: cleanUrl(b.buttonUrl),
      };
    case 'stories':
      return { id, type: t, heading: cleanText(b.heading, 120), buttonLabel: cleanText(b.buttonLabel, 60), buttonUrl: cleanUrl(b.buttonUrl) };
    case 'list':
      return { id, type: t, collection: oneOf(b.collection, ['posts', 'stories'], 'posts'), heading: cleanText(b.heading, 120), emptyText: cleanText(b.emptyText, 200) };
    case 'team':
      return {
        id, type: t, heading: cleanText(b.heading, 120), intro: cleanText(b.intro, 300),
        members: (Array.isArray(b.members) ? b.members : []).slice(0, 24).map((m) => ({
          name: cleanText(m.name, 80), role: cleanText(m.role, 120), phone: cleanText(m.phone, 40), email: cleanText(m.email, 150),
          linkedin: cleanUrl(m.linkedin), photo: cleanImageUrl(m.photo), alt: cleanText(m.alt, 120),
        })).filter((m) => m.name),
      };
    case 'steps':
      return {
        id, type: t, variant: oneOf(b.variant, ['default', 'dark', 'klei'], 'klei'), heading: cleanText(b.heading, 120), intro: cleanText(b.intro, 400),
        steps: (Array.isArray(b.steps) ? b.steps : []).slice(0, 12).map((s) => ({ title: cleanText(s.title, 120), text: cleanText(s.text, 800) })).filter((s) => s.title),
      };
    case 'contact':
      return { id, type: t, heading: cleanText(b.heading, 120), lead: cleanText(b.lead, 400), formTitle: cleanText(b.formTitle, 80), directTitle: cleanText(b.directTitle, 80), directHtml: cleanHtml(b.directHtml) };
    case 'cta':
      return { id, type: t, eyebrow: cleanText(b.eyebrow, 80), heading: cleanText(b.heading, 200), html: cleanHtml(b.html), lockup: bool(b.lockup) };
    default:
      return null;
  }
}

function commonFields(input, col, existing) {
  const status = oneOf(input.status, ['draft', 'published', 'scheduled'], 'draft');
  let publishAt = '';
  if (status === 'scheduled') {
    const d = new Date(input.publishAt);
    publishAt = Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  return {
    type: colType[col],
    slug: existing?.slug || input.slug,
    title: cleanText(input.title, 200),
    status: status === 'scheduled' && !publishAt ? 'draft' : status,
    publishAt,
    seo: {
      title: cleanText(input.seo?.title, 120),
      description: cleanText(input.seo?.description, 320),
      image: cleanImageUrl(input.seo?.image),
      noindex: bool(input.seo?.noindex),
    },
  };
}

export function normalizeDoc(col, input, existing) {
  const base = commonFields(input, col, existing);
  if (col === 'pages') {
    const blocks = (Array.isArray(input.blocks) ? input.blocks : []).slice(0, 60).map(normalizeBlock).filter(Boolean);
    return { ...base, blocks };
  }
  const d = new Date(input.date);
  return {
    ...base,
    excerpt: cleanText(input.excerpt, 400),
    category: cleanText(input.category, 80),
    author: cleanText(input.author, 80),
    date: Number.isNaN(d.getTime()) ? existing?.date || now() : d.toISOString(),
    image: { src: cleanImageUrl(input.image?.src), card: cleanImageUrl(input.image?.card), alt: cleanText(input.image?.alt, 200) },
    html: cleanHtml(input.html),
  };
}

// ---------- save / delete / revisions ----------
export class Conflict extends Error {
  constructor(current) {
    super('Deze pagina is intussen door iemand anders gewijzigd.');
    this.status = 409;
    this.current = current;
  }
}

export async function saveDoc(col, input, user) {
  if (!COLLECTIONS.includes(col)) throw Object.assign(new Error('Onbekend type'), { status: 400 });
  const slug = String(input.slug || slugify(input.title));
  if (!validSlug(slug)) throw Object.assign(new Error('Ongeldige URL-naam (alleen a-z, 0-9 en streepjes).'), { status: 400 });
  if (col === 'pages' && RESERVED_SLUGS.has(slug) && !SPECIAL_PAGES.has(slug)) throw Object.assign(new Error('Deze URL-naam is gereserveerd.'), { status: 400 });
  if (!input.originalSlug && (await getJSON(`data/${col}/${slug}.json`))) throw Object.assign(new Error('Er bestaat al een item met deze URL-naam.'), { status: 409 });

  const originalSlug = input.originalSlug && validSlug(input.originalSlug) ? input.originalSlug : slug;
  const existing = await getJSON(`data/${col}/${originalSlug}.json`);
  if (existing && input.baseUpdatedAt && existing.updatedAt !== input.baseUpdatedAt) throw new Conflict(existing);
  if (originalSlug !== slug && (await getJSON(`data/${col}/${slug}.json`))) throw Object.assign(new Error('Er bestaat al een item met deze URL-naam.'), { status: 409 });
  if (SPECIAL_PAGES.has(originalSlug) && col === 'pages' && originalSlug !== slug) throw Object.assign(new Error('De URL van deze vaste pagina kan niet worden gewijzigd.'), { status: 400 });

  const doc = normalizeDoc(col, { ...input, slug }, existing && originalSlug === slug ? existing : { slug });
  if (!doc.title) throw Object.assign(new Error('Een titel is verplicht.'), { status: 400 });
  doc.slug = slug;
  doc.createdAt = existing?.createdAt || now();
  doc.updatedAt = now();
  doc.updatedBy = user?.name || user?.email || '';

  if (existing) {
    await putJSON(`data/revisions/${col}/${originalSlug}/${Date.now()}.json`, { ...existing, savedAt: now() });
    const revs = (await list(`data/revisions/${col}/${originalSlug}/`)).sort((a, b) => a.key.localeCompare(b.key));
    for (const old of revs.slice(0, Math.max(0, revs.length - 20))) await del(old.key);
  }
  await putJSON(`data/${col}/${slug}.json`, doc);
  let idx = ((await getJSON(`data/index/${col}.json`)) || []).filter((d) => d.slug !== originalSlug && d.slug !== slug);
  idx.push(summary(doc));
  await putJSON(`data/index/${col}.json`, idx);
  if (originalSlug !== slug) await del(`data/${col}/${originalSlug}.json`);
  clearCache();
  return doc;
}

export async function deleteDoc(col, slug) {
  if (!COLLECTIONS.includes(col) || !validSlug(slug)) throw Object.assign(new Error('Onbekend item'), { status: 400 });
  if (col === 'pages' && SPECIAL_PAGES.has(slug)) throw Object.assign(new Error('Deze vaste pagina kan niet worden verwijderd.'), { status: 400 });
  const existing = await getJSON(`data/${col}/${slug}.json`);
  if (!existing) throw Object.assign(new Error('Niet gevonden'), { status: 404 });
  await putJSON(`data/trash/${col}/${slug}-${Date.now()}.json`, { ...existing, deletedAt: now() });
  await del(`data/${col}/${slug}.json`);
  const idx = ((await getJSON(`data/index/${col}.json`)) || []).filter((d) => d.slug !== slug);
  await putJSON(`data/index/${col}.json`, idx);
  clearCache();
}

export async function listRevisions(col, slug) {
  if (!COLLECTIONS.includes(col) || !validSlug(slug)) return [];
  return (await list(`data/revisions/${col}/${slug}/`)).sort((a, b) => b.key.localeCompare(a.key)).map((r) => ({ id: r.key.split('/').pop().replace('.json', ''), at: r.uploadedAt }));
}

export async function getRevision(col, slug, id) {
  if (!/^\d{10,16}$/.test(id) || !COLLECTIONS.includes(col) || !validSlug(slug)) return null;
  return getJSON(`data/revisions/${col}/${slug}/${id}.json`);
}
