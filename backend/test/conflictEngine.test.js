const { test } = require('node:test');
const assert = require('node:assert/strict');

const { computeBestFit, maxWeightIndependentSet } = require('../src/services/conflictEngine');

// Synthetic schemes: always-eligible eligFn so these tests isolate the
// conflict/combo logic from the eligibility rules tested elsewhere.
function makeScheme({ id, amtNum, exclusiveGroup, conflictsWith, name }) {
  return {
    id, name: name || id, amtNum, exclusiveGroup, conflictsWith, by: 'Test Dept',
    eligFn: () => ({ score: 100, reasons: [`✓ ${id} always eligible`], blocks: [] }),
  };
}

test('maxWeightIndependentSet picks the higher-value scheme within the same exclusiveGroup', () => {
  const schemes = [
    makeScheme({ id: 'a', amtNum: 5000, exclusiveGroup: 'fee-line' }),
    makeScheme({ id: 'b', amtNum: 9000, exclusiveGroup: 'fee-line' }),
  ];
  const { chosen, total } = maxWeightIndependentSet(schemes, (s) => s.amtNum);
  assert.equal(chosen.length, 1);
  assert.equal(chosen[0].id, 'b');
  assert.equal(total, 9000);
});

test('maxWeightIndependentSet keeps both when exclusiveGroups differ', () => {
  const schemes = [
    makeScheme({ id: 'a', amtNum: 5000, exclusiveGroup: 'fee-line' }),
    makeScheme({ id: 'b', amtNum: 3000, exclusiveGroup: 'welfare-grant' }),
  ];
  const { chosen, total } = maxWeightIndependentSet(schemes, (s) => s.amtNum);
  assert.equal(chosen.length, 2);
  assert.equal(total, 8000);
});

test('maxWeightIndependentSet respects explicit conflictsWith even across different groups', () => {
  const schemes = [
    makeScheme({ id: 'a', amtNum: 5000, conflictsWith: ['b'] }),
    makeScheme({ id: 'b', amtNum: 3000 }),
  ];
  const { chosen, total } = maxWeightIndependentSet(schemes, (s) => s.amtNum);
  assert.equal(chosen.length, 1);
  assert.equal(chosen[0].id, 'a');
  assert.equal(total, 5000);
});

test('computeBestFit: excludedByConflict carries a human-readable reason', () => {
  const schemes = [
    makeScheme({ id: 'a', amtNum: 5000, exclusiveGroup: 'fee-line', name: 'Scheme A' }),
    makeScheme({ id: 'b', amtNum: 9000, exclusiveGroup: 'fee-line', name: 'Scheme B' }),
  ];
  const result = computeBestFit({ cat: 'SC', edu: 'ug-tech', inc: 'under1' }, schemes);
  assert.equal(result.bestCombo.length, 1);
  assert.equal(result.bestCombo[0].id, 'b');
  assert.equal(result.excludedByConflict.length, 1);
  assert.equal(result.excludedByConflict[0].id, 'a');
  assert.match(result.excludedByConflict[0].conflictReason, /can't be combined/i);
});

test('computeBestFit: bestSingle is always the highest-value individually eligible scheme', () => {
  const schemes = [
    makeScheme({ id: 'a', amtNum: 5000, exclusiveGroup: 'fee-line' }),
    makeScheme({ id: 'b', amtNum: 9000, exclusiveGroup: 'fee-line' }),
    makeScheme({ id: 'c', amtNum: 2000, exclusiveGroup: 'welfare-grant' }),
  ];
  const result = computeBestFit({ cat: 'SC', edu: 'ug-tech', inc: 'under1' }, schemes);
  assert.equal(result.bestSingle.id, 'b');
});

test('computeBestFit: no eligible schemes yields empty combo, not a crash', () => {
  const notEligible = { id: 'x', name: 'X', amtNum: 1000, eligFn: () => ({ score: 0, reasons: [], blocks: ['nope'] }) };
  const result = computeBestFit({ cat: 'SC', edu: 'ug-tech', inc: 'under1' }, [notEligible]);
  assert.equal(result.bestSingle, null);
  assert.deepEqual(result.bestCombo, []);
  assert.equal(result.comboTotalValue, 0);
});
