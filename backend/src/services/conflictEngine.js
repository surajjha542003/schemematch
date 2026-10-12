/**
 * SCHEME FINDER BACKEND — Conflict-Aware Best-Fit Recommendation Engine
 * Mirrors frontend/src/js/conflict-engine.js. See that file's header for
 * the real-world basis of the conflict model (NSP "one benefit per fee
 * line" rule + AY2026-27 "one merit + one welfare" allowance).
 */

const { scoreScheme } = require('./eligibilityEngine');
const { getCompatibilityStatus } = require('../data/compatibilityRules');

function buildConflictMasks(schemes) {
  const n = schemes.length;
  const masks = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const a = schemes[i], b = schemes[j];
      const sameGroup = a.exclusiveGroup && b.exclusiveGroup && a.exclusiveGroup === b.exclusiveGroup;
      const explicitConflict = (a.conflictsWith && a.conflictsWith.includes(b.id)) || (b.conflictsWith && b.conflictsWith.includes(a.id));
      if (sameGroup || explicitConflict) masks[i] |= (1 << j);
    }
  }
  return masks;
}

function greedyByGroup(schemes, weightOf) {
  const byGroup = {};
  const ungrouped = [];
  schemes.forEach(s => {
    if (s.exclusiveGroup) {
      if (!byGroup[s.exclusiveGroup] || weightOf(s) > weightOf(byGroup[s.exclusiveGroup])) byGroup[s.exclusiveGroup] = s;
    } else ungrouped.push(s);
  });
  let chosen = [...Object.values(byGroup), ...ungrouped];
  chosen = chosen.filter(s => !chosen.some(o => o !== s && s.conflictsWith && s.conflictsWith.includes(o.id) && weightOf(o) >= weightOf(s)));
  return { chosen, total: chosen.reduce((sum, s) => sum + weightOf(s), 0) };
}

// Exact max-weight independent set via bitmask brute force. Fine for n<=20
// (2^20 ≈ 1M iterations). Falls back to a greedy per-group pick above that.
function maxWeightIndependentSet(schemes, weightOf) {
  const n = schemes.length;
  if (n === 0) return { chosen: [], total: 0 };
  if (n > 20) return greedyByGroup(schemes, weightOf);

  let bestMask = 0, bestTotal = -1;
  const masks = buildConflictMasks(schemes);
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    let valid = true, sum = 0;
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue;
      if (mask & masks[i]) { valid = false; break; }
      sum += weightOf(schemes[i]);
    }
    if (valid && sum > bestTotal) { bestTotal = sum; bestMask = mask; }
  }
  const chosen = [];
  for (let i = 0; i < n; i++) if (bestMask & (1 << i)) chosen.push(schemes[i]);
  return { chosen, total: bestTotal };
}

/**
 * @param {object} u - user profile
 * @param {Array}  schemePool - scheme dataset to match against
 */
function computeBestFit(u, schemePool) {
  const pool = schemePool || [];
  if(pool.some(s=>s.matchingEnabled===true && s.reviewedConditions))return require('../data/shared')('programme-rules').matches(pool,u);
  const scored = pool.map(s => {
    const r = scoreScheme(s, u);
    return { ...s, ...r };
  });

  const eligible = scored.filter(s => s.eligible);
  const needsVerification = scored.filter(s => !s.eligible && s.score > 0);

  const weightOf = s => s.amtNum || 0;

  const { chosen: bestCombo, total: comboTotalValue } = maxWeightIndependentSet(eligible, weightOf);

  const bestSingle = eligible.length
    ? eligible.reduce((best, s) => (weightOf(s) > weightOf(best) ? s : best), eligible[0])
    : null;

  const comboIds = new Set(bestCombo.map(s => s.id));
  const excludedByConflict = eligible
    .filter(s => !comboIds.has(s.id))
    .map(s => {
      const conflictsWithChosen = bestCombo.find(c =>
        c.exclusiveGroup === s.exclusiveGroup ||
        (s.conflictsWith && s.conflictsWith.includes(c.id)) ||
        (c.conflictsWith && c.conflictsWith.includes(s.id))
      );
      return {
        ...s,
        conflictReason: conflictsWithChosen
          ? `Can't be combined with "${conflictsWithChosen.name}" — both cover the same ${s.exclusiveGroup === 'tn-fee-reimbursement' ? 'tuition/fee benefit' : s.exclusiveGroup === 'tn-welfare-grant' ? 'welfare grant' : s.exclusiveGroup === 'central-maintenance-allowance' ? "central government maintenance allowance — NSP rules don't allow drawing two concurrently" : 'benefit type'}, and it pays out more.`
          : 'Lower value than the selected combination.'
      };
    });

  // Every pair inside the chosen combo gets an explicit compatibility
  // status (ALLOWED/NOT_ALLOWED/CONDITIONAL/UNKNOWN) — never silently
  // presented as a confirmed-safe combination. See data/compatibilityRules.js.
  const comboCompatibility = [];
  for (let i = 0; i < bestCombo.length; i++) {
    for (let j = i + 1; j < bestCombo.length; j++) {
      const { status, reason, source } = getCompatibilityStatus(bestCombo[i], bestCombo[j]);
      comboCompatibility.push({ schemeA: bestCombo[i].id, schemeB: bestCombo[j].id, status, reason, source: source || null });
    }
  }

  return { eligible, needsVerification, bestSingle, bestCombo, comboTotalValue, excludedByConflict, comboCompatibility };
}

module.exports = { computeBestFit, maxWeightIndependentSet, buildConflictMasks };
