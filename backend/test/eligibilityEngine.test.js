const { test } = require('node:test');
const assert = require('node:assert/strict');

const { scoreScheme, scoreAllSchemes } = require('../src/services/eligibilityEngine');
const { TN_SCHEMES } = require('../src/data/tnSchemes');
const { NATIONAL_SCHEMES } = require('../src/data/nationalSchemes');

const ALL_SCHEMES = [...NATIONAL_SCHEMES, ...TN_SCHEMES];
const byId = (id) => ALL_SCHEMES.find((s) => s.id === id);

test('empty profile is never eligible and asks for completion', () => {
  const scheme = byId('tn-adw-prematric');
  const result = scoreScheme(scheme, {});
  assert.equal(result.eligible, false);
  assert.deepEqual(result.blocks, ['Complete your profile to see match']);
});

test('tn-adw-prematric: eligible for SC/ST, class 9-10, low income, TN domicile', () => {
  const scheme = byId('tn-adw-prematric');
  const result = scoreScheme(scheme, { state: 'Tamil Nadu', cat: 'SC', edu: '9-10', inc: 'under1' });
  assert.equal(result.eligible, true);
  assert.equal(result.blocks.length, 0);
});

test('tn-adw-prematric: blocked for wrong category', () => {
  const scheme = byId('tn-adw-prematric');
  const result = scoreScheme(scheme, { state: 'Tamil Nadu', cat: 'General', edu: '9-10', inc: 'under1' });
  assert.equal(result.eligible, false);
  assert.ok(result.blocks.some((b) => /SC\/ST/.test(b)));
});

test('tn-adw-prematric: blocked for non-TN domicile', () => {
  const scheme = byId('tn-adw-prematric');
  const result = scoreScheme(scheme, { state: 'Kerala', cat: 'SC', edu: '9-10', inc: 'under1' });
  assert.equal(result.eligible, false);
  assert.ok(result.blocks.some((b) => /Tamil Nadu/.test(b)));
});

test('aicte-saksham: hard-blocked when student explicitly not disabled', () => {
  const scheme = byId('aicte-saksham');
  const result = scoreScheme(scheme, { cat: 'General', edu: 'ug-tech', inc: 'under1', disability: 'No' });
  assert.equal(result.eligible, false);
  assert.ok(result.blocks.some((b) => /disability/i.test(b)));
});

test('aicte-saksham: eligible when disability confirmed + course + income match', () => {
  const scheme = byId('aicte-saksham');
  const result = scoreScheme(scheme, { cat: 'General', edu: 'ug-tech', inc: 'under1', disability: 'Yes' });
  assert.equal(result.eligible, true);
});

test('aicte-saksham: missing disability remains unresolved instead of a fully eligible award', () => {
  const scheme = byId('aicte-saksham');
  const result = scoreScheme(scheme, { cat: 'General', edu: 'ug-tech', inc: 'under1' });
  assert.equal(result.eligible, false);
  assert.ok(result.blocks.some(b => /confirm.*disability/i.test(b)));
  assert.ok(result.reasons.some((r) => /disability/i.test(r)));
});

// Several eligFn's used to award score points in the SAME branch that
// blocks.push()'d a disqualifier (e.g. `blocks.push('Income too high');
// score+=10;`) — dead for eligibility (blocks.length>0 already makes it
// ineligible) but it inflated the "% match" shown for blocked/partial
// results. Locking in the fixed, non-inflated scores.
test('aicte-pragati: blocked-on-income score does not include the dead income points', () => {
  const scheme = byId('aicte-pragati');
  const result = scoreScheme(scheme, { gender: 'Female', edu: 'ug-tech', inc: 'above8' });
  assert.equal(result.eligible, false);
  assert.equal(result.score, 70); // 35 female + 35 technical course, no income points
});

test('nsp-prematric: OBC blocked-on-income score excludes the dead points', () => {
  const scheme = byId('nsp-prematric');
  const result = scoreScheme(scheme, { cat: 'OBC', edu: '9-10', inc: 'above8' });
  assert.equal(result.eligible, false);
  assert.equal(result.score, 70); // 40 reserved category + 30 class 9-10, no income points
});

test('ishan-uday: blocked-on-education score excludes the dead points', () => {
  const scheme = byId('ishan-uday');
  const result = scoreScheme(scheme, { state: 'Assam', edu: '9-10', inc: '2.5to4.5' });
  assert.equal(result.eligible, false);
  assert.equal(result.score, 70); // 40 north-east + 30 income, no UG points
});

test('pm-yasasvi: blocked-on-marks score excludes the dead points', () => {
  const scheme = byId('pm-yasasvi');
  const result = scoreScheme(scheme, { cat: 'OBC', inc: '1to2.5', marks: '40' });
  assert.equal(result.eligible, false);
  assert.equal(result.score, 60); // 30 OBC + 30 income, no marks points
});

test('scoreAllSchemes scores the full catalog without throwing', () => {
  const profile = { state: 'Tamil Nadu', cat: 'SC', edu: 'ug-tech', inc: '1to2.5', gender: 'Female', marks: '80' };
  const results = scoreAllSchemes(ALL_SCHEMES, profile);
  assert.equal(results.length, ALL_SCHEMES.length);
  for (const r of results) {
    assert.equal(typeof r.score, 'number');
    assert.ok(Array.isArray(r.reasons));
    assert.ok(Array.isArray(r.blocks));
  }
});
