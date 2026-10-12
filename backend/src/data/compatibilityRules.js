/**
 * SCHEME FINDER BACKEND — Scheme Compatibility Rules
 *
 * Explicit scheme_A / scheme_B compatibility table, per the "never assume
 * two individually eligible schemes can be combined" rule. Every pair of
 * eligible schemes gets a status:
 *
 *   ALLOWED      — explicitly confirmed combinable (manual rule below)
 *   NOT_ALLOWED  — same exclusiveGroup (same benefit line — NSP's "one
 *                  benefit per fee line" rule) or an explicit conflictsWith
 *                  entry on the scheme itself (see data/tnSchemes.js,
 *                  data/nationalSchemes.js)
 *   CONDITIONAL  — allowed only if a stated condition holds (manual rule)
 *   UNKNOWN      — not individually verified against both departments'
 *                  guidelines. The optimizer still includes these in the
 *                  best-combo calculation (different exclusiveGroups =
 *                  different benefit types, which IS a verified structural
 *                  rule), but the API/UI must surface the UNKNOWN flag
 *                  rather than presenting it as a confirmed-safe combo.
 *
 * MANUAL_RULES lets specific pairs override the UNKNOWN default once an
 * official source confirms (or rules out) combinability.
 */

const MANUAL_RULES = [
  {
    schemeA: 'tn-adw-cm-merit-award',
    schemeB: 'tn-construction-workers',
    status: 'ALLOWED',
    reason: "Merit cash award (Adi Dravidar Welfare) and a welfare-board occupational grant (Construction Workers Welfare Board) are different benefit categories from different implementing bodies — TN's AY2026-27 scholarship guidance allows one merit award plus one welfare-board grant together.",
    source: 'https://tnadw.tn.gov.in',
  },
  {
    schemeA: 'tn-adw-cm-merit-award',
    schemeB: 'tn-differently-abled-wards',
    status: 'ALLOWED',
    reason: "Merit cash award and a welfare-board grant tied to parent status are different benefit categories — the same 'one merit + one welfare' allowance applies.",
    source: 'https://tnadw.tn.gov.in',
  },
];

function ruleKey(a, b) {
  return [a, b].sort().join('::');
}

function buildManualRuleMap() {
  const map = new Map();
  for (const rule of MANUAL_RULES) {
    map.set(ruleKey(rule.schemeA, rule.schemeB), rule);
  }
  return map;
}

const MANUAL_RULE_MAP = buildManualRuleMap();

/**
 * @param {object} a - scheme object (id, exclusiveGroup, conflictsWith, by, name)
 * @param {object} b - scheme object
 * @returns {{status: 'ALLOWED'|'NOT_ALLOWED'|'CONDITIONAL'|'UNKNOWN', reason: string, source?: string}}
 */
function getCompatibilityStatus(a, b) {
  const manual = MANUAL_RULE_MAP.get(ruleKey(a.id, b.id));
  if (manual) return { status: manual.status, reason: manual.reason, source: manual.source };

  const explicitConflict = (a.conflictsWith && a.conflictsWith.includes(b.id)) || (b.conflictsWith && b.conflictsWith.includes(a.id));
  if (explicitConflict) {
    return {
      status: 'NOT_ALLOWED',
      reason: `"${a.name}" and "${b.name}" are explicitly flagged as covering the same benefit — only one can be claimed.`,
    };
  }

  if (a.exclusiveGroup && b.exclusiveGroup && a.exclusiveGroup === b.exclusiveGroup) {
    return {
      status: 'NOT_ALLOWED',
      reason: a.exclusiveGroup === 'central-maintenance-allowance'
        ? `"${a.name}" and "${b.name}" are both central government maintenance allowances — NSP rules don't allow a student to draw two concurrently; pick whichever pays more.`
        : `Both schemes fall under the same benefit line (${a.exclusiveGroup}) — government scholarship rules generally allow only one award per benefit line.`,
    };
  }

  return {
    status: 'UNKNOWN',
    reason: `"${a.name}" (${a.by}) and "${b.name}" (${b.by}) cover different benefit types and are structurally combinable, but this specific pair hasn't been individually confirmed against both departments' current guidelines — verify with both before applying to both.`,
  };
}

module.exports = { getCompatibilityStatus, MANUAL_RULES };
