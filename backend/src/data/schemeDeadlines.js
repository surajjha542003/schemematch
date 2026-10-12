/**
 * SCHEME FINDER BACKEND — Scheme Deadlines
 *
 * Ported from frontend/src/js/panels.js's DL array (dates researched
 * 2026-09-09 against secondary scholarship-info sources — no official
 * .gov.in page could be fetched directly for most; confidence noted per
 * entry). Keyed by scheme id so schemeEnrichment.js can attach a live
 * "days remaining" countdown per scheme instead of a separate static list.
 * Schemes with no confirmed date show a portal pointer instead of a
 * fabricated countdown — never invent a deadline that isn't sourced.
 */

const SCHEME_DEADLINES = {
  'nsp-postmatric':  { date: '2026-10-31', confidence: 'medium', note: null },
  'aicte-pragati':   { date: '2026-10-31', confidence: 'medium', note: null },
  'inspire':         { date: null, confidence: 'low', note: 'No confirmed fixed date — check online-inspire.gov.in' },
  'central-sector':  { date: '2026-10-31', confidence: 'medium', note: null },
  'ugc-jrf':         { date: null, confidence: 'low', note: 'Recurring twice-yearly exam window, not a single deadline — check csirnet.nta.nic.in' },
  'pm-yasasvi':       { date: '2026-10-31', confidence: 'medium', note: null },
};

module.exports = { SCHEME_DEADLINES };
