/**
 * SCHEME FINDER BACKEND — Ingestion: Listing-Page Discovery Stage
 *
 * Unlike fetchHtml.js (re-checks ONE already-known scheme's page), this
 * crawls a directory/listing page for scheme links and returns candidates
 * we don't already know about — schemeId isn't known yet, so there's
 * nothing to diff against. runIngestion.js's discoverOne() takes each
 * candidate through the normal fetch→structure pipeline before it becomes
 * a proposal.
 */

const cheerio = require('cheerio');

// tn.gov.in/scheme_beneficiary_list.php?id=<category> ignores the category
// param server-side (every category returns the same ~488-scheme statewide
// catalog — verified against Students/SC-ST/BC-MBC ids, all three returned
// an identical link set). Most of that catalog is unrelated to this app
// (industrial rebates, funeral assistance, etc.) — this app is a student
// scholarship/education matcher, so filter to education-relevant names
// rather than importing the whole state welfare catalog as "schemes."
const RELEVANCE_RE = /scholarship|stipend|fellowship|education|student|school|college|hostel|tuition|fee|book|bicycle|laptop|polytechnic|iti\b|graduate|academic/i;

function slugify(name) {
  return 'tn-disc-' + name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function discoverCandidates(url, knownIds, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SchemeFinderBot/1.0 (+official-source ingestion; contact: harshkumargupta630@gmail.com)' },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, candidates: [] };
    const html = await res.text();
    const $ = cheerio.load(html);
    const base = new URL(url);

    const seen = new Set();
    const candidates = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const name = $(el).text().replace(/\s+/g, ' ').trim();
      // Scheme detail pages on this portal are scheme_details.php?id=<b64> —
      // anything else (nav, footer, unrelated links) is noise we don't want
      // to feed the LLM structuring stage. RELEVANCE_RE additionally scopes
      // this to education/scholarship schemes (see comment above).
      if (!name || name.length < 6 || !/scheme_details\.php/i.test(href)) return;
      if (!RELEVANCE_RE.test(name)) return;

      let absolute;
      try { absolute = new URL(href, base).toString(); } catch { return; }

      const id = slugify(name);
      if (seen.has(id) || knownIds.has(id)) return;
      seen.add(id);
      candidates.push({ schemeId: id, name, url: absolute });
    });

    return { ok: true, candidates };
  } catch (err) {
    return { ok: false, error: err.message, candidates: [] };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { discoverCandidates, slugify };
