// One-off: turns the original hand-written pages (legacy-static/) into the CMS
// seed content (content-seed/). Re-runnable; the seed is only used to fill an
// empty store on first start.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { cleanHtml } from '../lib/sanitize.js';

const SRC = 'legacy-static';
const OUT = 'content-seed';
for (const d of ['pages', 'posts', 'stories']) mkdirSync(`${OUT}/${d}`, { recursive: true });

const txt = (el) => (el ? el.text.replace(/\s+/g, ' ').trim() : '');
const attr = (el, a) => (el ? el.getAttribute(a) || '' : '');
const inner = (el) => (el ? el.innerHTML.trim() : '');
const els = (n) => n.childNodes.filter((c) => c.nodeType === 1);

function meta(root, name, prop = 'name') {
  return attr(root.querySelector(`meta[${prop}="${name}"]`), 'content');
}

function seoOf(root) {
  const title = txt(root.querySelector('title'));
  return {
    title: title === 'The Finest Impact' ? '' : title.replace(/\s*[—|-]\s*The Finest Impact$/, ''),
    description: meta(root, 'description'),
    image: meta(root, 'og:image', 'property').replace('https://finest-website.vercel.app', ''),
  };
}

function cleanLegacy(html) {
  return cleanHtml(
    html
      .replace(/<div class="notice">([\s\S]*?)<\/div>/g, '<p class="notice">$1</p>')
      .replace(/in de WordPress-versie vul je ze in via Instellingen → Algemeen/g, 'vul ze in door deze tekst aan te passen in het CMS')
  );
}

function faqFromScript(src) {
  const m = src.match(/var FAQ = (\[[\s\S]*?\]);\s*var list/);
  if (!m) return [];
  return JSON.parse(m[1]).map(([q, a]) => ({ q, a }));
}

function blocksFromMain(main, fullSource) {
  const blocks = [];
  for (const el of els(main)) {
    const cls = (el.getAttribute('class') || '').split(/\s+/);
    if (el.tagName === 'DIV' && cls.includes('photo-break')) {
      const img = el.querySelector('img');
      blocks.push({ type: 'photo', src: attr(img, 'src'), alt: attr(img, 'alt') });
      continue;
    }
    if (el.tagName === 'ARTICLE' || el.tagName === 'DIV') continue;
    if (cls.includes('hero')) {
      const c = el.querySelector('.hero__content');
      const a = c.querySelector('a.btn');
      blocks.push({
        type: 'hero',
        image: attr(el.querySelector('.hero__media'), 'src'),
        alt: attr(el.querySelector('.hero__media'), 'alt'),
        eyebrow: txt(c.querySelector('.eyebrow')),
        title: txt(c.querySelector('h1')),
        lead: txt(c.querySelector('p.lead')),
        buttonLabel: txt(a),
        buttonUrl: attr(a, 'href'),
      });
      continue;
    }
    if (cls.includes('stories')) {
      blocks.push({
        type: 'stories',
        heading: txt(el.querySelector('h2')),
        buttonLabel: txt(el.querySelector('a.btn')),
        buttonUrl: attr(el.querySelector('a.btn'), 'href'),
      });
      continue;
    }
    if (cls.includes('news-list')) {
      blocks.push({ type: 'list', collection: 'posts', heading: 'Alle artikelen', emptyText: 'Nog geen artikelen gepubliceerd.' });
      continue;
    }
    const variant = cls.includes('section--dark') ? 'dark' : cls.includes('section--klei') ? 'klei' : 'default';
    if (el.querySelector('.explainer-grid')) {
      const grid = el.querySelector('.explainer-grid');
      blocks.push({
        type: 'explainer',
        variant,
        reverse: (grid.getAttribute('class') || '').includes('--reverse'),
        scene: attr(el.querySelector('.explainer-canvas'), 'data-scene'),
        html: cleanLegacy(inner(grid.querySelector('.wrap--narrow'))),
      });
      continue;
    }
    if (el.querySelector('#faq-list')) {
      const a = el.querySelector('a.btn');
      blocks.push({
        type: 'faq',
        heading: txt(el.querySelector('h2')),
        items: faqFromScript(fullSource),
        buttonLabel: txt(a),
        buttonUrl: attr(a, 'href'),
      });
      continue;
    }
    if (el.querySelector('.team-grid')) {
      blocks.push({
        type: 'team',
        heading: txt(el.querySelector('h2')),
        intro: txt(el.querySelector('.wrap > p')),
        members: el.querySelectorAll('.team-card').map((c) => {
          const lines = c.querySelectorAll('p');
          const links = c.querySelectorAll('a');
          const phone = lines[1].childNodes.find((n) => n.nodeType === 3);
          return {
            name: txt(c.querySelector('h3')),
            role: txt(lines[0]),
            phone: phone ? phone.text.trim() : '',
            email: (attr(links[0], 'href') || '').replace('mailto:', ''),
            linkedin: attr(links[1], 'href'),
            photo: attr(c.querySelector('img'), 'src'),
            alt: attr(c.querySelector('img'), 'alt'),
          };
        }),
      });
      continue;
    }
    if (el.querySelector('.steps')) {
      blocks.push({
        type: 'steps',
        variant,
        heading: txt(el.querySelector('h2')),
        intro: txt(el.querySelector('.wrap > p')),
        steps: el.querySelectorAll('.step').map((s) => ({ title: txt(s.querySelector('h3')).replace(/^\d+\.\s*/, ''), text: txt(s.querySelector('p')) })),
      });
      continue;
    }
    if (el.querySelector('.contact-grid')) {
      const cols = els(el.querySelector('.contact-grid'));
      blocks.push({
        type: 'contact',
        heading: txt(el.querySelector('h1')),
        lead: txt(el.querySelector('p.lead')),
        formTitle: txt(cols[0].querySelector('h2')),
        directTitle: txt(cols[1].querySelector('h2')),
        directHtml: cleanLegacy(els(cols[1]).filter((c) => c.tagName !== 'H2').map((c) => c.outerHTML).join('\n')),
      });
      continue;
    }
    if (el.querySelector('.logo-lockup')) {
      const w = els(el).find((c) => (c.getAttribute('class') || '').includes('wrap'));
      const rest = w.clone();
      rest.querySelectorAll('.eyebrow, h2, .logo-lockup').forEach((n) => n.remove());
      blocks.push({ type: 'cta', eyebrow: txt(w.querySelector('.eyebrow')), heading: txt(w.querySelector('h2')), html: cleanLegacy(inner(rest)), lockup: true });
      continue;
    }
    // generic text section
    const wrap = els(el).find((c) => (c.getAttribute('class') || '').includes('wrap'));
    const narrow = (wrap.getAttribute('class') || '').includes('wrap--narrow');
    let html = inner(wrap);
    if (html.includes('In de WordPress-versie is dit een automatische lijst')) {
      html = html.replace(/<div class="notice">[\s\S]*?<\/div>/, '');
      blocks.push({ type: 'section', variant, narrow, html: cleanLegacy(html) });
      blocks.push({ type: 'list', collection: 'stories', heading: 'Alle klantverhalen', emptyText: 'Nog geen klantverhalen gepubliceerd.' });
      continue;
    }
    blocks.push({ type: 'section', variant, narrow, html: cleanLegacy(html) });
  }
  return blocks;
}

const PAGES = {
  'index.html': ['home', 'Home'],
  'diensten.html': ['diensten', 'Diensten'],
  'over-ons.html': ['over-ons', 'Over ons'],
  'contact.html': ['contact', 'Contact'],
  'klantverhalen.html': ['klantverhalen', 'Klantverhalen'],
  'nieuws.html': ['nieuws', 'Nieuws'],
  'privacyverklaring.html': ['privacyverklaring', 'Privacyverklaring'],
  'algemene-voorwaarden.html': ['algemene-voorwaarden', 'Algemene voorwaarden'],
};
const stamp = '2026-08-06T09:00:00.000Z';
for (const [file, [slug, title]] of Object.entries(PAGES)) {
  const src = readFileSync(`${SRC}/${file}`, 'utf8');
  const root = parse(src);
  const doc = {
    type: 'page',
    slug,
    title,
    status: 'published',
    seo: seoOf(root),
    blocks: blocksFromMain(root.querySelector('main'), src),
    createdAt: stamp,
    updatedAt: stamp,
  };
  writeFileSync(`${OUT}/pages/${slug}.json`, JSON.stringify(doc, null, 2));
  console.log('page', slug, doc.blocks.map((b) => b.type).join(','));
}

// News articles
const cardImages = {};
{
  const root = parse(readFileSync(`${SRC}/nieuws.html`, 'utf8'));
  for (const c of root.querySelectorAll('article.news-card')) {
    cardImages[attr(c.querySelector('a'), 'href').replace('/nieuws/', '')] = attr(c.querySelector('img'), 'src');
  }
}
for (const f of readdirSync(`${SRC}/nieuws`)) {
  const slug = f.replace(/\.html$/, '');
  const src = readFileSync(`${SRC}/nieuws/${f}`, 'utf8');
  const root = parse(src);
  const ld = JSON.parse(root.querySelector('script[type="application/ld+json"]').text);
  const art = ld['@graph'].find((g) => g['@type'] === 'BlogPosting');
  const body = root.querySelector('.news-article__body');
  body.querySelectorAll('.news-cta, .news-back').forEach((n) => n.remove());
  const byline = txt(root.querySelector('.news-byline')).replace(/^Door\s*/, '').split('·')[0].trim();
  const doc = {
    type: 'post',
    slug,
    title: txt(root.querySelector('h1')),
    status: 'published',
    excerpt: meta(root, 'description'),
    category: txt(root.querySelector('.news-article__intro .eyebrow')),
    author: byline,
    date: art.datePublished,
    image: { src: attr(root.querySelector('.news-hero img'), 'src'), card: cardImages[slug] || '', alt: attr(root.querySelector('.news-hero img'), 'alt') },
    html: cleanLegacy(inner(body)),
    seo: { title: '', description: meta(root, 'description'), image: meta(root, 'og:image', 'property').replace('https://finest-website.vercel.app', '') },
    createdAt: art.datePublished,
    updatedAt: art.dateModified || art.datePublished,
  };
  writeFileSync(`${OUT}/posts/${slug}.json`, JSON.stringify(doc, null, 2));
  console.log('post', slug, doc.date.slice(0, 10), doc.category);
}

// Optiek Stories: the four cards of the demo, as real (editable) stories
const stories = [
  ['zo-breng-je-een-nieuwe-collectie-in-drie-weken-onder-de-aandacht', 'Zo breng je een nieuwe collectie in drie weken onder de aandacht', 'Collecties', 'Karin Boon', '/assets/img/photo-1.jpg'],
  ['van-losse-posts-naar-een-lijn', 'Van losse posts naar één lijn: hoe een optiekketen zijn marketing ordende', 'Interview', 'The Finest Impact', '/assets/img/photo-2.jpg'],
  ['wat-klanten-aan-ai-vragen-als-ze-een-opticien-zoeken', 'Wat klanten aan AI vragen als ze een opticien zoeken', 'Zichtbaarheid', 'The Finest Impact', '/assets/img/photo-1.jpg'],
  ['oogzorg-vertellen-zonder-te-verkopen', 'Oogzorg vertellen zonder te verkopen: vijf formules die werken', 'Oogzorg', 'Karin Boon', '/assets/img/photo-2.jpg'],
];
stories.forEach(([slug, title, category, author, img], i) => {
  const date = `2026-08-0${4 - i}T09:00:00.000Z`;
  writeFileSync(
    `${OUT}/stories/${slug}.json`,
    JSON.stringify(
      {
        type: 'story',
        slug,
        title,
        status: 'published',
        excerpt: 'Dit verhaal volgt binnenkort.',
        category,
        author,
        date,
        image: { src: img, card: '', alt: '' },
        html: '<p>Dit verhaal volgt binnenkort. Pas deze tekst aan of verwijder het verhaal in het CMS.</p>',
        seo: { title: '', description: '', image: '' },
        createdAt: date,
        updatedAt: date,
      },
      null,
      2
    )
  );
});
console.log('stories', stories.length);
