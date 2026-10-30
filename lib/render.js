// HTML for the public site. The markup mirrors the original hand-written pages
// one-to-one so assets/css/style.css and the motion scripts keep working.
import { esc, dateNl, dateIso } from './util.js';
import { WA_ICON } from './icons.js';

const variantClass = (v) => (v === 'dark' ? ' section--dark' : v === 'klei' ? ' section--klei' : '');
const attrUrl = (u) => esc(u || '#');
const abs = (s, p) => (/^https?:/.test(p || '') ? p : `${s.siteUrl || ''}${p || ''}`);

// ---------- cards ----------
export function newsCard(p, loading = 'lazy', headingTag = 'h2', base = '/nieuws') {
  const src = p.image?.card || p.image?.src || '';
  const href = `${base}/${esc(p.slug)}`;
  return `<article class="news-card">
  <a class="news-card__media" href="${href}" tabindex="-1" aria-hidden="true">${src ? `<img src="${esc(src)}" alt="" width="640" height="800" loading="${loading}" decoding="async">` : ''}</a>
  <p class="news-card__cat">${esc(p.category)}</p>
  <${headingTag} class="news-card__title"><a href="${href}">${esc(p.title)}</a></${headingTag}>
  <p class="news-card__excerpt">${esc(p.excerpt)}</p>
  <p class="news-card__date"><time datetime="${dateIso(p.date)}">${dateNl(p.date)}</time></p>
</article>`;
}

function storyCard(p) {
  const src = p.image?.card || p.image?.src || '';
  return `<a class="story-card" href="/klantverhalen/${esc(p.slug)}">
          <div class="story-card__media">${src ? `<img class="fi-reveal" src="${esc(src)}" alt="">` : ''}</div>
          <p class="story-card__cat">${esc(p.category)}</p>
          <h3>${esc(p.title)}</h3>
          <p class="story-card__by">${esc(p.author)}</p>
        </a>`;
}

const btn = (label, url, outline) => (label && url ? `<a class="btn${outline ? ' btn--outline' : ''}" href="${attrUrl(url)}">${esc(label)}</a>` : '');

// ---------- blocks ----------
function renderBlock(b, ctx) {
  switch (b.type) {
    case 'hero':
      return `<section class="hero">
  ${b.image ? `<img class="hero__media" src="${esc(b.image)}" alt="${esc(b.alt)}">` : ''}
  <div class="hero__dim"></div>
  <div class="hero__content">
    ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ''}
    <h1 class="fi-reveal-lines">${esc(b.title)}</h1>
    ${b.lead ? `<p class="lead" style="margin-bottom:12px;">${esc(b.lead)}</p>` : ''}
    ${b.buttonLabel ? `<a class="btn" href="${attrUrl(b.buttonUrl)}" style="margin-top:12px;">${esc(b.buttonLabel)}</a>` : ''}
  </div>
</section>`;
    case 'section':
      return `<section class="section section--lg${variantClass(b.variant)}">
  <div class="wrap${b.narrow ? ' wrap--narrow' : ''}">
    ${b.html}
  </div>
</section>`;
    case 'explainer':
      return `<section class="section section--lg${variantClass(b.variant)}">
  <div class="wrap explainer-grid${b.reverse ? ' explainer-grid--reverse' : ''}">
    <div class="explainer-canvas" data-scene="${esc(b.scene)}" aria-hidden="true"><canvas></canvas></div>
    <div class="wrap--narrow">
      ${b.html}
    </div>
  </div>
</section>`;
    case 'photo':
      return `<div class="photo-break">
  <img class="fi-reveal" src="${esc(b.src)}" alt="${esc(b.alt)}">
</div>`;
    case 'faq':
      return `<section class="section section--lg">
  <div class="wrap wrap--narrow">
    <h2>${esc(b.heading)}</h2>
    <div id="faq-list">${b.items.map((i) => `<details class="faq-row"><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</div>
    ${b.buttonLabel ? `<a class="btn" href="${attrUrl(b.buttonUrl)}" style="margin-top:8px;">${esc(b.buttonLabel)}</a>` : ''}
  </div>
</section>`;
    case 'stories': {
      const items = ctx.lists.stories.slice(0, 8);
      return `<section class="stories">
  <div class="wrap">
    <div class="stories__head">
      <h2 style="margin:0;">${esc(b.heading)}</h2>
      ${btn(b.buttonLabel, b.buttonUrl, true)}
    </div>
  </div>
  ${
    items.length
      ? `<div class="stories-pin">
    <div class="wrap">
      <div class="stories-track">
        ${items.map(storyCard).join('\n        ')}
      </div>
      <div class="stories-progress" aria-hidden="true">
        ${items.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ''}></span>`).join('')}
      </div>
    </div>
  </div>`
      : '<div class="wrap"><p>Nog geen klantverhalen gepubliceerd.</p></div>'
  }
</section>`;
    }
    case 'list': {
      const items = ctx.lists[b.collection] || [];
      const base = b.collection === 'stories' ? '/klantverhalen' : '/nieuws';
      return `<section class="section news-list" aria-labelledby="news-list-title">
  <div class="wrap">
    <h2 id="news-list-title" class="visually-hidden">${esc(b.heading || 'Alle items')}</h2>
    ${items.length ? `<div class="news-grid">\n${items.map((p, i) => newsCard(p, i < 3 ? 'eager' : 'lazy', 'h2', base)).join('\n')}\n    </div>` : `<p>${esc(b.emptyText || 'Nog niets gepubliceerd.')}</p>`}
  </div>
</section>`;
    }
    case 'team':
      return `<section class="section section--lg">
  <div class="wrap">
    <h2>${esc(b.heading)}</h2>
    ${b.intro ? `<p>${esc(b.intro)}</p>` : ''}
    <div class="team-grid">
      ${b.members
        .map(
          (m) => `<div class="team-card">
        ${m.photo ? `<img class="team-card__photo" src="${esc(m.photo)}" alt="${esc(m.alt || m.name)}">` : ''}
        <h3>${esc(m.name)}</h3>
        <p>${esc(m.role)}</p>
        <p>${[m.phone ? esc(m.phone) : '', m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : '', m.linkedin ? `<a href="${esc(m.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''].filter(Boolean).join('<br>')}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    case 'steps':
      return `<section class="section section--lg${variantClass(b.variant)}">
  <div class="wrap">
    <h2>${esc(b.heading)}</h2>
    ${b.intro ? `<p style="max-width:640px;">${esc(b.intro)}</p>` : ''}
    <div class="steps">
      ${b.steps.map((s, i) => `<div class="step">\n        <h3>${i + 1}. ${esc(s.title)}</h3>\n        <p>${esc(s.text)}</p>\n      </div>`).join('\n      ')}
    </div>
  </div>
</section>`;
    case 'contact': {
      const wa = ctx.settings.whatsapp || {};
      const waLink = wa.number ? `https://wa.me/${esc(wa.number)}?text=${encodeURIComponent(wa.message || '')}` : '';
      return `<section class="section section--lg">
  <div class="wrap">
    <h1 class="fi-reveal-lines">${esc(b.heading)}</h1>
    ${b.lead ? `<p class="lead" style="max-width:640px;">${esc(b.lead)}</p>` : ''}
    <div class="contact-grid">
      <div>
        <h2 class="tfi-label-h2">${esc(b.formTitle)}</h2>
        <div class="tfi-form-wrap">
          <form class="tfi-form" id="contact-form" novalidate data-status="init" data-endpoint="/api/contact" aria-label="Contactformulier">
            <div class="tfi-fields">
              <div class="tfi-field"><label for="tfi-name">Naam</label><span class="wpcf7-form-control-wrap"><input class="tfi-input" id="tfi-name" name="name" type="text" autocomplete="name" maxlength="100" placeholder="Je naam" required></span></div>
              <div class="tfi-field"><label for="tfi-email">E-mailadres</label><span class="wpcf7-form-control-wrap"><input class="tfi-input" id="tfi-email" name="email" type="email" autocomplete="email" maxlength="150" placeholder="jij@voorbeeld.nl" required></span></div>
              <div class="tfi-field"><label for="tfi-company">Bedrijfsnaam <span class="tfi-optional">(optioneel)</span></label><span class="wpcf7-form-control-wrap"><input class="tfi-input" id="tfi-company" name="company" type="text" autocomplete="organization" maxlength="120" placeholder="Naam van je winkel"></span></div>
              <div class="tfi-field"><label for="tfi-message">Bericht</label><span class="wpcf7-form-control-wrap"><textarea class="tfi-input" id="tfi-message" name="message" rows="4" minlength="5" maxlength="3000" placeholder="Waar wil je meer over weten?" required></textarea></span></div>
              <div class="tfi-hp" aria-hidden="true" style="position:absolute;left:-9999px;"><label>Laat dit veld leeg <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
              <div class="tfi-consent"><span class="wpcf7-form-control-wrap"><label><input type="checkbox" id="tfi-consent" name="consent" value="1"> <span>Ik ga ermee akkoord dat ${esc(ctx.settings.siteName)} mijn gegevens gebruikt om op mijn bericht te reageren. Lees de <a href="/privacyverklaring">privacyverklaring</a>.</span></label></span></div>
              <div class="tfi-actions"><button type="submit" class="tfi-btn"><span class="tfi-btn__label">Verstuur bericht</span><span class="tfi-btn__busy" aria-hidden="true">Versturen&hellip;</span><span class="tfi-btn__arrow" aria-hidden="true">&rarr;</span><span class="tfi-btn__spinner" aria-hidden="true"></span></button></div>
            </div>
            <div class="tfi-success" tabindex="-1"><svg class="tfi-check" viewBox="0 0 52 52" width="56" height="56" focusable="false" aria-hidden="true"><circle class="tfi-check__ring" cx="26" cy="26" r="24"/><path class="tfi-check__tick" d="M15 27l8 8 14-17"/></svg><p class="tfi-success__title">Bedankt, we hebben het gezien</p><p class="tfi-demo-note">We nemen zo snel mogelijk contact met je op.</p><a class="tfi-again" href="/contact">Nog een bericht sturen</a></div>
            <div class="wpcf7-response-output" role="alert" tabindex="-1"></div>
          </form>
          ${waLink ? `<p class="tfi-alt">Liever appen? <a href="${waLink}" target="_blank" rel="noopener noreferrer">Chat via WhatsApp<span class="visually-hidden"> (opent in een nieuw tabblad)</span></a></p>` : ''}
        </div>
      </div>
      <div>
        <h2 class="tfi-label-h2">${esc(b.directTitle)}</h2>
        ${b.directHtml}
      </div>
    </div>
  </div>
</section>`;
    }
    case 'cta':
      return `<section class="section section--lg section--dark">
  <div class="wrap wrap--narrow">
    ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ''}
    <h2>${esc(b.heading)}</h2>
    ${b.html}
    ${b.lockup ? `<div class="logo-lockup logo-lockup--footer" style="margin-top:48px;color:var(--linnen);" aria-hidden="true">\n      <span class="ll-the">the</span><span class="ll-finest">finest</span><span class="ll-impact">impact</span>\n    </div>` : ''}
  </div>
</section>`;
    default:
      return '';
  }
}

// ---------- shell ----------
function header(ctx) {
  const s = ctx.settings;
  const cur = ctx.path;
  const link = (l, extra = '') => {
    const on = l.url === cur || (l.url !== '/' && cur.startsWith(l.url + '/'));
    return `<a href="${attrUrl(l.url)}"${on ? ' aria-current="page"' : ''}${extra}>${esc(l.label)}</a>`;
  };
  const loginTitle = !s.loginUrl || s.loginUrl === '#' ? ' title="Nog geen platform-URL bekend"' : '';
  const login = `<a class="nav-login" href="${attrUrl(s.loginUrl)}"${loginTitle}>Inloggen</a>`;
  return `<header class="site-header">
  <a class="wordmark" href="/">${esc(s.wordmark || s.siteName.toLowerCase())}</a>
  <nav class="nav-desktop" aria-label="Hoofdmenu">
    ${(s.menu || []).map((l) => link(l)).join('\n    ')}
    ${login}
  </nav>
  <button class="nav-toggle" aria-label="Menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</header>

<div class="nav-overlay" id="nav-overlay">
  <ul>
    <li><a href="/"${cur === '/' ? ' aria-current="page"' : ''}>Home</a></li>
    ${(s.menu || []).map((l) => `<li>${link(l)}</li>`).join('\n    ')}
  </ul>
  ${login}
</div>`;
}

function footer(ctx) {
  const s = ctx.settings;
  const f = s.footer || {};
  const links = (arr) => (arr || []).map((l) => `<a href="${attrUrl(l.url)}">${esc(l.label)}</a>`).join('<br>');
  const year = new Date().getUTCFullYear();
  return `<footer class="site-footer">
  <div class="wrap">
    <div>
      <a class="logo-lockup logo-lockup--footer" href="/" aria-label="${esc(s.wordmark || s.siteName)}" style="color:var(--linnen);text-decoration:none;">
        <span class="ll-the">the</span><span class="ll-finest">finest</span><span class="ll-impact">impact</span>
      </a>
      <p style="font-size:14px;margin-top:12px;opacity:0.8;">${esc(s.tagline)}</p>
    </div>
    <div>
      <h3>Platform</h3>
      <p style="font-size:14px;">${links(f.platform)}</p>
    </div>
    <div>
      <h3>Contact</h3>
      <p style="font-size:14px;">${s.contact?.email ? `<a href="mailto:${esc(s.contact.email)}">${esc(s.contact.email)}</a>` : ''}</p>
      <p style="font-size:14px;">${links(f.legal)}</p>
    </div>
  </div>
  <div class="wrap">
    <hr>
    <p class="label">© ${year} ${esc(s.siteName)}. Alle rechten voorbehouden.${f.note ? ' — ' + esc(f.note) : ''}</p>
  </div>
</footer>`;
}

function ctaBar(ctx) {
  const wa = ctx.settings.whatsapp || {};
  return `<aside class="finest-cta-bar" id="finest-cta-bar" aria-label="Contact opnemen">
  <div class="finest-cta-bar__inner">
    <a class="finest-cta-btn finest-cta-btn--primary" href="/contact">Neem contact op</a>
    ${
      wa.number
        ? `<a class="finest-cta-btn finest-cta-btn--wa" href="https://wa.me/${esc(wa.number)}?text=${encodeURIComponent(wa.message || '')}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opent in een nieuw tabblad)">
      ${WA_ICON}
      <span>WhatsApp</span>
    </a>`
        : ''
    }
  </div>
</aside>`;
}

export function layout(ctx, { title, description, image, canonicalPath, ogType = 'website', jsonld, noindex, body, hasContactForm }) {
  const s = ctx.settings;
  const site = s.siteUrl || '';
  const fullTitle = canonicalPath === '/' ? title : `${title} — ${s.siteName}`;
  const desc = description || s.defaultSeo?.description || '';
  const og = abs(s, image || s.defaultSeo?.image || '');
  const url = `${site}${canonicalPath === '/' ? '/' : canonicalPath}`;
  const motion = { ...(s.motion || {}) };
  const reduced = motion.animations === false;
  return `<!doctype html>
<html lang="nl"${reduced ? ' class="reduced-motion"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
${noindex || ctx.preview ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(s.siteName)}">
<meta property="og:locale" content="nl_NL">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(fullTitle)}">
${desc ? `<meta property="og:description" content="${esc(desc)}">` : ''}
${og ? `<meta property="og:image" content="${esc(og)}">\n<meta name="twitter:image" content="${esc(og)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
${desc ? `<meta name="twitter:description" content="${esc(desc)}">` : ''}
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" type="application/rss+xml" title="${esc(s.siteName)} — nieuws" href="/feed.xml">
${jsonld ? `<script type="application/ld+json">\n${JSON.stringify(jsonld).replace(/</g, '\\u003c')}\n</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&family=Jost:wght@200;300;400;500&display=swap">
<link rel="stylesheet" href="/assets/css/style.css">
<script>window.FINEST_MOTION=${JSON.stringify(motion).replace(/</g, '\\u003c')};</script>
<script src="/assets/js/nav.js"></script>
</head>
<body>

${header(ctx)}

<main>

${body}

</main>

${footer(ctx)}

<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script src="/assets/js/motion.js"></script>
<script src="/assets/js/explainers.js"></script>
${hasContactForm ? '<script src="/assets/js/contact-form.js"></script>' : ''}

${ctaBar(ctx)}
<script src="/assets/js/cta-bar.js"></script>

</body>
</html>`;
}

// ---------- page types ----------
export function renderPage(doc, ctx) {
  const s = ctx.settings;
  const body = doc.blocks.map((b) => renderBlock(b, ctx)).join('\n\n');
  const isHome = doc.slug === 'home';
  const path = isHome ? '/' : `/${doc.slug}`;
  return layout(ctx, {
    title: doc.seo?.title || doc.title,
    description: doc.seo?.description,
    image: doc.seo?.image,
    canonicalPath: path,
    noindex: doc.seo?.noindex || doc.status === 'draft',
    hasContactForm: doc.blocks.some((b) => b.type === 'contact'),
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: s.siteName,
      url: `${s.siteUrl}/`,
      image: abs(s, s.defaultSeo?.image),
      description: s.defaultSeo?.description,
      areaServed: 'NL',
      serviceType: 'Marketing voor opticiens',
    },
    body,
  });
}

/** Article page for a post (/nieuws/x) or story (/klantverhalen/x). */
export function renderArticle(doc, ctx, kind = 'posts') {
  const s = ctx.settings;
  const base = kind === 'stories' ? '/klantverhalen' : '/nieuws';
  const listName = kind === 'stories' ? 'Klantverhalen' : 'Nieuws';
  const listTitle = kind === 'stories' ? 'Klantverhalen' : 'The Finest News';
  const path = `${base}/${doc.slug}`;
  const related = (ctx.lists[kind] || []).filter((p) => p.slug !== doc.slug).slice(0, 3);
  const heroSrc = doc.image?.src || '';
  const body = `<article class="news-article">
  <header class="news-article__intro wrap wrap--narrow">
    <nav class="news-breadcrumb" aria-label="Kruimelpad"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="${base}">${listName}</a></nav>
    <p class="eyebrow">${esc(doc.category)}</p>
    <h1 class="fi-reveal-lines">${esc(doc.title)}</h1>
    <p class="news-byline">Door ${esc(doc.author || s.siteName)} <span aria-hidden="true">·</span> <time datetime="${dateIso(doc.date)}">${dateNl(doc.date)}</time></p>
  </header>
  ${heroSrc ? `<figure class="news-hero"><img src="${esc(heroSrc)}" alt="${esc(doc.image?.alt)}" width="1024" height="576" fetchpriority="high" decoding="async"></figure>` : ''}
  <div class="news-article__body wrap wrap--narrow">
${doc.html}
<div class="news-cta">
  <p><strong>Benieuwd wat dit voor jouw winkel betekent?</strong></p>
  <a class="btn" href="/contact">Neem contact op</a>
</div>
<p class="news-back"><a href="${base}">← Terug naar ${listTitle}</a></p>
  </div>
</article>
${
  related.length
    ? `
<section class="section section--klei news-more" aria-labelledby="news-more-title">
  <div class="wrap">
    <h2 id="news-more-title">Meer uit ${listTitle}</h2>
    <div class="news-grid">
${related.map((p) => newsCard(p, 'lazy', 'h3', base)).join('\n')}
    </div>
  </div>
</section>`
    : ''
}`;
  const ldImage = [abs(s, doc.seo?.image), abs(s, heroSrc)].filter((x) => x && !x.endsWith('undefined'));
  return layout(ctx, {
    title: doc.seo?.title || doc.title,
    description: doc.seo?.description || doc.excerpt,
    image: doc.seo?.image || heroSrc,
    canonicalPath: path,
    ogType: 'article',
    noindex: doc.seo?.noindex || doc.status === 'draft',
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          '@id': `${s.siteUrl}${path}#article`,
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${s.siteUrl}${path}` },
          headline: doc.title,
          description: doc.excerpt,
          inLanguage: 'nl-NL',
          articleSection: doc.category,
          datePublished: doc.date,
          dateModified: doc.updatedAt || doc.date,
          image: ldImage,
          author: { '@type': 'Organization', name: doc.author || s.siteName, url: `${s.siteUrl}/` },
          publisher: { '@type': 'Organization', name: s.siteName, url: `${s.siteUrl}/` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${s.siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: listName, item: `${s.siteUrl}${base}` },
            { '@type': 'ListItem', position: 3, name: doc.title, item: `${s.siteUrl}${path}` },
          ],
        },
      ],
    },
    body,
  });
}

export function renderNotFound(ctx) {
  return layout(ctx, {
    title: 'Pagina niet gevonden',
    canonicalPath: '/404',
    noindex: true,
    body: `<section class="section section--lg">
  <div class="wrap wrap--narrow">
    <h1>Deze pagina bestaat niet (meer)</h1>
    <p class="lead">Misschien is de link verouderd of is de pagina verplaatst.</p>
    <a class="btn" href="/">Naar de homepage</a>
  </div>
</section>`,
  });
}

export function renderSitemap(ctx, items) {
  const s = ctx.settings.siteUrl;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items
    .map((i) => `  <url><loc>${esc(s + i.path)}</loc>${i.lastmod ? `<lastmod>${esc(String(i.lastmod).slice(0, 10))}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
}

export function renderFeed(ctx, posts) {
  const s = ctx.settings;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${esc(s.siteName)} — nieuws</title>\n<link>${esc(s.siteUrl)}/nieuws</link>\n<description>${esc(s.tagline)}</description>\n<language>nl-NL</language>\n${posts
    .slice(0, 30)
    .map((p) => `<item><title>${esc(p.title)}</title><link>${esc(s.siteUrl)}/nieuws/${esc(p.slug)}</link><guid>${esc(s.siteUrl)}/nieuws/${esc(p.slug)}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`)
    .join('\n')}\n</channel></rss>\n`;
}
