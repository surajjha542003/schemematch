const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const mongoose = require('../node_modules/mongoose');
const Scheme = require('../src/models/Scheme.model');
const User = require('../src/models/User.model');
const app = require('../src/app');
const records = require('../../frontend/src/data/state-scholarships.json');
const { scoreScheme } = require('../src/services/eligibilityEngine');
const { incAtOrBelow, tnDomicile } = require('../src/utils/schemeHelpers');

test('official-source listings cover exactly the approved 15 states without guessed benefits or matching', () => {
  assert.equal(new Set(records.map(s => s.state)).size, 15);
  assert.equal(new Set(records.map(s => s.id)).size, records.length);
  for (const s of records) {
    assert.match(new URL(s.source).hostname, /(?:gov\.in|nic\.in|highereduhry\.ac\.in)$/);
    assert.equal(s.sourceChecked, '2026-10-09');
    assert.equal(s.matchingEnabled, false);
    assert.equal(s.eligibilityVerification, 'pending');
    assert.equal(s.amtNum, 0);
    assert.equal(scoreScheme(s, { cat: 'SC', edu: 'ug-tech', inc: 'under1', state: s.state }).eligible, false);
    assert.ok(s.accessNote && s.verificationScope && s.evidenceSummary);
    assert.notEqual(s.status, 'active');
  }
});

test('missing/invalid income and unconfirmed TN domicile cannot pass eligibility gates', () => {
  for (const value of [undefined, null, '', 'unknown', 'above8']) assert.equal(incAtOrBelow(value, 'under1'), false);
  assert.equal(incAtOrBelow('under1', 'unknown'), false);
  assert.equal(incAtOrBelow('1to2.5', '1to2.5'), true);
  const reasons = [], blocks = [];
  assert.equal(tnDomicile({}, reasons, blocks), false);
  assert.match(blocks[0], /Confirm.*domicile/);
});

test('account schema retains the special eligibility fields without requiring a database', () => {
  const profile = { disability: 'No', firstGrad: 'No', parentDisabled: 'Yes', parentOcc: 'construction' };
  const user = new User({ name: 'Student', email: 'student@example.test', password: 'example-password', profile });
  for (const [key, value] of Object.entries(profile)) assert.equal(user.toObject().profile[key], value);
});

test('catalog and matching HTTP routes serve all states in DB-offline mode without marking pending listings eligible', async t => {
  delete process.env.OPEN_ROUTER;
  delete process.env.OPENROUTER_API_KEY;
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/schemes`;
  for (const state of new Set(records.map(s => s.state))) {
    const response = await fetch(`${base}?state=${encodeURIComponent(state)}`);
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.ok(json.count > 0, state);
    assert.ok(json.data.every(s => (s.state || (s.id.startsWith('tn-') ? 'Tamil Nadu' : null)) === state));
  }
  const catalog = await (await fetch(base)).json();
  assert.equal(new Set(catalog.data.map(s => s.id)).size, catalog.count);
  const detail = await (await fetch(`${base}/gj-sc-postmatric`)).json();
  assert.equal(detail.data.sourceVerification, 'official-reference-checked');
  assert.equal(detail.data.lastVerified, '2026-10-09');
  assert.deepEqual(detail.data.documents, []);
  const result = await fetch(`${base}/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cat: 'SC', edu: 'ug-tech', inc: 'under1', state: 'Gujarat' }) });
  assert.equal(result.status, 200);
  const matched = (await result.json()).data;
  assert.ok(matched.eligible.every(s => !records.some(r => r.id === s.id)));
});

test('a stale seeded database does not hide the approved state directory', async t => {
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  const original = Scheme.find;
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  Scheme.find = () => ({ lean: async () => [{ id: 'legacy', name: 'Legacy', type: 'scholarship' }] });
  t.after(() => {
    Scheme.find = original;
    if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
    else delete mongoose.connection.readyState;
  });
  const controller = require('../src/controllers/schemes.controller');
  let response;
  await controller.listSchemes({ query: { state: 'Assam' } }, { json: value => { response = value; } }, err => { throw err; });
  assert.equal(response.count, records.filter(s=>s.state==='Assam').length);
  assert.ok(response.data.every(s => s.state === 'Assam'));
});
