const { test } = require('node:test');
const assert = require('node:assert/strict');

const { getCompatibilityStatus } = require('../src/data/compatibilityRules');

test('manual rule pair returns ALLOWED with a cited source', () => {
  const a = { id: 'tn-adw-cm-merit-award', name: 'CM Merit Award', by: 'ADW' };
  const b = { id: 'tn-construction-workers', name: 'Construction Workers Grant', by: 'BOCW' };
  const status = getCompatibilityStatus(a, b);
  assert.equal(status.status, 'ALLOWED');
  assert.ok(status.source);
});

test('same exclusiveGroup returns NOT_ALLOWED regardless of order', () => {
  const a = { id: 'x', name: 'X', by: 'Dept', exclusiveGroup: 'tn-fee-reimbursement' };
  const b = { id: 'y', name: 'Y', by: 'Dept', exclusiveGroup: 'tn-fee-reimbursement' };
  assert.equal(getCompatibilityStatus(a, b).status, 'NOT_ALLOWED');
  assert.equal(getCompatibilityStatus(b, a).status, 'NOT_ALLOWED');
});

test('explicit conflictsWith returns NOT_ALLOWED', () => {
  const a = { id: 'x', name: 'X', by: 'Dept', conflictsWith: ['y'] };
  const b = { id: 'y', name: 'Y', by: 'Dept' };
  assert.equal(getCompatibilityStatus(a, b).status, 'NOT_ALLOWED');
});

test('unrelated, unverified pair defaults to UNKNOWN, never a silent ALLOWED', () => {
  const a = { id: 'x', name: 'X', by: 'Dept A', exclusiveGroup: 'group-1' };
  const b = { id: 'y', name: 'Y', by: 'Dept B', exclusiveGroup: 'group-2' };
  const status = getCompatibilityStatus(a, b);
  assert.equal(status.status, 'UNKNOWN');
});
