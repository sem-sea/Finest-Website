// Everything an editor types is cleaned here before it is stored, so public
// pages can print stored HTML without ever trusting it.
import sanitizeHtml from 'sanitize-html';

const SAFE_SRC = /^(\/(media|assets)\/[A-Za-z0-9._\/-]+|https:\/\/[^\s"'<>]+)$/;

export function cleanHtml(html) {
  return sanitizeHtml(String(html ?? ''), {
    allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'br', 'blockquote', 'hr', 'img', 'figure', 'figcaption', 'span'],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class', 'aria-label'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      p: ['class'],
      h1: ['class'],
      h2: ['class'],
      h3: ['class'],
      blockquote: ['class'],
      span: ['class'],
    },
    allowedClasses: {
      a: ['btn', 'btn--outline'],
      p: ['lead', 'label', 'eyebrow', 'news-read-also', 'notice'],
      h1: ['fi-reveal-lines'],
      h2: ['fi-reveal-lines'],
      h3: ['fi-reveal-lines'],
      blockquote: ['news-quote'],
      span: ['visually-hidden'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => {
        const a = { ...attribs };
        if (a.target === '_blank') a.rel = 'noopener noreferrer';
        else delete a.target;
        return { tagName: 'a', attribs: a };
      },
      b: 'strong',
      i: 'em',
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !SAFE_SRC.test(frame.attribs.src || ''),
  }).trim();
}

/** Plain text, collapsed whitespace, length-limited. */
export function cleanText(s, max = 300) {
  return String(s ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Multi-line plain text (keeps line breaks), for form messages. */
export function cleanMultiline(s, max = 3000) {
  return String(s ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);
}

/** URLs for links and images: relative paths or http(s)/mailto/tel only. */
export function cleanUrl(u, max = 500) {
  const s = String(u ?? '').trim().slice(0, max);
  if (!s) return '';
  if (/^(\/(?!\/)[^\s"'<>]*|#[\w-]*|https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:[+\d ()-]+)$/i.test(s)) return s;
  return '';
}

export function cleanImageUrl(u) {
  const s = String(u ?? '').trim();
  return SAFE_SRC.test(s) ? s : '';
}
