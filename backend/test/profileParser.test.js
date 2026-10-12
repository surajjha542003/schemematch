const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deterministicExtract } = require('../src/services/profileParser.service');
const { loadWindow } = require('../../frontend/testHelpers');

const cases = [
  ['I am not disabled and not a first graduate. My old family income was 2 lakh; now it is 9 lakh.', { disability: 'No', firstGrad: 'No', inc: 'above8' }],
  ['My father is not disabled. I am disabled.', { parentDisabled: 'No', disability: 'Yes' }],
  ['I am disabled, but I am not disabled.', { disability: 'No' }],
  ['My annual family income is 1 lakh.', { inc: '1to2.5' }],
  ['My family income is 20000 per month.', { inc: '1to2.5' }],
  ['My family income is 50000 per month.', { inc: '4.5to8' }],
  ['My annual family income is ₹4,50,000.', { inc: '2.5to4.5' }],
  ['My name is Priya Sharma. I study BCA.', { name: 'Priya Sharma', edu: 'ug-arts', stream: 'science' }],
];
for (const [text, expected] of cases) {
  test(`frontend/backend extraction honours declared facts: ${text}`, t => {
    const dom = loadWindow(['frontend/src/js/eligibility.js']);
    t.after(() => dom.window.close());
    for (const profile of [deterministicExtract(text), dom.window.localExtractProfile(text)]) {
      for (const [key, value] of Object.entries(expected)) assert.equal(profile[key], value, key);
    }
  });
}
test('uncertain ranges, conditional disability and unrelated money do not become eligibility facts', t => {
  const dom = loadWindow(['frontend/src/js/eligibility.js']);
  t.after(() => dom.window.close());
  for (const extract of [deterministicExtract, dom.window.localExtractProfile]) {
    assert.equal(extract('My family income is below 2 lakh.').inc, undefined);
    assert.equal(extract('My annual family income is 2 to 4 lakh.').inc, undefined);
    assert.equal(extract('My tuition fee is 2 lakh.').inc, undefined);
    assert.equal(extract('If I am disabled, can I apply?').disability, undefined);
    const profile = extract('I am not disabled. Now it is time to apply as a student.');
    assert.equal(profile.name, undefined);
    assert.equal(profile.stream, undefined);
    assert.equal(profile.state, undefined);
    assert.equal(profile.parentOcc, undefined);
  }
});
