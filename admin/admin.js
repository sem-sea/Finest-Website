import { h, api, toast, modal, askText, field, textInput, areaInput, selectInput, checkInput, imageField, richText, dirty, fmtDate, pill, uploadFile } from './ui.js';
import { blockEditor, BLOCKS } from './blocks.js';

const app = document.getElementById('app');
const state = { user: null, storage: '', unread: 0 };
const COL = { pages: { label: "Pagina's", single: 'Pagina', pub: (s) => (s === 'home' ? '/' : `/${s}`) }, posts: { label: 'Nieuws', single: 'Nieuwsbericht', pub: (s) => `/nieuws/${s}` }, stories: { label: 'Klantverhalen', single: 'Klantverhaal', pub: (s) => `/klantverhalen/${s}` } };
const SPECIAL = new Set(['home', 'nieuws', 'klantverhalen']);

const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const errBox = (e) => h('div', { class: 'notice err', role: 'alert' }, e.message || String(e));

// ---------- boot / auth ----------
async function boot() {
  try {
    const me = await api.get('me');
    state.storage = me.storage;
    if (me.user) { state.user = me.user; return shell(); }
    const st = await api.get('setup-status');
    return st.needsSetup ? setupScreen(st) : loginScreen();
  } catch (e) {
    app.replaceChildren(h('div', { class: 'login' }, errBox(e)));
  }
}

function authCard(title, body) {
  return h('div', { class: 'login' }, h('p', { class: 'brand', style: { fontSize: '20px', fontWeight: 300 } }, 'the finest impact'), h('div', { class: 'card' }, h('h1', {}, title), body));
}

function loginScreen(msg) {
  const o = { email: '', password: '' };
  const out = h('div');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    try { state.user = (await api.post('login', o)).user; location.hash = '#/dashboard'; shell(); }
    catch (err) { out.replaceChildren(errBox(err)); }
  } },
  out, msg ? h('div', { class: 'notice ok' }, msg) : null,
  field('E-mailadres', textInput(o, 'email', { type: 'email' })), field('Wachtwoord', textInput(o, 'password', { type: 'password' })),
  h('button', { class: 'btn', type: 'submit' }, 'Inloggen'));
  app.replaceChildren(authCard('Inloggen', form));
}

function setupScreen(st) {
  const o = { token: '', name: '', email: '', password: '' };
  const out = h('div');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    try { state.user = (await api.post('setup', o)).user; location.hash = '#/dashboard'; shell(); }
    catch (err) { out.replaceChildren(errBox(err)); }
  } },
  h('p', { class: 'muted' }, 'Maak het eerste beheerdersaccount aan. Je hebt hiervoor de installatiecode nodig die bij het opzetten van de site is ingesteld.'),
  !st.tokenConfigured ? h('div', { class: 'notice warn' }, 'Er is nog geen installatiecode (CMS_SETUP_TOKEN) ingesteld op de server.') : null,
  st.storage === 'none' ? h('div', { class: 'notice warn' }, 'Er is nog geen opslag gekoppeld (Vercel Blob). Je kunt pas opslaan als dat is gedaan.') : null,
  out, field('Installatiecode', textInput(o, 'token', { type: 'password' })), field('Naam', textInput(o, 'name')),
  field('E-mailadres', textInput(o, 'email', { type: 'email' })), field('Wachtwoord', textInput(o, 'password', { type: 'password' }), 'Minimaal 10 tekens, met letters en cijfers.'),
  h('button', { class: 'btn', type: 'submit' }, 'Account aanmaken'));
  app.replaceChildren(authCard('Eerste keer instellen', form));
}

// ---------- shell + router ----------
const isAdmin = () => state.user?.role === 'admin';

async function shell() {
  const main = h('main', { class: 'main', id: 'main' });
  const nav = h('nav', { class: 'side', 'aria-label': 'Beheer' });
  app.replaceChildren(h('div', { class: 'shell' }, nav, main));
  const items = [
    ['#/dashboard', 'Overzicht'],
    ['sep', 'Inhoud'], ['#/pages', "Pagina's"], ['#/posts', 'Nieuws'], ['#/stories', 'Klantverhalen'], ['#/media', 'Media'], ['#/inbox', 'Inbox'],
    ...(isAdmin() ? [['sep', 'Beheer'], ['#/settings', 'Instellingen'], ['#/users', 'Gebruikers']] : []),
    ['sep', 'Account'], ['#/account', `Mijn account (${state.user.name})`],
  ];
  const drawNav = () => {
    const cur = location.hash.split('/').slice(0, 2).join('/');
    nav.replaceChildren(h('div', { class: 'brand' }, 'the finest impact'),
      ...items.map(([href, label]) => href === 'sep' ? h('div', { class: 'sep' }, label) :
        h('a', { class: 'nav' + (cur === href ? ' on' : ''), href }, label, href === '#/inbox' && state.unread ? h('span', { class: 'badge' }, state.unread) : null)),
      h('div', { class: 'sep' }, 'Site'),
      h('a', { class: 'nav', href: '/', target: '_blank', rel: 'noopener' }, 'Bekijk de site ↗'),
      h('a', { class: 'nav', href: '#', onclick: async (e) => { e.preventDefault(); if (dirty.on && !confirm('Je hebt niet-opgeslagen wijzigingen. Toch uitloggen?')) return; dirty.clear(); await api.post('logout'); state.user = null; location.hash = ''; loginScreen('Je bent uitgelogd.'); } }, 'Uitloggen'));
  };
  const refreshUnread = async () => { try { state.unread = (await api.get('submissions')).items.filter((s) => !s.read).length; } catch {} drawNav(); };

  let navToken = 0;
  async function route(fromHash = true) {
    const token = ++navToken;
    const [, view = 'dashboard', arg] = location.hash.split('/');
    drawNav();
    main.replaceChildren(h('p', { class: 'muted' }, 'Laden…'));
    try {
      let el;
      if (view === 'dashboard') el = await dashboard();
      else if (COL[view] && !arg) el = await docList(view);
      else if (COL[view]) el = await docEditor(view, decodeURIComponent(arg));
      else if (view === 'media') el = await mediaView();
      else if (view === 'inbox') { el = await inboxView(refreshUnread); }
      else if (view === 'settings' && isAdmin()) el = await settingsView();
      else if (view === 'users' && isAdmin()) el = await usersView();
      else if (view === 'account') el = accountView();
      else el = h('p', {}, 'Pagina niet gevonden.');
      if (token === navToken) { main.replaceChildren(el); main.focus?.(); window.scrollTo(0, 0); }
    } catch (e) {
      if (e.status === 401) { state.user = null; return loginScreen('Je sessie is verlopen. Log opnieuw in.'); }
      main.replaceChildren(errBox(e));
    }
  }
  window.onhashchange = () => {
    if (dirty.on && !confirm('Je hebt niet-opgeslagen wijzigingen. Toch weggaan?')) { history.back(); return; }
    dirty.clear();
    route();
  };
  refreshUnread();
  if (!location.hash) location.hash = '#/dashboard'; else route();
}

// ---------- dashboard ----------
async function dashboard() {
  const [p, n, s, m, sub] = await Promise.all(['pages', 'posts', 'stories'].map((c) => api.get('docs', { col: c })).concat([api.get('media'), api.get('submissions')]));
  const card = (label, value, href) => h('a', { class: 'card', href, style: { textDecoration: 'none', display: 'block' } }, h('div', { class: 'muted small' }, label), h('div', { style: { fontSize: '30px', fontWeight: 300 } }, String(value)));
  const unread = sub.items.filter((x) => !x.read).length;
  const recent = [...p.items.map((i) => ({ ...i, col: 'pages' })), ...n.items.map((i) => ({ ...i, col: 'posts' })), ...s.items.map((i) => ({ ...i, col: 'stories' }))].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 8);
  return h('div', {},
    h('div', { class: 'topbar' }, h('h1', {}, `Welkom, ${state.user.name}`)),
    state.storage === 'none' ? h('div', { class: 'notice warn' }, 'Er is nog geen opslag gekoppeld: de site toont de standaardinhoud en je kunt nog niets opslaan.') : null,
    h('div', { class: 'grid2', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '14px' } },
      card("Pagina's", p.items.length, '#/pages'), card('Nieuwsberichten', n.items.length, '#/posts'), card('Klantverhalen', s.items.length, '#/stories'), card("Foto's", m.items.length, '#/media'), card('Ongelezen berichten', unread, '#/inbox')),
    h('div', { class: 'card' }, h('h2', {}, 'Laatst gewijzigd'),
      h('table', {}, h('tbody', {}, recent.map((r) => h('tr', {}, h('td', {}, h('a', { class: 'title', href: `#/${r.col}/${encodeURIComponent(r.slug)}` }, r.title)), h('td', { class: 'muted small' }, COL[r.col].single), h('td', {}, pill(r.status)), h('td', { class: 'muted small' }, fmtDate(r.updatedAt))))))));
}

// ---------- lists ----------
async function docList(col) {
  const { items } = await api.get('docs', { col });
  const q = { text: '' };
  const tbody = h('tbody');
  const draw = () => {
    const t = q.text.toLowerCase();
    tbody.replaceChildren(...items.filter((i) => !t || i.title.toLowerCase().includes(t) || i.slug.includes(t)).map((i) => h('tr', {},
      h('td', {}, h('a', { class: 'title', href: `#/${col}/${encodeURIComponent(i.slug)}` }, i.title), h('div', { class: 'muted small' }, COL[col].pub(i.slug))),
      col !== 'pages' ? h('td', { class: 'muted small' }, i.category || '') : null,
      h('td', {}, pill(i.status), i.status === 'scheduled' ? h('div', { class: 'muted small' }, fmtDate(i.publishAt)) : null),
      h('td', { class: 'muted small' }, fmtDate(i.updatedAt)),
      h('td', {}, h('div', { class: 'row end' },
        i.status === 'published' ? h('a', { class: 'btn ghost small', href: COL[col].pub(i.slug), target: '_blank', rel: 'noopener' }, 'Bekijk') : null,
        h('a', { class: 'btn ghost small', href: `#/${col}/${encodeURIComponent(i.slug)}` }, 'Bewerken'),
        !(col === 'pages' && SPECIAL.has(i.slug)) ? h('button', { class: 'btn danger small', onclick: async () => {
          if (!confirm(`“${i.title}” verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
          try { await api.del('doc', { col, slug: i.slug }); items.splice(items.indexOf(i), 1); draw(); toast('Verwijderd'); } catch (e) { toast(e.message, 4000); }
        } }, 'Verwijderen') : null)))));
    if (!tbody.children.length) tbody.replaceChildren(h('tr', {}, h('td', { colspan: 5, class: 'muted' }, 'Niets gevonden.')));
  };
  draw();
  return h('div', {},
    h('div', { class: 'topbar' }, h('h1', {}, COL[col].label), h('div', { class: 'row' }, h('input', { type: 'search', placeholder: 'Zoeken…', style: { width: '200px' }, 'aria-label': 'Zoeken', oninput: (e) => { q.text = e.target.value; draw(); } }), h('a', { class: 'btn', href: `#/${col}/new` }, `+ Nieuw ${COL[col].single.toLowerCase()}`))),
    h('div', { class: 'card' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Titel'), col !== 'pages' ? h('th', {}, 'Categorie') : null, h('th', {}, 'Status'), h('th', {}, 'Gewijzigd'), h('th', {}))), tbody)));
}

// ---------- editor ----------
const blank = (col) => col === 'pages'
  ? { title: '', slug: '', status: 'draft', publishAt: '', seo: { title: '', description: '', image: '', noindex: false }, blocks: [BLOCKS.section.make()] }
  : { title: '', slug: '', status: 'draft', publishAt: '', excerpt: '', category: '', author: state.user.name, date: new Date().toISOString(), image: { src: '', card: '', alt: '' }, html: '', seo: { title: '', description: '', image: '', noindex: false } };

async function docEditor(col, slugArg) {
  const isNew = slugArg === 'new';
  let doc = isNew ? blank(col) : (await api.get('doc', { col, slug: slugArg })).doc;
  doc.seo ||= { title: '', description: '', image: '', noindex: false };
  doc.image ||= { src: '', card: '', alt: '' };
  let original = isNew ? '' : doc.slug;
  let base = isNew ? '' : doc.updatedAt;
  let slugTouched = !isNew;
  const special = col === 'pages' && SPECIAL.has(original);
  const root = h('div');
  const msg = h('div');
  let slugInput = null;
  const openBlocks = new Set();

  const payload = () => ({ col, doc: { ...doc, originalSlug: original || undefined, baseUpdatedAt: base || undefined } });

  async function save(force) {
    msg.replaceChildren();
    try {
      const p = payload();
      if (force) p.doc.baseUpdatedAt = force;
      const r = await api.post('doc', { col, doc: p.doc });
      doc = r.doc; original = doc.slug; base = doc.updatedAt; dirty.clear();
      toast('Opgeslagen');
      const want = `#/${col}/${encodeURIComponent(doc.slug)}`;
      if (location.hash !== want) { history.replaceState(null, '', want); }
      draw();
    } catch (e) {
      if (e.status === 409 && e.data?.current) {
        const cur = e.data.current;
        modal('Intussen gewijzigd', h('div', {},
          h('p', {}, `Deze ${COL[col].single.toLowerCase()} is gewijzigd door ${cur.updatedBy || 'iemand anders'} op ${fmtDate(cur.updatedAt)}.`),
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { document.querySelector('.overlay')?.remove(); save(cur.updatedAt); } }, 'Mijn versie toch opslaan'),
            h('button', { class: 'btn ghost', onclick: () => { dirty.clear(); location.reload(); } }, 'Nieuwste versie laden (mijn wijzigingen vervallen)'))));
      } else msg.replaceChildren(errBox(e));
    }
  }

  async function preview() {
    try {
      const { html } = await api.post('preview', { col, doc });
      modal('Voorbeeld (nog niet opgeslagen)', h('iframe', { sandbox: 'allow-scripts', srcdoc: html, title: 'Voorbeeld' }), { wide: true });
    } catch (e) { msg.replaceChildren(errBox(e)); }
  }

  async function revisions() {
    if (!original) return toast('Nog geen eerdere versies.');
    const { items } = await api.get('revisions', { col, slug: original });
    const body = h('div', {}, items.length ? h('table', {}, h('tbody', {}, items.map((r) => h('tr', {}, h('td', {}, fmtDate(r.at)), h('td', { class: 'row end' }, h('button', { class: 'btn ghost small', onclick: async () => {
      const { doc: old } = await api.get('revision', { col, slug: original, id: r.id });
      if (!confirm('Deze versie terugzetten? Je moet daarna nog opslaan.')) return;
      doc = { ...old, slug: original, updatedAt: base }; dirty.mark(); document.querySelector('.overlay')?.remove(); draw(); toast('Versie teruggezet; sla op om te bewaren.');
    } }, 'Terugzetten')))))) : h('p', { class: 'muted' }, 'Nog geen eerdere versies. Bij elke keer opslaan wordt de vorige versie bewaard (laatste 20).'));
    modal('Eerdere versies', body);
  }

  function draw() {
    const statusRow = [
      field('Status', selectInput(doc, 'status', [['draft', 'Concept (niet zichtbaar)'], ['published', 'Gepubliceerd'], ['scheduled', 'Ingepland']], { onChange: () => draw() })),
      doc.status === 'scheduled' ? field('Publiceren op', h('input', { type: 'datetime-local', value: toLocalInput(doc.publishAt), onchange: (e) => { doc.publishAt = e.target.value ? new Date(e.target.value).toISOString() : ''; dirty.mark(); } })) : null,
    ];
    slugInput = special ? null : textInput(doc, 'slug', { onInput: () => { slugTouched = true; } });
    const urlField = special ? h('p', { class: 'muted small' }, `Vaste pagina: ${COL[col].pub(doc.slug)}`) : field('URL-naam', slugInput, 'Alleen kleine letters, cijfers en streepjes.');
    const side = h('aside', {},
      h('div', { class: 'card' }, h('h3', {}, 'Publicatie'), statusRow, urlField,
        original && doc.status === 'published' ? h('a', { href: COL[col].pub(original), target: '_blank', rel: 'noopener', class: 'small' }, 'Bekijk op de site ↗') : null),
      col !== 'pages' ? h('div', { class: 'card' }, h('h3', {}, 'Gegevens'),
        field('Categorie', textInput(doc, 'category', { max: 80 })), field('Auteur', textInput(doc, 'author', { max: 80 })),
        field('Datum', h('input', { type: 'datetime-local', value: toLocalInput(doc.date), onchange: (e) => { doc.date = e.target.value ? new Date(e.target.value).toISOString() : doc.date; dirty.mark(); } })),
        field('Samenvatting', areaInput(doc, 'excerpt', { rows: 3, max: 400 }), 'Staat in lijsten en bij het delen.'),
        imageField(doc.image, 'src', { altKey: 'alt', label: 'Uitgelichte afbeelding' }),
        h('details', {}, h('summary', { class: 'small muted' }, 'Aparte afbeelding voor kaartjes (optioneel)'), imageField(doc.image, 'card', { label: 'Kaartafbeelding' }))) : null,
      h('div', { class: 'card' }, h('h3', {}, 'Zoekmachine (SEO)'),
        field('Titel in Google', textInput(doc.seo, 'title', { max: 120, placeholder: doc.title }), 'Leeg = de paginatitel.'),
        field('Beschrijving', areaInput(doc.seo, 'description', { rows: 3, max: 320 }), 'Ongeveer 150 tekens is ideaal.'),
        imageField(doc.seo, 'image', { label: 'Afbeelding bij delen' }),
        checkInput(doc.seo, 'noindex', 'Verberg voor zoekmachines')));
    const main = h('div', {},
      h('div', { class: 'card' }, field('Titel', textInput(doc, 'title', { max: 200, onInput: (v) => { if (!slugTouched && !special) { doc.slug = slugify(v); if (slugInput) slugInput.value = doc.slug; } } }))),
      col === 'pages' ? blockEditor(doc.blocks, openBlocks) : h('div', { class: 'card' }, h('h3', {}, 'Tekst'), richText(doc, 'html', { minHeight: 380 })));
    root.replaceChildren(
      h('div', { class: 'stickybar row', style: { justifyContent: 'space-between' } },
        h('div', { class: 'row' }, h('a', { href: `#/${col}`, class: 'btn ghost small' }, '← ' + COL[col].label), h('strong', {}, isNew && !original ? `Nieuw ${COL[col].single.toLowerCase()}` : (doc.title || 'Zonder titel')), original ? pill(doc.status) : null),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: preview }, 'Voorbeeld'), original ? h('button', { class: 'btn ghost', onclick: revisions }, 'Eerdere versies') : null, h('button', { class: 'btn', onclick: () => save() }, 'Opslaan'))),
      msg, h('div', { class: 'editor' }, main, side));
  }
  draw();
  root.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } });
  return root;
}

// ---------- media ----------
async function mediaView() {
  let { items } = await api.get('media');
  const grid = h('div', { class: 'mgrid' });
  const status = h('p', { class: 'muted small' });
  const draw = () => {
    grid.replaceChildren(...items.map((m) => h('button', { class: 'mitem', onclick: () => detail(m) }, h('img', { src: m.url, alt: m.alt || '', loading: 'lazy' }), h('div', { class: 'n' }, m.name || m.file))));
    if (!items.length) grid.replaceChildren(h('p', { class: 'muted' }, 'Nog geen afbeeldingen.'));
  };
  const detail = (m) => {
    const o = { alt: m.alt || '' };
    const md = modal(m.name || m.file, h('div', {},
      h('img', { src: m.url, alt: m.alt || '', style: { maxWidth: '100%', maxHeight: '45vh', borderRadius: '8px', display: 'block', marginBottom: '12px' } }),
      h('p', { class: 'muted small' }, `${m.width}×${m.height} · ${(m.size / 1024).toFixed(0)} KB · ${fmtDate(m.uploadedAt)}`),
      field('Webadres', h('input', { type: 'text', readonly: true, value: location.origin + m.url, onclick: (e) => e.target.select() })),
      field('Beschrijving (alt-tekst)', textInput(o, 'alt', { max: 200 })),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => { try { Object.assign(m, (await api.patch('media', { alt: o.alt }, { id: m.id })).item); dirty.clear(); md.close(); draw(); toast('Opgeslagen'); } catch (e) { toast(e.message, 4000); } } }, 'Opslaan'),
        h('button', { class: 'btn danger', onclick: async () => { if (!confirm('Deze afbeelding verwijderen? Pagina’s die hem gebruiken tonen dan een leeg vlak.')) return; try { await api.del('media', { id: m.id }); items = items.filter((x) => x !== m); md.close(); draw(); } catch (e) { toast(e.message, 4000); } } }, 'Verwijderen'))));
  };
  const handle = async (files) => {
    for (const f of files) {
      try { status.textContent = `Uploaden: ${f.name}…`; items.unshift(await uploadFile(f)); draw(); } catch (e) { status.textContent = e.message; return; }
    }
    status.textContent = 'Klaar.';
  };
  const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif', multiple: true, style: { display: 'none' }, onchange: (e) => handle([...e.target.files]) });
  const zone = h('div', { class: 'dropzone', ondragover: (e) => { e.preventDefault(); zone.classList.add('over'); }, ondragleave: () => zone.classList.remove('over'), ondrop: (e) => { e.preventDefault(); zone.classList.remove('over'); handle([...e.dataTransfer.files]); } },
    'Sleep afbeeldingen hierheen of ', h('button', { class: 'btn small', onclick: () => fileInput.click() }, 'kies bestanden'), fileInput, h('div', { class: 'small muted', style: { marginTop: '6px' } }, 'Grote foto’s worden automatisch verkleind (max. 2400 px).'));
  draw();
  return h('div', {}, h('div', { class: 'topbar' }, h('h1', {}, 'Media')), zone, status, grid);
}

// ---------- inbox ----------
async function inboxView(refreshUnread) {
  let { items } = await api.get('submissions');
  const tbody = h('tbody');
  const draw = () => {
    tbody.replaceChildren(...items.map((s) => h('tr', { class: s.read ? '' : 'unread' },
      h('td', {}, h('a', { href: '#', class: 'title', onclick: (e) => { e.preventDefault(); open(s); } }, s.name), h('div', { class: 'muted small' }, s.email)),
      h('td', { class: 'small' }, (s.message || '').slice(0, 90)), h('td', { class: 'muted small' }, fmtDate(s.at)))));
    if (!items.length) tbody.replaceChildren(h('tr', {}, h('td', { colspan: 3, class: 'muted' }, 'Nog geen berichten.')));
  };
  const open = async (s) => {
    if (!s.read) { try { await api.patch('submission', { read: true }, { id: s.key }); s.read = true; draw(); refreshUnread(); } catch {} }
    const m = modal(`Bericht van ${s.name}`, h('div', {},
      h('p', { class: 'muted small' }, `${fmtDate(s.at)} · ${s.email}${s.company ? ' · ' + s.company : ''}`), h('div', { class: 'mail' }, s.message),
      h('div', { class: 'row', style: { marginTop: '12px' } },
        h('a', { class: 'btn', href: `mailto:${s.email}?subject=${encodeURIComponent('Re: je bericht aan ons')}` }, 'Beantwoorden'),
        h('button', { class: 'btn ghost', onclick: async () => { await api.patch('submission', { read: false }, { id: s.key }); s.read = false; m.close(); draw(); refreshUnread(); } }, 'Markeer als ongelezen'),
        h('button', { class: 'btn danger', onclick: async () => { if (!confirm('Dit bericht verwijderen?')) return; await api.del('submission', { id: s.key }); items = items.filter((x) => x !== s); m.close(); draw(); refreshUnread(); } }, 'Verwijderen'))));
  };
  draw();
  return h('div', {}, h('div', { class: 'topbar' }, h('h1', {}, 'Inbox')), h('p', { class: 'muted small' }, 'Berichten uit het contactformulier. Bewaar persoonsgegevens niet langer dan nodig en verwijder oude berichten.'),
    h('div', { class: 'card' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Van'), h('th', {}, 'Bericht'), h('th', {}, 'Ontvangen'))), tbody)));
}

// ---------- settings ----------
async function settingsView() {
  const s = (await api.get('settings')).settings;
  s.defaultSeo ||= {}; s.contact ||= {}; s.whatsapp ||= {}; s.footer ||= { platform: [], legal: [] }; s.menu ||= []; s.motion ||= {};
  const linkList = (arr, title) => {
    const box = h('div');
    const draw = () => box.replaceChildren(h('h3', {}, title), ...arr.map((l, i) => h('div', { class: 'row', style: { marginBottom: '6px' } },
      h('div', { class: 'grow' }, textInput(l, 'label', { placeholder: 'Tekst', max: 60 })), h('div', { class: 'grow' }, textInput(l, 'url', { placeholder: '/pagina' })),
      h('button', { class: 'iconbtn', disabled: i === 0, onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; dirty.mark(); draw(); } }, '↑'),
      h('button', { class: 'iconbtn', disabled: i === arr.length - 1, onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; dirty.mark(); draw(); } }, '↓'),
      h('button', { class: 'iconbtn', onclick: () => { arr.splice(i, 1); dirty.mark(); draw(); } }, '✕')),
    ), h('button', { class: 'btn ghost small', onclick: () => { arr.push({ label: '', url: '' }); dirty.mark(); draw(); } }, '+ Link toevoegen'));
    draw();
    return box;
  };
  const msg = h('div');
  return h('div', {},
    h('div', { class: 'topbar' }, h('h1', {}, 'Instellingen'), h('button', { class: 'btn', onclick: async () => {
      try { await api.post('settings', s); dirty.clear(); msg.replaceChildren(h('div', { class: 'notice ok' }, 'Opgeslagen. Wijzigingen zijn binnen een minuut zichtbaar op de site.')); } catch (e) { msg.replaceChildren(errBox(e)); }
    } }, 'Opslaan')), msg,
    h('div', { class: 'card' }, h('h2', {}, 'Site'),
      h('div', { class: 'grid2' }, field('Sitenaam', textInput(s, 'siteName', { max: 80 })), field('Woordmerk in de header', textInput(s, 'wordmark', { max: 60 })),
        field('Slogan (footer)', textInput(s, 'tagline', { max: 160 })), field('Adres van de site', textInput(s, 'siteUrl', { placeholder: 'https://www.jouwdomein.nl' }), 'Zonder slash aan het eind. Wordt gebruikt voor Google en delen.')),
      field('Standaard beschrijving voor Google', areaInput(s.defaultSeo, 'description', { rows: 2, max: 320 })), imageField(s.defaultSeo, 'image', { label: 'Standaard afbeelding bij delen' })),
    h('div', { class: 'card' }, h('h2', {}, 'Contact'),
      h('div', { class: 'grid2' }, field('E-mailadres op de site', textInput(s.contact, 'email', { type: 'email' })), field('Berichten uit het formulier mailen naar', textInput(s.contact, 'notifyEmail', { type: 'email' }), 'Werkt zodra e-mailverzending (Resend) is gekoppeld; de Inbox werkt altijd.'),
        field('WhatsApp-nummer', textInput(s.whatsapp, 'number', { placeholder: '31612345678' }), 'Met landcode, zonder + of nullen.'), field('Voorgevulde WhatsApp-tekst', textInput(s.whatsapp, 'message', { max: 200 }))),
      field('Link van “Inloggen” in het menu', textInput(s, 'loginUrl', { placeholder: 'https://…' }), '# = nog geen link')),
    h('div', { class: 'card' }, linkList(s.menu, 'Hoofdmenu (bovenaan)')),
    h('div', { class: 'card' }, linkList(s.footer.platform, 'Footer: kolom Platform'), h('hr'), linkList(s.footer.legal, 'Footer: juridische links'), field('Extra regel onderaan', textInput(s.footer, 'note', { max: 200 }))),
    h('div', { class: 'card' }, h('h2', {}, 'Opslag en koppelingen'),
      h('p', { class: 'muted small' }, 'Controleert of de opslag (Vercel Blob) schrijft, leest en verwijdert, en of de geheime sleutels zijn ingesteld.'),
      h('button', { class: 'btn ghost', onclick: async (e) => {
        const out = e.target.nextElementSibling; out.replaceChildren(h('p', { class: 'muted' }, 'Bezig…'));
        try { const r = await api.post('storage-check'); out.replaceChildren(h('div', { class: 'notice ' + (r.ok ? 'ok' : 'err') }, r.ok ? 'Alles werkt.' : 'Er is iets mis.'), h('table', {}, h('tbody', {}, r.steps.map((x) => h('tr', {}, h('td', {}, x.ok ? '✓' : '✗'), h('td', {}, x.name), h('td', { class: 'muted small' }, x.detail), h('td', { class: 'muted small' }, x.ms + ' ms')))))); }
        catch (err) { out.replaceChildren(errBox(err)); }
      } }, 'Opslag controleren'), h('div', { style: { marginTop: '10px' } })),
    h('div', { class: 'card' }, h('h2', {}, 'Beweging en scrollen'),
      h('p', { class: 'muted small' }, 'Bezoekers die “beweging verminderen” hebben aangezet zien nooit animaties, wat je hier ook kiest.'),
      checkInput(s.motion, 'animations', 'Animaties aan (uit = alles staat meteen op zijn plek)'),
      checkInput(s.motion, 'smoothScroll', 'Zacht uitlopend scrollen met muiswiel of trackpad'),
      field('Duur van het uitlopen (seconden)', textInput(s.motion, 'smoothDuration', { type: 'number', min: 0.3, maxNum: 3, step: 0.1 }), 'Lager = directer (0,6), hoger = zachter (1,6). Standaard 1,1.'),
      checkInput(s.motion, 'reveals', 'Koppen, foto’s en kaarten verschijnen met een animatie'),
      checkInput(s.motion, 'pinnedRail', 'Optiek Stories schuift zijwaarts terwijl je omlaag scrolt (desktop)'),
      checkInput(s.motion, 'progressBar', 'Dunne voortgangslijn bovenaan')));
}

// ---------- users + account ----------
async function usersView() {
  let { items } = await api.get('users');
  const box = h('div');
  const draw = () => box.replaceChildren(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Naam'), h('th', {}, 'E-mail'), h('th', {}, 'Rol'), h('th', {}, 'Laatste login'), h('th', {}))),
    h('tbody', {}, items.map((u) => h('tr', {}, h('td', {}, u.name), h('td', {}, u.email), h('td', {}, u.role === 'admin' ? 'Beheerder' : 'Redacteur'), h('td', { class: 'muted small' }, fmtDate(u.lastLogin)),
      h('td', {}, h('div', { class: 'row end' },
        h('button', { class: 'btn ghost small', onclick: async () => { const pw = await askText('Nieuw wachtwoord', `Nieuw wachtwoord voor ${u.name} (min. 10 tekens, letters en cijfers)`); if (pw) { try { await api.patch('users', { password: pw }, { id: u.id }); toast('Wachtwoord gewijzigd'); } catch (e) { toast(e.message, 4500); } } } }, 'Wachtwoord'),
        h('button', { class: 'btn ghost small', onclick: async () => { try { await api.patch('users', { role: u.role === 'admin' ? 'editor' : 'admin' }, { id: u.id }); items = (await api.get('users')).items; draw(); } catch (e) { toast(e.message, 4500); } } }, u.role === 'admin' ? 'Maak redacteur' : 'Maak beheerder'),
        u.id !== state.user.id ? h('button', { class: 'btn danger small', onclick: async () => { if (!confirm(`${u.name} verwijderen?`)) return; try { await api.del('users', { id: u.id }); items = items.filter((x) => x !== u); draw(); } catch (e) { toast(e.message, 4500); } } }, 'Verwijderen') : null)))))));
  draw();
  const o = { name: '', email: '', password: '', role: 'editor' };
  const out = h('div');
  return h('div', {}, h('div', { class: 'topbar' }, h('h1', {}, 'Gebruikers')),
    h('div', { class: 'card' }, box),
    h('div', { class: 'card' }, h('h2', {}, 'Gebruiker toevoegen'), out,
      h('p', { class: 'muted small' }, 'Redacteuren kunnen inhoud, media en de inbox beheren. Beheerders kunnen daarnaast instellingen en gebruikers beheren.'),
      h('div', { class: 'grid2' }, field('Naam', textInput(o, 'name')), field('E-mailadres', textInput(o, 'email', { type: 'email' })), field('Wachtwoord', textInput(o, 'password', { type: 'password' }), 'Min. 10 tekens, letters en cijfers.'), field('Rol', selectInput(o, 'role', [['editor', 'Redacteur'], ['admin', 'Beheerder']]))),
      h('button', { class: 'btn', onclick: async () => { try { await api.post('users', o); items = (await api.get('users')).items; draw(); Object.assign(o, { name: '', email: '', password: '' }); out.replaceChildren(h('div', { class: 'notice ok' }, 'Gebruiker toegevoegd.')); } catch (e) { out.replaceChildren(errBox(e)); } } }, 'Toevoegen')));
}

function accountView() {
  const o = { current: '', next: '' };
  const out = h('div');
  return h('div', {}, h('div', { class: 'topbar' }, h('h1', {}, 'Mijn account')),
    h('div', { class: 'card' }, h('p', {}, `${state.user.name} · ${state.user.email} · ${state.user.role === 'admin' ? 'Beheerder' : 'Redacteur'}`),
      h('h2', {}, 'Wachtwoord wijzigen'), out,
      field('Huidig wachtwoord', textInput(o, 'current', { type: 'password' })), field('Nieuw wachtwoord', textInput(o, 'next', { type: 'password' }), 'Min. 10 tekens, letters en cijfers.'),
      h('button', { class: 'btn', onclick: async () => { try { await api.post('password', o); dirty.clear(); o.current = o.next = ''; out.replaceChildren(h('div', { class: 'notice ok' }, 'Wachtwoord gewijzigd.')); } catch (e) { out.replaceChildren(errBox(e)); } } }, 'Wijzigen')));
}

boot();
