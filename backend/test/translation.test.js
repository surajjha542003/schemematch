const { test } = require('node:test');
const assert = require('node:assert/strict');
const { translateText } = require('../src/controllers/profile.controller');

async function request(body) {
  let status = 200, payload;
  const res = { status(code) { status = code; return this; }, json(value) { payload = value; return this; } };
  await translateText({ body }, res, error => { throw error; });
  return { status, payload };
}
test('translation API rejects invalid language types before making a request', async () => {
  assert.equal((await request({ text: 'Hello', targetLang: {} })).status, 400);
  assert.equal((await request({ text: 'Hello', sourceLang: 'hi&tl=other' })).status, 400);
});
test('translation API returns 503 rather than original text when the service fails', async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  global.fetch = async () => { throw new Error('Offline'); };
  const response = await request({ text: 'मेरी आय दो लाख है', sourceLang: 'hi-IN' });
  assert.equal(response.status, 503);
  assert.equal(response.payload.data.status, 'unavailable');
  assert.equal(response.payload.data.translated, undefined);
});
test('translation API preserves a confirmed English response even if the text is unchanged', async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  global.fetch = async () => ({ ok: true, json: async () => [[['Hello', 'Hello']], null, 'en'] });
  const response = await request({ text: 'Hello', sourceLang: 'en' });
  assert.equal(response.status, 200);
  assert.equal(response.payload.data.translated, 'Hello');
});
