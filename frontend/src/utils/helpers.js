/**
 * SCHEME FINDER — GENERAL HELPERS
 * Formatting, date, DOM, and UI utility functions.
 * Zero business logic — pure helpers only.
 */

// ─────────────────────────────────────────────
//  FORMATTING
// ─────────────────────────────────────────────

/**
 * Format a number as Indian rupees string.
 * @param {number} n
 * @param {'compact'|'full'} style
 * @returns {string}  e.g. "₹1.25L" or "₹1,25,000"
 */
export function formatRupees(n, style = 'compact') {
  if (style === 'full') {
    return '₹' + n.toLocaleString('en-IN');
  }
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return '₹' + n;
}

/**
 * Get current time string in HH:MM format (12-hour, en-IN locale).
 * @returns {string}
 */
export function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get user's initial(s) from a name string.
 * @param {string} name
 * @param {number} count  — how many initials (1 or 2)
 * @returns {string}
 */
export function initials(name, count = 1) {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, count)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

// ─────────────────────────────────────────────
//  HTML / DOM
// ─────────────────────────────────────────────

/**
 * HTML-escape a string (prevent XSS in rendered HTML).
 * @param {string} str
 * @returns {string}
 */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Create a DOM element with optional className and innerHTML.
 * @param {string} tag
 * @param {string} [cls]
 * @param {string} [html]
 * @returns {HTMLElement}
 */
export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

// ─────────────────────────────────────────────
//  COLOUR MAPPING
// ─────────────────────────────────────────────

/** Map scheme colour key to background CSS variable */
export const BG_MAP = {
  sf:  'var(--sfl)',
  gn:  'var(--gnl)',
  bl:  'var(--bll)',
  gd:  'var(--gdl)',
  pu:  'var(--pul)',
  pk:  'var(--pkl)',
  rd:  'var(--rdl)',
};

/** Map scheme colour key to CSS class */
export const COL_CLASS = {
  sf:  'b-sf',
  gn:  'b-gn',
  bl:  'b-bl',
  gd:  'b-gd',
  pu:  'b-pu',
  pk:  'b-pk',
  rd:  'b-rd',
};

/** Urgency key → colour token */
export const URGENCY_STYLE = {
  critical: { bg: 'var(--rdl)', text: 'var(--rd)' },
  warning:  { bg: 'var(--gdl)', text: 'var(--gd)' },
  safe:     { bg: 'var(--gnl)', text: 'var(--gn)' },
};

// ─────────────────────────────────────────────
//  SCROLL
// ─────────────────────────────────────────────

/**
 * Smoothly scroll a container to its bottom.
 * @param {HTMLElement} container
 * @param {number}      [delay=50] — ms delay (allows paint to complete)
 */
export function scrollToBottom(container, delay = 50) {
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, delay);
}

// ─────────────────────────────────────────────
//  TEXTAREA AUTO-GROW
// ─────────────────────────────────────────────

/**
 * Auto-resize a textarea to fit its content, up to maxHeight px.
 * @param {HTMLTextAreaElement} textarea
 * @param {number}              [maxHeight=90]
 */
export function autoGrow(textarea, maxHeight = 90) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
}

// ─────────────────────────────────────────────
//  INCOME BRACKET DISPLAY
// ─────────────────────────────────────────────

/** Human-readable income bracket labels */
export const INCOME_LABELS = {
  'under1':    'Below ₹1 Lakh',
  '1to2.5':    '₹1L – ₹2.5L',
  '2.5to4.5':  '₹2.5L – ₹4.5L',
  '4.5to8':    '₹4.5L – ₹8L',
  'above8':    'Above ₹8L',
};

/** Human-readable education level labels */
export const EDU_LABELS = {
  '9-10':       'Class 9–10',
  '11-12':      'Class 11–12',
  'diploma':    'Diploma / ITI',
  'ug-arts':    'UG — BA / BSc / BCom',
  'ug-tech':    'UG — BTech / BE',
  'ug-medical': 'UG — MBBS / BDS',
  'pg':         'Postgraduate (MA/MSc/MTech)',
  'phd':        'PhD / Research',
};
