import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { getJSON, putJSON } from './storage.js';
import { parseCookies, rid, sha, now } from './util.js';

const scryptAsync = promisify(scrypt);
const COOKIE = 'fi_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.CMS_SECRET || '';
  if (s.length >= 24) return s;
  if (process.env.FINEST_DEV_DIR) return 'dev-only-secret-dev-only-secret';
  throw Object.assign(new Error('CMS_SECRET ontbreekt of is te kort (min. 24 tekens).'), { status: 503 });
}

export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false;
  const key = await scryptAsync(pw, Buffer.from(saltHex, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(keyHex, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function checkPasswordStrength(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Gebruik minimaal 10 tekens.';
  if (pw.length > 200) return 'Wachtwoord is te lang.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Gebruik letters én minimaal één cijfer.';
  return '';
}

export async function getUsers() {
  return (await getJSON('data/users.json')) || [];
}
export const saveUsers = (users) => putJSON('data/users.json', users);

export const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt, lastLogin: u.lastLogin || null });

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

export function sessionCookie(user, req) {
  const token = sign({ uid: user.id, pv: sha(user.hash).slice(0, 10), exp: Date.now() + MAX_AGE * 1000 });
  return cookieString(token, MAX_AGE, req);
}
export const clearCookie = (req) => cookieString('', 0, req);

function cookieString(value, maxAge, req) {
  const secure = !(req.headers.host || '').startsWith('127.0.0.1') && !(req.headers.host || '').startsWith('localhost');
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export async function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  const p = verify(token);
  if (!p) return null;
  const user = (await getUsers()).find((u) => u.id === p.uid);
  if (!user || sha(user.hash).slice(0, 10) !== p.pv) return null;
  return user;
}

/** State-changing requests must come from our own pages. */
export function sameOrigin(req) {
  if (req.headers['x-cms'] !== '1') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/** Max 10 failed attempts per 15 minutes per (ip, email). */
export async function loginThrottle(req, email) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const key = `data/ratelimit/${sha(ip + '|' + String(email).toLowerCase()).slice(0, 24)}.json`;
  const rec = (await getJSON(key)) || { fails: [] };
  const cutoff = Date.now() - 15 * 60 * 1000;
  rec.fails = rec.fails.filter((t) => t > cutoff);
  return {
    blocked: rec.fails.length >= 10,
    fail: async () => {
      rec.fails.push(Date.now());
      await putJSON(key, rec);
    },
    reset: async () => {
      if (rec.fails.length) await putJSON(key, { fails: [] });
    },
  };
}

export function newUser({ email, name, role, hash }) {
  return { id: rid(6), email: String(email).trim().toLowerCase(), name, role, hash, createdAt: now() };
}

export function setupTokenOk(given) {
  const expected = process.env.CMS_SETUP_TOKEN || '';
  if (expected.length < 16) return false;
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
