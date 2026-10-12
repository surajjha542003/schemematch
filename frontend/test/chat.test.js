const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadWindow } = require('../testHelpers');

// chat.js's own bottom DOMContentLoaded block uses bare `window`, which this
// stripped-down jsdom realm (no pretendToBeVisual) doesn't resolve, and it's
// irrelevant to what's under test here — cut the file at the marker.
const stripInit = src => src.split('// ══ INIT ══')[0];

function freshChatWindow() {
  return loadWindow(['frontend/src/js/state.js', 'frontend/src/js/chat.js'], { transform: stripInit });
}

test('reply(): a document-guide question that happens to name a scheme answers the document question, not the scheme card', () => {
  const { window: w } = freshChatWindow();
  const out = w.reply('Income certificate for NSP how to get');
  assert.match(out, /How to Get Income Certificate/);
  assert.doesNotMatch(out, /NSP Post-Matric Scholarship<\/strong>/);
});

test('reply(): a plain scheme-name question still returns that scheme\'s card (no regression from the reordering)', () => {
  const { window: w } = freshChatWindow();
  const out = w.reply('Tell me about NSP scholarship');
  assert.match(out, /National Scholarship Portal/);
});

test('reply(): caste-certificate question naming AICTE answers the certificate question', () => {
  const { window: w } = freshChatWindow();
  const out = w.reply('caste certificate for AICTE Pragati');
  assert.match(out, /How to Get Caste \/ Category Certificate/);
});

test('mdToSafeHtml: escapes raw HTML from the model before adding our own tags (no XSS from LLM output)', () => {
  const { window: w } = freshChatWindow();
  const out = w.mdToSafeHtml('<img src=x onerror=alert(1)> **bold** line1\nline2');
  assert.doesNotMatch(out, /<img/);
  assert.match(out, /&lt;img/);
  assert.match(out, /<strong>bold<\/strong>/);
  assert.match(out, /line1<br>line2/);
});

test('getReply(): falls back to the local deterministic reply() when the backend is unreachable', async () => {
  const { window: w } = freshChatWindow();
  // jsdom provides no `fetch` by default — getReply()'s try/catch must
  // catch that and fall back, same as if the real backend were down.
  const out = await w.getReply('Tell me about NSP scholarship');
  assert.match(out, /National Scholarship Portal/);
});
