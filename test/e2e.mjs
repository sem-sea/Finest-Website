// End-to-end test: starts the dev server on a clean data folder and drives the
// admin like a person would (Playwright) plus raw API/security checks.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3111;
const B = `http://127.0.0.1:${PORT}`;
const dataDir = mkdtempSync(path.join(tmpdir(), 'fi-cms-'));
const TOKEN = 'test-setup-token-123456';
const PW = 'Sterk-Wachtwoord-42';

const results = [];
const ok = (name, cond, detail = '') => { results.push([cond, name, detail]); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → ' + detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('node', ['dev/server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT), FINEST_DEV_DIR: dataDir, CMS_SETUP_TOKEN: TOKEN, FINEST_NO_CACHE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
for (let i = 0; i < 40; i++) { try { await fetch(B + '/robots.txt'); break; } catch { await sleep(150); } }

const saveClick = async (pg, label = 'Opslaan') => {
  await pg.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
  await pg.click(`text=${label} >> nth=0`);
  await pg.waitForSelector('.toast:has-text("Opgeslagen")');
};
const get = async (p, opts) => { const r = await fetch(B + p, opts); return { status: r.status, text: await r.text(), headers: r.headers }; };
const apiCall = async (method, route, body, cookie, extra = {}) => {
  const r = await fetch(`${B}/api/${route}`, { method, headers: { 'Content-Type': 'application/json', 'X-CMS': '1', ...(cookie ? { Cookie: cookie } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
  let data = {}; try { data = await r.json(); } catch {}
  return { status: r.status, data, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
};

const browser = await chromium.launch();
let fatal = null;
let jsErrors = [];
let lastPage = null;
const dialogs = [];
try {
  // ---------- public site ----------
  for (const p of ['/', '/diensten', '/over-ons', '/contact', '/nieuws', '/klantverhalen', '/privacyverklaring', '/algemene-voorwaarden', '/nieuws/contentplanning-verschil-voor-opticiens', '/klantverhalen/oogzorg-vertellen-zonder-te-verkopen']) {
    const r = await get(p);
    ok(`public ${p} = 200`, r.status === 200 && r.text.includes('<main>'), String(r.status));
  }
  ok('404 for unknown page', (await get('/bestaat-niet')).status === 404);
  ok('sitemap lists articles', (await get('/sitemap.xml')).text.includes('/nieuws/contentplanning-verschil-voor-opticiens'));
  ok('feed is RSS', (await get('/feed.xml')).text.includes('<rss'));
  ok('robots blocks /admin', (await get('/robots.txt')).text.includes('Disallow: /admin'));
  const home = (await get('/')).text;
  ok('home has 4 explainer canvases', (home.match(/class="explainer-canvas"/g) || []).length === 4);
  ok('home has FAQ rows server-rendered', (home.match(/class="faq-row"/g) || []).length === 16);
  ok('home has JSON-LD', home.includes('application/ld+json'));
  ok('security headers on pages', (await get('/')).headers.get('x-content-type-options') === 'nosniff');

  // ---------- security / auth (API) ----------
  ok('admin API requires login', (await apiCall('GET', 'docs?col=pages')).status === 401);
  ok('CSRF: POST without X-CMS header refused', (await fetch(`${B}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status === 403);
  ok('CSRF: foreign Origin refused', (await apiCall('POST', 'login', { email: 'a@b.nl', password: 'x' }, null, { Origin: 'https://evil.example' })).status === 403);
  const st = await apiCall('GET', 'setup-status');
  ok('setup is open on a fresh store', st.data.needsSetup === true);
  ok('setup rejects wrong token', (await apiCall('POST', 'setup', { token: 'wrong-wrong-wrong-wrong', email: 'a@b.nl', name: 'A', password: PW })).status === 403);
  ok('setup rejects weak password', (await apiCall('POST', 'setup', { token: TOKEN, email: 'a@b.nl', name: 'A', password: 'kort1' })).status === 400);

  // ---------- admin UI ----------
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const page = await ctx.newPage();
  lastPage = page;
  page.on('pageerror', (e) => jsErrors.push(e.message));
  page.on('dialog', (d) => { dialogs.push(d.type() + ':' + d.message().slice(0, 40)); d.accept(); });
  await page.goto(B + '/admin');
  await page.waitForSelector('text=Eerste keer instellen');
  ok('admin shows first-run setup', true);
  await page.fill('input[type=password] >> nth=0', TOKEN);
  const inputs = page.locator('form input');
  await inputs.nth(1).fill('Test Beheerder');
  await inputs.nth(2).fill('beheer@example.com');
  await inputs.nth(3).fill(PW);
  await page.click('text=Account aanmaken');
  await page.waitForSelector('text=Welkom, Test Beheerder');
  ok('setup creates admin and logs in', true);
  ok('setup is closed afterwards', (await apiCall('POST', 'setup', { token: TOKEN, email: 'x@y.nl', name: 'X', password: PW })).status === 403);
  const cookies = await ctx.cookies();
  const sess = cookies.find((c) => c.name === 'fi_session');
  ok('session cookie is HttpOnly + SameSite=Strict', sess?.httpOnly === true && sess?.sameSite === 'Strict');

  // --- edit existing page text ---
  await page.goto(B + '/admin#/pages/diensten');
  await page.waitForSelector('text=Tekstblok');
  await page.click('.block .bh >> nth=0');
  const rte = page.locator('.rte >> nth=0');
  await rte.click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type(' ZINNETJE-UIT-TEST');
  await saveClick(page);
  ok('edit page → saved', true);
  ok('edit shows on public page', (await get('/diensten')).text.includes('ZINNETJE-UIT-TEST'));

  // --- preview ---
  await page.click('text=Voorbeeld');
  await page.waitForSelector('iframe[title=Voorbeeld]');
  const fr = page.frameLocator('iframe[title=Voorbeeld]');
  await fr.locator('main').waitFor({ timeout: 8000 });
  ok('preview renders unsaved page in iframe', (await fr.locator('main').count()) === 1);
  await page.click('text=Sluiten');

  // --- revisions ---
  await page.keyboard.press('Control+End');
  await page.locator('.rte >> nth=0').click();
  await page.keyboard.type(' TWEEDE-WIJZIGING');
  await saveClick(page);
  await page.click('text=Eerdere versies');
  await page.waitForSelector('text=Terugzetten');
  ok('revisions are kept', (await page.locator('button:has-text("Terugzetten")').count()) >= 1);
  await page.click('button:has-text("Terugzetten") >> nth=0');
  await page.waitForSelector('.toast:has-text("teruggezet")');
  await saveClick(page);
  const t = (await get('/diensten')).text;
  ok('restore brings back previous text', t.includes('ZINNETJE-UIT-TEST') && !t.includes('TWEEDE-WIJZIGING'));

  // --- new page, publish lifecycle ---
  await page.goto(B + '/admin#/pages/new');
  await page.waitForSelector('text=Nieuw pagina');
  await page.fill('.card input[type=text] >> nth=0', 'Over onze aanpak');
  ok('slug is generated from title', (await page.locator('aside input[type=text]').first().inputValue()) === 'over-onze-aanpak');
  await page.click('.block .bh >> nth=0');
  await page.locator('.rte >> nth=0').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Dit is een nieuwe pagina vol tekst.');
  await page.selectOption('aside select', 'published');
  await saveClick(page);
  let r = await get('/over-onze-aanpak');
  ok('new published page is live', r.status === 200 && r.text.includes('nieuwe pagina vol tekst'));
  await page.selectOption('aside select', 'draft');
  await saveClick(page);
  ok('draft page is not public', (await get('/over-onze-aanpak')).status === 404);
  await page.selectOption('aside select', 'scheduled');
  await page.fill('input[type=datetime-local] >> nth=0', '2031-01-01T10:00');
  await saveClick(page);
  ok('future-scheduled page is not public yet', (await get('/over-onze-aanpak')).status === 404);
  await page.fill('input[type=datetime-local] >> nth=0', '2020-01-01T10:00');
  await saveClick(page);
  ok('past-scheduled page is public', (await get('/over-onze-aanpak')).status === 200);

  // --- media upload via UI ---
  await page.goto(B + '/admin#/media');
  await page.waitForSelector('text=Sleep afbeeldingen');
  await page.setInputFiles('input[type=file]', path.join(root, 'assets/img/photo-1.jpg'));
  await page.waitForSelector('.mitem');
  ok('media upload appears in library', (await page.locator('.mitem').count()) >= 1);
  await page.click('.mitem >> nth=0');
  await page.fill('.modal input[type=text] >> nth=1', 'Testfoto alt');
  await page.click('.modal >> text=Opslaan');
  await page.waitForSelector('.toast:has-text("Opgeslagen")');
  const media = (await apiCall('GET', 'media', null, `fi_session=${sess.value}`)).data.items;
  ok('media has alt text stored', media[0]?.alt === 'Testfoto alt' && media[0].url.startsWith('/media/'));
  const img = await fetch(B + media[0].url);
  ok('uploaded media is served with long cache', img.status === 200 && (img.headers.get('cache-control') || '').includes('immutable') && img.headers.get('content-type') === 'image/jpeg');

  // --- news article with featured image ---
  await page.goto(B + '/admin#/posts/new');
  await page.waitForSelector('text=Nieuw nieuwsbericht');
  await page.fill('.card input[type=text] >> nth=0', 'Testartikel over zichtbaarheid');
  await page.locator('.rte').click();
  await page.keyboard.type('Hallo wereld, dit is de tekst.');
  await page.fill('aside input[type=text] >> nth=1', 'Testcategorie');
  await page.click('text=Afbeelding kiezen');
  await page.waitForSelector('.modal .mitem');
  await page.click('.modal .mitem >> nth=0');
  await page.selectOption('aside select', 'published');
  await saveClick(page);
  const art = await get('/nieuws/testartikel-over-zichtbaarheid');
  ok('new article is live with featured image', art.status === 200 && art.text.includes('Hallo wereld') && art.text.includes('/media/'));
  ok('article in news list, sitemap and feed', (await get('/nieuws')).text.includes('Testartikel over zichtbaarheid') && (await get('/sitemap.xml')).text.includes('testartikel-over-zichtbaarheid') && (await get('/feed.xml')).text.includes('Testartikel over zichtbaarheid'));
  ok('article has BlogPosting JSON-LD + canonical', art.text.includes('"BlogPosting"') && art.text.includes('rel="canonical"'));

  // --- XSS / sanitising ---
  const cookie = `fi_session=${sess.value}`;
  const evil = await apiCall('POST', 'doc', { col: 'posts', doc: { title: 'Evil', slug: 'evil', status: 'published', excerpt: '<img src=x onerror=alert(1)>', category: '<b>c</b>', author: 'a', html: '<p onclick="x()">hoi</p><script>alert(1)</script><a href="javascript:alert(1)">klik</a><iframe src="https://evil.example"></iframe><img src="javascript:alert(1)"><a href="https://ok.nl" target="_blank">ok</a>', image: { src: 'javascript:alert(1)', alt: '"><script>' }, seo: { title: '"><script>alert(1)</script>' } } }, cookie);
  ok('evil content accepted but neutralised', evil.status === 200);
  const ev = (await get('/nieuws/evil')).text;
  ok('no script/iframe/onclick/javascript: in rendered article', !/<script>alert|<iframe|onclick|onerror|javascript:/i.test(ev), ev.match(/.{40}(onerror|onclick|javascript:|<iframe).{20}/i)?.[0]);
  ok('external links get rel=noopener', ev.includes('rel="noopener noreferrer"'));
  ok('slugs with path tricks rejected', (await apiCall('POST', 'doc', { col: 'posts', doc: { title: 'x', slug: '../../data/users' } }, cookie)).status === 400);
  ok('reserved page slug rejected', (await apiCall('POST', 'doc', { col: 'pages', doc: { title: 'x', slug: 'admin' } }, cookie)).status === 400);
  ok('special page cannot be deleted', (await apiCall('DELETE', 'doc?col=pages&slug=home', null, cookie)).status === 400);
  ok('media with fake image rejected', (await apiCall('POST', 'media', { name: 'a.png', contentType: 'image/png', data: Buffer.from('<script>alert(1)</script>').toString('base64') }, cookie)).status === 400);
  ok('svg upload rejected', (await apiCall('POST', 'media', { name: 'a.svg', contentType: 'image/svg+xml', data: Buffer.from('<svg/>').toString('base64') }, cookie)).status === 400);
  await apiCall('DELETE', 'doc?col=posts&slug=evil', null, cookie);

  // --- conflict detection ---
  const doc = (await apiCall('GET', 'doc?col=pages&slug=contact', null, cookie)).data.doc;
  const a = await apiCall('POST', 'doc', { col: 'pages', doc: { ...doc, originalSlug: 'contact', baseUpdatedAt: doc.updatedAt, title: 'Contact A' } }, cookie);
  const b2 = await apiCall('POST', 'doc', { col: 'pages', doc: { ...doc, originalSlug: 'contact', baseUpdatedAt: doc.updatedAt, title: 'Contact B' } }, cookie);
  ok('first save ok, stale second save → 409', a.status === 200 && b2.status === 409, `${a.status}/${b2.status}`);
  await apiCall('POST', 'doc', { col: 'pages', doc: { ...a.data.doc, originalSlug: 'contact', baseUpdatedAt: a.data.doc.updatedAt, title: 'Contact' } }, cookie);

  // --- contact form (public UI) ---
  const visitor = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await visitor.goto(B + '/contact');
  await visitor.waitForSelector('#contact-form');
  await visitor.click('#contact-form button[type=submit]');
  await visitor.waitForSelector('#contact-form[data-status=invalid]');
  ok('contact form validates empty submit', (await visitor.locator('.wpcf7-not-valid-tip').count()) >= 3);
  await visitor.fill('#tfi-name', 'Petra Test');
  await visitor.fill('#tfi-email', 'petra@example.com');
  await visitor.fill('#tfi-company', 'Optiek Test');
  await visitor.fill('#tfi-message', 'Ik wil graag meer weten over jullie aanpak.');
  await visitor.check('#tfi-consent');
  await sleep(2200);
  await visitor.click('#contact-form button[type=submit]');
  await visitor.waitForSelector('#contact-form[data-status=sent]', { timeout: 8000 });
  ok('contact form sends and shows thanks', true);
  const subs = (await apiCall('GET', 'submissions', null, cookie)).data.items;
  ok('message arrives in inbox (unread)', subs.length === 1 && subs[0].name === 'Petra Test' && subs[0].read === false && !('ip' in subs[0]));
  const spam = await apiCall('POST', 'contact', { name: 'Bot', email: 'bot@example.com', message: 'koop nu spam spam', consent: true, website: 'http://spam', elapsed: 9000 });
  ok('honeypot: looks fine to bots, stores nothing', spam.status === 200 && (await apiCall('GET', 'submissions', null, cookie)).data.items.length === 1);
  const fast = await apiCall('POST', 'contact', { name: 'Bot', email: 'bot@example.com', message: 'te snel verstuurd', consent: true, elapsed: 100 });
  ok('too-fast submit treated as spam', fast.status === 200 && (await apiCall('GET', 'submissions', null, cookie)).data.items.length === 1);
  ok('contact rejects bad email', (await apiCall('POST', 'contact', { name: 'A', email: 'geen-email', message: 'hallo daar', consent: true, elapsed: 9000 })).status === 400);
  ok('contact requires consent', (await apiCall('POST', 'contact', { name: 'A', email: 'a@b.nl', message: 'hallo daar', consent: false, elapsed: 9000 })).status === 400);
  let limited = 0;
  for (let i = 0; i < 7; i++) { const x = await apiCall('POST', 'contact', { name: 'Rate', email: 'rate@example.com', message: 'bericht nummer ' + i, consent: true, elapsed: 9000 }); if (x.status === 429) limited++; }
  ok('contact is rate limited (429 after 5/10min)', limited >= 1, `limited=${limited}`);
  await page.goto(B + '/admin#/inbox');
  await page.waitForSelector('text=Petra Test');
  await page.click('text=Petra Test >> nth=0');
  await page.waitForSelector('.mail');
  ok('inbox shows message text', (await page.textContent('.mail')).includes('jullie aanpak'));
  await page.click('text=Sluiten');

  // --- settings affect the public site ---
  await page.goto(B + '/admin#/settings');
  await page.waitForSelector('text=Beweging en scrollen');
  await page.fill('input[placeholder="31612345678"]', '31699988877');
  const motionBoxes = page.locator('.card:has-text("Beweging en scrollen") input[type=checkbox]');
  await motionBoxes.nth(1).uncheck(); // smooth scroll off
  await motionBoxes.nth(4).uncheck(); // progress bar off
  await page.click('.topbar >> text=Opslaan');
  await page.waitForSelector('text=Opgeslagen. Wijzigingen');
  const pub = (await get('/')).text;
  ok('settings: motion config reaches the page', pub.includes('"smoothScroll":false') && pub.includes('"progressBar":false') && pub.includes('"reveals":true'));
  ok('settings: WhatsApp number reaches the contact bar', pub.includes('wa.me/31699988877'));

  // --- users and roles ---
  await page.goto(B + '/admin#/users');
  await page.waitForSelector('text=Gebruiker toevoegen');
  const uin = page.locator('.card:has-text("Gebruiker toevoegen") input');
  await uin.nth(0).fill('Rita Redacteur'); await uin.nth(1).fill('rita@example.com'); await uin.nth(2).fill('Redacteur-Pw-77');
  await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();
  await page.waitForSelector('text=Gebruiker toegevoegd');
  const ed = await apiCall('POST', 'login', { email: 'rita@example.com', password: 'Redacteur-Pw-77' });
  ok('editor can log in', ed.status === 200 && ed.data.user.role === 'editor');
  const ec = ed.cookie;
  ok('editor can read content', (await apiCall('GET', 'docs?col=pages', null, ec)).status === 200);
  ok('editor cannot change settings', (await apiCall('POST', 'settings', { siteName: 'Hack' }, ec)).status === 403);
  ok('editor cannot list users', (await apiCall('GET', 'users', null, ec)).status === 403);
  ok('cannot demote the last admin', (await apiCall('PATCH', `users?id=${(await apiCall('GET', 'me', null, cookie)).data.user.id}`, { role: 'editor' }, cookie)).status === 400);
  const bad = await apiCall('POST', 'login', { email: 'rita@example.com', password: 'fout-fout-fout1' });
  ok('wrong password refused', bad.status === 401);
  let blocked = false;
  for (let i = 0; i < 12; i++) { const x = await apiCall('POST', 'login', { email: 'brute@example.com', password: 'nope-nope-1234' }); if (x.status === 429) blocked = true; }
  ok('login is throttled after repeated failures', blocked);
  ok('tampered session cookie refused', (await apiCall('GET', 'docs?col=pages', null, 'fi_session=' + sess.value.slice(0, -3) + 'abc')).status === 401);

  ok('no JavaScript errors in the admin', jsErrors.length === 0, jsErrors.join(' | '));
  const logout = await apiCall('POST', 'logout', {}, cookie);
  ok('logout clears the cookie', logout.cookie.includes('Max-Age=0') || logout.status === 200);
} catch (e) {
  fatal = e;
  console.error('FATAL', e.message.split('\n')[0], '| JS errors:', jsErrors.join(' | '), '| dialogs:', dialogs.join(' ; '));
  try { console.error('URL:', lastPage.url(), '\nMAIN TEXT:', (await lastPage.textContent('#app')).replace(/\s+/g, ' ').slice(0, 400)); } catch {}
} finally {
  await browser.close();
  server.kill();
  rmSync(dataDir, { recursive: true, force: true });
}
const failed = results.filter((r) => !r[0]).length;
console.log(`\n${results.length - failed}/${results.length} checks passed${fatal ? ' — stopped early: ' + fatal.message : ''}`);
if (/Error|error/.test(serverLog.replace(/rate|limit/gi, ''))) console.log('SERVER LOG:\n' + serverLog.slice(0, 1500));
process.exit(failed || fatal ? 1 : 0);
