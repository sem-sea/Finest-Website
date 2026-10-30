// Small UI toolkit for the admin: element builder, API client, modal, fields,
// rich-text editor and the media picker. No dependencies, no innerHTML except
// the rich-text editor (which only ever shows server-sanitised HTML).

export const h = (tag, props = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else if (k === 'disabled') el.disabled = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
};

// ---------- API ----------
async function call(method, route, params = {}, body) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`/api/${route}${qs ? '?' + qs : ''}`, {
    method,
    credentials: 'same-origin',
    headers: { 'X-CMS': '1', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'Er ging iets mis.'), { status: r.status, data });
  return data;
}
export const api = {
  get: (route, params) => call('GET', route, params),
  post: (route, body, params) => call('POST', route, params, body ?? {}),
  patch: (route, body, params) => call('PATCH', route, params, body ?? {}),
  del: (route, params) => call('DELETE', route, params),
};

// ---------- dirty state ----------
export const dirty = { on: false, mark() { this.on = true; }, clear() { this.on = false; } };
window.addEventListener('beforeunload', (e) => {
  if (dirty.on) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ---------- toast / modal ----------
export function toast(msg, ms = 2600) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

export function modal(title, content, { wide = false, onClose } = {}) {
  const prev = document.activeElement;
  const close = () => {
    ov.remove();
    document.removeEventListener('keydown', onKey);
    prev?.focus?.();
    onClose?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();
  const ov = h('div', { class: 'overlay', onclick: (e) => e.target === ov && close() },
    h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '10px' } },
        h('h2', { style: { margin: 0 } }, title),
        h('button', { class: 'btn ghost small', onclick: close }, 'Sluiten')),
      content));
  document.body.append(ov);
  document.addEventListener('keydown', onKey);
  ov.querySelector('input,button,textarea,[contenteditable]')?.focus();
  return { close };
}

export function askText(title, label, value = '') {
  return new Promise((resolve) => {
    let done = false;
    const input = h('input', { type: 'text', value });
    const finish = (v) => {
      if (done) return;
      done = true;
      m.close();
      resolve(v);
    };
    const m = modal(title, h('form', { onsubmit: (e) => { e.preventDefault(); finish(input.value.trim()); } },
      h('label', { class: 'f' }, h('span', { class: 'l' }, label), input),
      h('div', { class: 'row end' }, h('button', { class: 'btn', type: 'submit' }, 'OK'))), { onClose: () => finish(null) });
    input.focus();
  });
}

// ---------- fields ----------
export const field = (label, control, hint) =>
  h('label', { class: 'f' }, h('span', { class: 'l' }, label), control, hint ? h('span', { class: 'hint' }, hint) : null);

export const textInput = (obj, key, o = {}) =>
  h('input', {
    type: o.type || 'text', value: obj[key] ?? '', placeholder: o.placeholder, maxlength: o.max, min: o.min, max: o.maxNum, step: o.step,
    oninput: (e) => { obj[key] = e.target.value; dirty.mark(); o.onInput?.(e.target.value); },
  });

export const areaInput = (obj, key, o = {}) =>
  h('textarea', { rows: o.rows || 3, maxlength: o.max, placeholder: o.placeholder, oninput: (e) => { obj[key] = e.target.value; dirty.mark(); } }, obj[key] ?? '');

export const selectInput = (obj, key, options, o = {}) =>
  h('select', { onchange: (e) => { obj[key] = e.target.value; dirty.mark(); o.onChange?.(e.target.value); } },
    options.map(([v, l]) => h('option', { value: v, selected: obj[key] === v ? true : null }, l)));

export const checkInput = (obj, key, label, o = {}) =>
  h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!obj[key], onchange: (e) => { obj[key] = e.target.checked; dirty.mark(); o.onChange?.(e.target.checked); } }), h('span', {}, label));

// ---------- rich text ----------
export function richText(obj, key, { minHeight = 140 } = {}) {
  const ed = h('div', { class: 'rte', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', style: { minHeight: minHeight + 'px' } });
  ed.innerHTML = obj[key] || '';
  const sync = () => { obj[key] = ed.innerHTML; dirty.mark(); };
  ed.addEventListener('input', sync);
  ed.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });
  const exec = (cmd, val) => { ed.focus(); document.execCommand(cmd, false, val); sync(); };
  const saveSel = () => { const s = getSelection(); return s.rangeCount ? s.getRangeAt(0).cloneRange() : null; };
  const restore = (r) => { if (r) { const s = getSelection(); s.removeAllRanges(); s.addRange(r); } };
  const bar = h('div', { class: 'rte-bar' },
    ...[
      ['B', 'Vet', () => exec('bold')], ['I', 'Cursief', () => exec('italic')],
      ['Kop', 'Kop (H2)', () => exec('formatBlock', 'h2')], ['Subkop', 'Subkop (H3)', () => exec('formatBlock', 'h3')], ['Tekst', 'Gewone tekst', () => exec('formatBlock', 'p')],
      ['Lead', 'Inleidende alinea', () => {
        ed.focus();
        const n = getSelection().anchorNode?.parentElement?.closest('p');
        if (n && ed.contains(n)) { n.classList.toggle('lead'); sync(); }
      }],
      ['• Lijst', 'Opsomming', () => exec('insertUnorderedList')], ['1. Lijst', 'Genummerde lijst', () => exec('insertOrderedList')],
      ['Citaat', 'Citaat', () => exec('formatBlock', 'blockquote')],
      ['Link', 'Link toevoegen', async () => {
        const r = saveSel();
        const url = await askText('Link', 'Webadres (https://…, mailto:… of /pagina)');
        if (url) { restore(r); exec('createLink', url); }
      }],
      ['Knop', 'Link als knop', async () => {
        const r = saveSel();
        const url = await askText('Knop', 'Waar moet de knop naartoe? (bijv. /contact)');
        if (!url) return;
        restore(r);
        exec('createLink', url);
        const a = getSelection().anchorNode?.parentElement?.closest('a');
        if (a) { a.className = 'btn'; sync(); }
      }],
      ['Knop (rand)', 'Link als knop met rand', async () => {
        const r = saveSel();
        const url = await askText('Knop', 'Waar moet de knop naartoe? (bijv. /contact)');
        if (!url) return;
        restore(r);
        exec('createLink', url);
        const a = getSelection().anchorNode?.parentElement?.closest('a');
        if (a) { a.className = 'btn btn--outline'; sync(); }
      }],
      ['Foto', 'Foto uit de bibliotheek', async () => {
        const r = saveSel();
        const m = await pickMedia();
        if (m) { restore(r); exec('insertHTML', `<img src="${m.url}" alt="${(m.alt || '').replace(/"/g, '&quot;')}">`); }
      }],
      ['Wis opmaak', 'Opmaak wissen', () => { exec('removeFormat'); exec('unlink'); }],
    ].map(([t, title, fn]) => h('button', { type: 'button', title, 'aria-label': title, onclick: fn }, t))
  );
  return h('div', {}, bar, ed);
}

// ---------- media ----------
const MAX_SIDE = 2400;
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Dit bestand kan niet als afbeelding worden gelezen.')); };
    im.src = url;
  });
}
const toBase64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });

export async function uploadFile(file, alt = '') {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Alleen JPG, PNG, WebP en GIF zijn toegestaan.');
  const im = await loadImage(file);
  let blob = file, type = file.type, w = im.naturalWidth, hgt = im.naturalHeight;
  const tooBig = file.size > 900 * 1024 || Math.max(w, hgt) > MAX_SIDE;
  if (tooBig && file.type !== 'image/gif') {
    const scale = Math.min(1, MAX_SIDE / Math.max(w, hgt));
    w = Math.round(w * scale); hgt = Math.round(hgt * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = hgt;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hgt);
    ctx.drawImage(im, 0, 0, w, hgt);
    type = 'image/jpeg';
    blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86));
  }
  if (blob.size > 3 * 1024 * 1024) throw new Error('Deze afbeelding is te groot, ook na verkleinen (max. 3 MB).');
  const name = type === file.type ? file.name : file.name.replace(/\.[a-z0-9]+$/i, '') + '.jpg';
  return (await api.post('media', { name, contentType: type, data: await toBase64(blob), alt, width: w, height: hgt })).item;
}

export function pickMedia() {
  return new Promise(async (resolve) => {
    let chosen = null;
    let items = [];
    const grid = h('div', { class: 'mgrid' });
    const status = h('p', { class: 'muted small' });
    const render = () => {
      grid.replaceChildren(...items.map((m) => h('button', { type: 'button', class: 'mitem', title: m.name, onclick: () => { chosen = m; mm.close(); } },
        h('img', { src: m.url, alt: m.alt || '', loading: 'lazy' }), h('div', { class: 'n' }, m.name || m.file))));
      if (!items.length) grid.replaceChildren(h('p', { class: 'muted' }, 'Nog geen afbeeldingen. Upload er een hierboven.'));
    };
    const handle = async (files) => {
      for (const f of files) {
        try {
          status.textContent = `Uploaden: ${f.name}…`;
          items.unshift(await uploadFile(f));
          render();
        } catch (e) { status.textContent = e.message; return; }
      }
      status.textContent = 'Klaar. Klik een afbeelding om te kiezen.';
    };
    const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif', multiple: true, style: { display: 'none' }, onchange: (e) => handle([...e.target.files]) });
    const zone = h('div', { class: 'dropzone', ondragover: (e) => { e.preventDefault(); zone.classList.add('over'); }, ondragleave: () => zone.classList.remove('over'), ondrop: (e) => { e.preventDefault(); zone.classList.remove('over'); handle([...e.dataTransfer.files]); } },
      'Sleep afbeeldingen hierheen of ', h('button', { type: 'button', class: 'btn small', onclick: () => fileInput.click() }, 'kies bestanden'), fileInput);
    const mm = modal('Afbeelding kiezen', h('div', {}, zone, status, grid), { wide: true, onClose: () => resolve(chosen) });
    try { items = (await api.get('media')).items; } catch (e) { status.textContent = e.message; }
    render();
  });
}

export function imageField(obj, key, { altKey, label = 'Afbeelding' } = {}) {
  const wrap = h('div', { class: 'f' });
  const draw = () => {
    wrap.replaceChildren(
      h('span', { class: 'l', style: { fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '4px' } }, label),
      obj[key] ? h('img', { class: 'thumb', src: obj[key], alt: '' }) : h('p', { class: 'muted small' }, 'Geen afbeelding gekozen'),
      h('div', { class: 'row', style: { marginBottom: '8px' } },
        h('button', { type: 'button', class: 'btn ghost small', onclick: async () => { const m = await pickMedia(); if (m) { obj[key] = m.url; if (altKey && !obj[altKey]) obj[altKey] = m.alt || ''; dirty.mark(); draw(); } } }, obj[key] ? 'Andere kiezen' : 'Afbeelding kiezen'),
        obj[key] ? h('button', { type: 'button', class: 'btn ghost small', onclick: () => { obj[key] = ''; dirty.mark(); draw(); } }, 'Verwijderen') : ''),
      altKey ? h('label', { class: 'f' }, h('span', { class: 'l' }, 'Beschrijving (alt-tekst)'), textInput(obj, altKey, { max: 200 }), h('span', { class: 'hint' }, 'Voor slechtzienden en Google. Laat leeg als de foto puur decoratief is.')) : ''
    );
  };
  draw();
  return wrap;
}

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }) : '');
export const statusLabel = { published: 'Gepubliceerd', draft: 'Concept', scheduled: 'Ingepland' };
export const pill = (s) => h('span', { class: `pill ${s}` }, statusLabel[s] || s);
