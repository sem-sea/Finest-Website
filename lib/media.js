// Media library: files in storage under media/, metadata in data/media.json.
import { getJSON, putJSON, putRaw, del } from './storage.js';
import { cleanText } from './sanitize.js';
import { rid, now, slugify } from './util.js';

const TYPES = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b) => b.slice(0, 8).toString('hex') === '89504e470d0a1a0a' },
  'image/webp': { ext: 'webp', magic: (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' },
  'image/gif': { ext: 'gif', magic: (b) => b.slice(0, 3).toString() === 'GIF' },
};
export const MAX_UPLOAD = 3 * 1024 * 1024;

export const listMedia = async () => ((await getJSON('data/media.json')) || []).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

export async function addMedia({ name, contentType, buffer, alt, width, height }, user) {
  const t = TYPES[contentType];
  if (!t) throw Object.assign(new Error('Alleen JPG, PNG, WebP en GIF zijn toegestaan.'), { status: 400 });
  if (!buffer.length || buffer.length > MAX_UPLOAD) throw Object.assign(new Error('Bestand is te groot (max. 3 MB).'), { status: 413 });
  if (!t.magic(buffer)) throw Object.assign(new Error('Het bestand is geen geldige afbeelding.'), { status: 400 });
  const base = slugify(String(name || 'afbeelding').replace(/\.[a-z0-9]+$/i, '')) || 'afbeelding';
  const id = rid(5);
  const file = `${id}-${base}.${t.ext}`;
  await putRaw(`media/${file}`, buffer, contentType);
  const item = {
    id, file, url: `/media/${file}`, name: cleanText(name, 120), alt: cleanText(alt, 200), type: contentType, size: buffer.length,
    width: Number(width) > 0 ? Math.min(20000, Math.round(width)) : 0, height: Number(height) > 0 ? Math.min(20000, Math.round(height)) : 0,
    uploadedAt: now(), by: user?.name || '',
  };
  const all = (await getJSON('data/media.json')) || [];
  all.push(item);
  await putJSON('data/media.json', all);
  return item;
}

export async function updateMedia(id, { alt }) {
  const all = (await getJSON('data/media.json')) || [];
  const m = all.find((x) => x.id === id);
  if (!m) throw Object.assign(new Error('Niet gevonden'), { status: 404 });
  m.alt = cleanText(alt, 200);
  await putJSON('data/media.json', all);
  return m;
}

export async function removeMedia(id) {
  const all = (await getJSON('data/media.json')) || [];
  const m = all.find((x) => x.id === id);
  if (!m) throw Object.assign(new Error('Niet gevonden'), { status: 404 });
  await del(`media/${m.file}`);
  await putJSON('data/media.json', all.filter((x) => x.id !== id));
}
