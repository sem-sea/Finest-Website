// Block types for pages: factory, one-line summary and the editing form.
import { h, field, textInput, areaInput, selectInput, checkInput, richText, imageField, dirty } from './ui.js';

const strip = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const VARIANTS = [['default', 'Licht (standaard)'], ['dark', 'Zwart'], ['klei', 'Beige']];

// Repeatable rows (faq items, team members, steps): add, move, delete.
function repeater(arr, make, renderRow, addLabel) {
  const box = h('div');
  const draw = () => {
    box.replaceChildren(
      ...arr.map((item, i) => h('div', { class: 'sub' },
        h('div', { class: 'row end', style: { marginBottom: '6px' } },
          h('button', { type: 'button', class: 'iconbtn', title: 'Omhoog', disabled: i === 0, onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; dirty.mark(); draw(); } }, '↑'),
          h('button', { type: 'button', class: 'iconbtn', title: 'Omlaag', disabled: i === arr.length - 1, onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; dirty.mark(); draw(); } }, '↓'),
          h('button', { type: 'button', class: 'iconbtn', title: 'Verwijderen', onclick: () => { arr.splice(i, 1); dirty.mark(); draw(); } }, '✕')),
        renderRow(item, i))),
      h('button', { type: 'button', class: 'btn ghost small', onclick: () => { arr.push(make()); dirty.mark(); draw(); } }, addLabel)
    );
  };
  draw();
  return box;
}

export const BLOCKS = {
  hero: {
    label: 'Hero met foto',
    make: () => ({ type: 'hero', image: '', alt: '', eyebrow: 'Own your spotlight', title: 'Nieuwe kop', lead: '', buttonLabel: 'Plan een kennismaking', buttonUrl: '/contact' }),
    summary: (b) => b.title,
    form: (b) => [
      imageField(b, 'image', { altKey: 'alt', label: 'Achtergrondfoto' }),
      field('Kleine regel boven de kop', textInput(b, 'eyebrow', { max: 80 })),
      field('Kop', textInput(b, 'title', { max: 200 })),
      field('Inleiding', areaInput(b, 'lead', { max: 400 })),
      h('div', { class: 'grid2' }, field('Knoptekst', textInput(b, 'buttonLabel', { max: 60 })), field('Knop-link', textInput(b, 'buttonUrl', { placeholder: '/contact' }))),
    ],
  },
  section: {
    label: 'Tekstblok',
    make: () => ({ type: 'section', variant: 'default', narrow: true, html: '<h2>Nieuwe kop</h2><p>Schrijf hier je tekst.</p>' }),
    summary: (b) => strip(b.html).slice(0, 90),
    form: (b) => [
      h('div', { class: 'grid2' }, field('Achtergrond', selectInput(b, 'variant', VARIANTS)), h('div', {}, checkInput(b, 'narrow', 'Smalle tekstkolom (leest prettiger)'))),
      richText(b, 'html', { minHeight: 200 }),
    ],
  },
  explainer: {
    label: 'Tekst met animatie',
    make: () => ({ type: 'explainer', variant: 'default', reverse: false, scene: 'hub', html: '<h2>Nieuwe kop</h2><p>Schrijf hier je tekst.</p>' }),
    summary: (b) => `[${b.scene}] ` + strip(b.html).slice(0, 80),
    form: (b) => [
      h('div', { class: 'grid2' },
        field('Achtergrond', selectInput(b, 'variant', VARIANTS)),
        field('Animatie naast de tekst', selectInput(b, 'scene', [['stats', 'Zichtbaarheid (cirkels)'], ['mess', 'Chaos naar ritme (blokjes)'], ['hub', 'Eén hub (netwerk)'], ['balance', 'Mens en AI (balans)']]), 'De tekening beweegt mee met het scrollen.')),
      checkInput(b, 'reverse', 'Tekening rechts in plaats van links'),
      richText(b, 'html', { minHeight: 200 }),
    ],
  },
  photo: {
    label: 'Foto paginabreed',
    make: () => ({ type: 'photo', src: '', alt: '' }),
    summary: (b) => b.src.split('/').pop(),
    form: (b) => [imageField(b, 'src', { altKey: 'alt', label: 'Foto' })],
  },
  faq: {
    label: 'Veelgestelde vragen',
    make: () => ({ type: 'faq', heading: 'Veelgestelde vragen', items: [{ q: 'Eerste vraag?', a: 'Het antwoord.' }], buttonLabel: 'Plan een demo', buttonUrl: '/contact' }),
    summary: (b) => `${b.items.length} vragen`,
    form: (b) => [
      field('Kop', textInput(b, 'heading', { max: 120 })),
      repeater(b.items, () => ({ q: '', a: '' }), (it) => [field('Vraag', textInput(it, 'q', { max: 200 })), field('Antwoord', areaInput(it, 'a', { rows: 4, max: 2000 }))], '+ Vraag toevoegen'),
      h('div', { class: 'grid2' }, field('Knoptekst', textInput(b, 'buttonLabel', { max: 60 })), field('Knop-link', textInput(b, 'buttonUrl'))),
    ],
  },
  stories: {
    label: 'Optiek Stories (rail)',
    make: () => ({ type: 'stories', heading: 'Optiek Stories', buttonLabel: 'Alle stories', buttonUrl: '/klantverhalen' }),
    summary: (b) => b.heading,
    form: (b) => [
      h('p', { class: 'muted small' }, 'Toont automatisch de nieuwste klantverhalen als zijwaarts schuivende rij. Verhalen beheer je onder “Klantverhalen”.'),
      field('Kop', textInput(b, 'heading', { max: 120 })),
      h('div', { class: 'grid2' }, field('Knoptekst', textInput(b, 'buttonLabel', { max: 60 })), field('Knop-link', textInput(b, 'buttonUrl'))),
    ],
  },
  list: {
    label: 'Lijst met artikelen',
    make: () => ({ type: 'list', collection: 'posts', heading: 'Alle artikelen', emptyText: 'Nog niets gepubliceerd.' }),
    summary: (b) => (b.collection === 'stories' ? 'Klantverhalen' : 'Nieuwsberichten'),
    form: (b) => [
      field('Wat tonen?', selectInput(b, 'collection', [['posts', 'Nieuwsberichten'], ['stories', 'Klantverhalen']])),
      field('Verborgen kop (voor schermlezers)', textInput(b, 'heading', { max: 120 })),
      field('Tekst als er nog niets is', textInput(b, 'emptyText', { max: 200 })),
    ],
  },
  team: {
    label: 'Team',
    make: () => ({ type: 'team', heading: 'Ontmoet ons team', intro: '', members: [{ name: '', role: '', phone: '', email: '', linkedin: '', photo: '', alt: '' }] }),
    summary: (b) => `${b.members.length} personen`,
    form: (b) => [
      h('div', { class: 'grid2' }, field('Kop', textInput(b, 'heading', { max: 120 })), field('Regel eronder', textInput(b, 'intro', { max: 300 }))),
      repeater(b.members, () => ({ name: '', role: '', phone: '', email: '', linkedin: '', photo: '', alt: '' }), (m) => [
        imageField(m, 'photo', { altKey: 'alt', label: 'Foto' }),
        h('div', { class: 'grid2' }, field('Naam', textInput(m, 'name', { max: 80 })), field('Functie', textInput(m, 'role', { max: 120 })),
          field('Telefoon', textInput(m, 'phone', { max: 40 })), field('E-mail', textInput(m, 'email', { type: 'email', max: 150 }))),
        field('LinkedIn-link', textInput(m, 'linkedin', { placeholder: 'https://www.linkedin.com/in/…' })),
      ], '+ Teamlid toevoegen'),
    ],
  },
  steps: {
    label: 'Stappen',
    make: () => ({ type: 'steps', variant: 'klei', heading: 'Hoe gaan we te werk?', intro: '', steps: [{ title: 'Eerste stap', text: '' }] }),
    summary: (b) => `${b.steps.length} stappen`,
    form: (b) => [
      h('div', { class: 'grid2' }, field('Achtergrond', selectInput(b, 'variant', VARIANTS)), field('Kop', textInput(b, 'heading', { max: 120 }))),
      field('Inleiding', areaInput(b, 'intro', { max: 400 })),
      repeater(b.steps, () => ({ title: '', text: '' }), (s) => [field('Titel (het nummer komt er vanzelf voor)', textInput(s, 'title', { max: 120 })), field('Uitleg', areaInput(s, 'text', { rows: 4, max: 800 }))], '+ Stap toevoegen'),
    ],
  },
  contact: {
    label: 'Contactformulier',
    make: () => ({ type: 'contact', heading: 'Plan een kennismaking', lead: '', formTitle: 'Stuur een bericht', directTitle: 'Direct contact', directHtml: '<p><a href="mailto:info@voorbeeld.nl">info@voorbeeld.nl</a></p>' }),
    summary: (b) => b.heading,
    form: (b) => [
      h('p', { class: 'muted small' }, 'Berichten komen in de Inbox terecht (en per e-mail als dat is ingesteld).'),
      field('Kop', textInput(b, 'heading', { max: 120 })),
      field('Inleiding', areaInput(b, 'lead', { max: 400 })),
      h('div', { class: 'grid2' }, field('Titel boven het formulier', textInput(b, 'formTitle', { max: 80 })), field('Titel directe contactgegevens', textInput(b, 'directTitle', { max: 80 }))),
      field('Directe contactgegevens', richText(b, 'directHtml', { minHeight: 120 })),
    ],
  },
  cta: {
    label: 'Zwarte oproepband',
    make: () => ({ type: 'cta', eyebrow: 'Own your spotlight', heading: 'Kop met de belangrijkste boodschap', html: '<p>Korte tekst.</p><p><a class="btn btn--outline" href="/contact">Plan een kennismaking</a></p>', lockup: false }),
    summary: (b) => b.heading,
    form: (b) => [
      field('Kleine regel boven de kop', textInput(b, 'eyebrow', { max: 80 })),
      field('Kop', textInput(b, 'heading', { max: 200 })),
      richText(b, 'html', { minHeight: 140 }),
      checkInput(b, 'lockup', 'Toon het logo onderaan'),
    ],
  },
};

/** The block list editor: returns an element that edits `blocks` in place. */
export function blockEditor(blocks, open = new Set()) {
  const root = h('div');
  const move = (i, d) => { [blocks[i + d], blocks[i]] = [blocks[i], blocks[i + d]]; dirty.mark(); draw(); };
  const draw = () => {
    root.replaceChildren(
      ...blocks.map((b, i) => {
        const def = BLOCKS[b.type];
        if (!def) return h('div', { class: 'notice warn' }, `Onbekend blok: ${b.type}`);
        const id = b.id || (b.id = Math.random().toString(16).slice(2, 10));
        const isOpen = open.has(id);
        const body = h('div', { class: 'bb' }, def.form(b));
        const card = h('div', { class: 'block' + (isOpen ? '' : ' closed') },
          h('div', { class: 'bh', onclick: (e) => { if (e.target.closest('button')) return; open.has(id) ? open.delete(id) : open.add(id); card.classList.toggle('closed'); sum.textContent = def.summary(b); } },
            h('span', { class: 't' }, def.label),
            h('span', { class: 's' }, def.summary(b)),
            h('button', { type: 'button', class: 'iconbtn', title: 'Omhoog', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
            h('button', { type: 'button', class: 'iconbtn', title: 'Omlaag', disabled: i === blocks.length - 1, onclick: () => move(i, 1) }, '↓'),
            h('button', { type: 'button', class: 'iconbtn', title: 'Dupliceren', onclick: () => { const c = JSON.parse(JSON.stringify(b)); c.id = ''; blocks.splice(i + 1, 0, c); dirty.mark(); draw(); } }, '⧉'),
            h('button', { type: 'button', class: 'iconbtn', title: 'Verwijderen', onclick: () => { if (confirm('Dit blok verwijderen?')) { blocks.splice(i, 1); dirty.mark(); draw(); } } }, '✕')),
          body);
        const sum = card.querySelector('.s');
        return card;
      }),
      h('div', { class: 'card' }, h('h3', {}, 'Blok toevoegen'),
        h('div', { class: 'addmenu' }, Object.entries(BLOCKS).map(([type, def]) => h('button', { type: 'button', class: 'btn ghost small', onclick: () => {
          const nb = def.make();
          nb.id = Math.random().toString(16).slice(2, 10);
          blocks.push(nb);
          open.add(nb.id);
          dirty.mark();
          draw();
          root.querySelector('.block:last-of-type')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } }, '+ ' + def.label))))
    );
  };
  draw();
  return root;
}
