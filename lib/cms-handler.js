// JSON API for the admin and the public contact form.
import { json, readJson, rid, sha, now, slugify } from './util.js';
import { storageMode, getJSON, putJSON, del, list } from './storage.js';
import {
  hashPassword, verifyPassword, checkPasswordStrength, getUsers, saveUsers, publicUser, sessionCookie, clearCookie,
  userFromRequest, sameOrigin, loginThrottle, newUser, setupTokenOk,
} from './auth.js';
import {
  COLLECTIONS, getSettings, saveSettings, getDoc, listIndex, saveDoc, deleteDoc, listRevisions, getRevision, normalizeDoc, ensureBootstrapped, Conflict, clearCache,
} from './content.js';
import { cleanText, cleanMultiline } from './sanitize.js';
import { listMedia, addMedia, updateMedia, removeMedia, MAX_UPLOAD } from './media.js';
import { loadCtx } from './site-handler.js';
import { renderPage, renderArticle } from './render.js';

const fail = (status, error) => Object.assign(new Error(error), { status });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function route(req) {
  const url = new URL(req.url, 'http://local');
  let r = url.searchParams.get('route');
  if (r === null) r = url.pathname.replace(/^\/api\/?(cms\/?)?/, '');
  return { r: r.replace(/^\/+|\/+$/g, ''), q: url.searchParams };
}
const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

async function requireUser(req, role) {
  const u = await userFromRequest(req);
  if (!u) throw fail(401, 'Niet ingelogd.');
  if (role === 'admin' && u.role !== 'admin') throw fail(403, 'Alleen beheerders mogen dit.');
  return u;
}

// ---------- public: contact form ----------
async function contact(req, res) {
  if (storageMode() === 'none') throw fail(503, 'Het formulier is tijdelijk niet beschikbaar. Mail ons gerust direct.');
  const b = await readJson(req, 20_000);
  const spam = String(b.website || '').trim() !== '' || Number(b.elapsed) < 2000;
  const name = cleanText(b.name, 100);
  const email = cleanText(b.email, 150);
  const message = cleanMultiline(b.message, 3000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5 || b.consent !== true) throw fail(400, 'Controleer de ingevulde velden.');
  if (spam) return json(res, 200, { ok: true }); // look successful, store nothing

  const ipHash = sha(clientIp(req)).slice(0, 20);
  const rlKey = `data/ratelimit/contact-${ipHash}.json`;
  const rl = (await getJSON(rlKey)) || { t: [] };
  rl.t = rl.t.filter((t) => t > Date.now() - 10 * 60 * 1000);
  if (rl.t.length >= 5) throw fail(429, 'Je hebt net al meerdere berichten verstuurd. Probeer het over een paar minuten opnieuw.');
  rl.t.push(Date.now());
  await putJSON(rlKey, rl);

  const sub = { id: rid(6), at: now(), name, email, company: cleanText(b.company, 120), message, ipHash, read: false };
  await putJSON(`data/submissions/${Date.now()}-${sub.id}.json`, sub);
  await notify(sub).catch((e) => console.error('mail failed', e.message));
  return json(res, 200, { ok: true });
}

async function notify(sub) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const s = await getSettings();
  const to = s.contact?.notifyEmail;
  if (!to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || `${s.siteName} <onboarding@resend.dev>`,
      to: [to],
      reply_to: sub.email,
      subject: `Nieuw bericht van ${sub.name}`,
      text: `${sub.name} <${sub.email}>${sub.company ? '\n' + sub.company : ''}\n\n${sub.message}`,
    }),
  });
}

// ---------- auth ----------
async function setupStatus(req, res) {
  const users = await getUsers();
  json(res, 200, { needsSetup: users.length === 0, storage: storageMode(), tokenConfigured: (process.env.CMS_SETUP_TOKEN || '').length >= 16 });
}

async function setup(req, res) {
  const b = await readJson(req, 10_000);
  if ((await getUsers()).length) throw fail(403, 'Er is al een beheerder aangemaakt.');
  if (!setupTokenOk(b.token)) {
    await sleep(500);
    throw fail(403, 'Ongeldige installatiecode.');
  }
  const email = cleanText(b.email, 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, 'Vul een geldig e-mailadres in.');
  const weak = checkPasswordStrength(b.password);
  if (weak) throw fail(400, weak);
  const user = newUser({ email, name: cleanText(b.name, 80) || 'Beheerder', role: 'admin', hash: await hashPassword(b.password) });
  await saveUsers([user]);
  await ensureBootstrapped();
  json(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(user, req) });
}

async function login(req, res) {
  const b = await readJson(req, 5_000);
  const email = cleanText(b.email, 150).toLowerCase();
  const throttle = await loginThrottle(req, email);
  if (throttle.blocked) throw fail(429, 'Te veel pogingen. Probeer het over een kwartier opnieuw.');
  const users = await getUsers();
  const user = users.find((u) => u.email === email);
  const ok = user && (await verifyPassword(String(b.password || ''), user.hash));
  if (!ok) {
    await throttle.fail();
    await sleep(400);
    throw fail(401, 'E-mailadres of wachtwoord klopt niet.');
  }
  await throttle.reset();
  user.lastLogin = now();
  await saveUsers(users);
  json(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(user, req) });
}

// ---------- main router ----------
export async function handleCms(req, res) {
  try {
    const { r, q } = route(req);
    const m = req.method;

    // public
    if (r === 'contact' && m === 'POST') return await contact(req, res);
    if (r === 'setup-status' && m === 'GET') return await setupStatus(req, res);
    if (r === 'setup' && m === 'POST') {
      if (!sameOrigin(req)) throw fail(403, 'Ongeldig verzoek.');
      return await setup(req, res);
    }
    if (r === 'login' && m === 'POST') {
      if (!sameOrigin(req)) throw fail(403, 'Ongeldig verzoek.');
      return await login(req, res);
    }
    if (r === 'logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie(req) });
    if (r === 'me' && m === 'GET') {
      const u = await userFromRequest(req);
      return json(res, 200, { user: u ? publicUser(u) : null, storage: storageMode() });
    }

    // everything below needs a session
    if (m !== 'GET' && !sameOrigin(req)) throw fail(403, 'Ongeldig verzoek.');
    const user = await requireUser(req);

    if (r === 'docs' && m === 'GET') {
      const col = q.get('col');
      if (!COLLECTIONS.includes(col)) throw fail(400, 'Onbekend type');
      return json(res, 200, { items: (await listIndex(col)).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) });
    }
    if (r === 'doc' && m === 'GET') {
      const doc = await getDoc(q.get('col'), q.get('slug'));
      if (!doc) throw fail(404, 'Niet gevonden');
      return json(res, 200, { doc });
    }
    if (r === 'doc' && m === 'POST') {
      const b = await readJson(req, 3 * 1024 * 1024);
      if (!COLLECTIONS.includes(b.col)) throw fail(400, 'Onbekend type');
      try {
        const doc = await saveDoc(b.col, b.doc || {}, user);
        return json(res, 200, { doc });
      } catch (e) {
        if (e instanceof Conflict) return json(res, 409, { error: e.message, current: e.current });
        throw e;
      }
    }
    if (r === 'doc' && m === 'DELETE') {
      await deleteDoc(q.get('col'), q.get('slug'));
      return json(res, 200, { ok: true });
    }
    if (r === 'revisions' && m === 'GET') return json(res, 200, { items: await listRevisions(q.get('col'), q.get('slug')) });
    if (r === 'revision' && m === 'GET') {
      const rev = await getRevision(q.get('col'), q.get('slug'), q.get('id'));
      if (!rev) throw fail(404, 'Niet gevonden');
      return json(res, 200, { doc: rev });
    }
    if (r === 'preview' && m === 'POST') {
      const b = await readJson(req, 3 * 1024 * 1024);
      if (!COLLECTIONS.includes(b.col)) throw fail(400, 'Onbekend type');
      const doc = normalizeDoc(b.col, { ...(b.doc || {}), slug: b.doc?.slug || 'voorbeeld' }, null);
      doc.slug = b.doc?.slug || 'voorbeeld';
      doc.updatedAt = now();
      const path = b.col === 'pages' ? (doc.slug === 'home' ? '/' : `/${doc.slug}`) : `/${b.col === 'posts' ? 'nieuws' : 'klantverhalen'}/${doc.slug}`;
      const ctx = await loadCtx(path, { preview: true });
      const html = b.col === 'pages' ? renderPage(doc, ctx) : renderArticle(doc, ctx, b.col);
      return json(res, 200, { html });
    }

    // media
    if (r === 'media' && m === 'GET') return json(res, 200, { items: await listMedia() });
    if (r === 'media' && m === 'POST') {
      const b = await readJson(req, Math.ceil(MAX_UPLOAD * 1.4));
      const buffer = Buffer.from(String(b.data || ''), 'base64');
      const item = await addMedia({ name: b.name, contentType: b.contentType, buffer, alt: b.alt, width: b.width, height: b.height }, user);
      return json(res, 200, { item });
    }
    if (r === 'media' && m === 'PATCH') {
      const b = await readJson(req, 5_000);
      return json(res, 200, { item: await updateMedia(String(q.get('id')), b) });
    }
    if (r === 'media' && m === 'DELETE') {
      await removeMedia(String(q.get('id')));
      return json(res, 200, { ok: true });
    }

    // inbox
    if (r === 'submissions' && m === 'GET') {
      const keys = (await list('data/submissions/')).sort((a, b) => b.key.localeCompare(a.key)).slice(0, 200);
      const items = [];
      for (const k of keys) {
        const s = await getJSON(k.key);
        if (s) items.push({ ...s, key: k.key.split('/').pop().replace('.json', '') });
      }
      return json(res, 200, { items });
    }
    if (r === 'submission' && (m === 'PATCH' || m === 'DELETE')) {
      const id = String(q.get('id') || '');
      if (!/^\d+-[a-f0-9]+$/.test(id)) throw fail(400, 'Ongeldig id');
      const key = `data/submissions/${id}.json`;
      if (m === 'DELETE') {
        await del(key);
        return json(res, 200, { ok: true });
      }
      const s = await getJSON(key);
      if (!s) throw fail(404, 'Niet gevonden');
      s.read = (await readJson(req, 1000)).read !== false;
      await putJSON(key, s);
      return json(res, 200, { item: s });
    }

    // own password
    if (r === 'password' && m === 'POST') {
      const b = await readJson(req, 5_000);
      const users = await getUsers();
      const me = users.find((u) => u.id === user.id);
      if (!(await verifyPassword(String(b.current || ''), me.hash))) throw fail(400, 'Je huidige wachtwoord klopt niet.');
      const weak = checkPasswordStrength(b.next);
      if (weak) throw fail(400, weak);
      me.hash = await hashPassword(b.next);
      await saveUsers(users);
      return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(me, req) });
    }

    // admin only
    if (r === 'settings' && m === 'GET') return json(res, 200, { settings: await getSettings() });
    if (r === 'settings' && m === 'POST') {
      await requireUser(req, 'admin');
      return json(res, 200, { settings: await saveSettings(await readJson(req, 100_000)) });
    }
    if (r === 'users' && m === 'GET') {
      await requireUser(req, 'admin');
      return json(res, 200, { items: (await getUsers()).map(publicUser) });
    }
    if (r === 'users' && m === 'POST') {
      await requireUser(req, 'admin');
      const b = await readJson(req, 5_000);
      const email = cleanText(b.email, 150).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, 'Vul een geldig e-mailadres in.');
      const weak = checkPasswordStrength(b.password);
      if (weak) throw fail(400, weak);
      const users = await getUsers();
      if (users.some((u) => u.email === email)) throw fail(409, 'Dit e-mailadres heeft al een account.');
      const nu = newUser({ email, name: cleanText(b.name, 80) || email, role: b.role === 'admin' ? 'admin' : 'editor', hash: await hashPassword(b.password) });
      users.push(nu);
      await saveUsers(users);
      return json(res, 200, { user: publicUser(nu) });
    }
    if (r === 'users' && (m === 'PATCH' || m === 'DELETE')) {
      const admin = await requireUser(req, 'admin');
      const id = String(q.get('id'));
      let users = await getUsers();
      const target = users.find((u) => u.id === id);
      if (!target) throw fail(404, 'Niet gevonden');
      const admins = users.filter((u) => u.role === 'admin');
      if (m === 'DELETE') {
        if (target.id === admin.id) throw fail(400, 'Je kunt jezelf niet verwijderen.');
        users = users.filter((u) => u.id !== id);
      } else {
        const b = await readJson(req, 5_000);
        if (b.name) target.name = cleanText(b.name, 80);
        if (b.role) {
          const role = b.role === 'admin' ? 'admin' : 'editor';
          if (target.role === 'admin' && role !== 'admin' && admins.length < 2) throw fail(400, 'Er moet minimaal één beheerder blijven.');
          target.role = role;
        }
        if (b.password) {
          const weak = checkPasswordStrength(b.password);
          if (weak) throw fail(400, weak);
          target.hash = await hashPassword(b.password);
        }
      }
      await saveUsers(users);
      return json(res, 200, { ok: true });
    }

    if (r === 'clear-cache' && m === 'POST') {
      clearCache();
      return json(res, 200, { ok: true });
    }

    throw fail(404, 'Onbekende actie');
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('cms error', e);
    json(res, status, { error: status >= 500 && !e.status ? 'Er ging iets mis aan onze kant.' : e.message });
  }
}
