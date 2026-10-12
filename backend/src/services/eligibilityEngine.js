/**
 * SCHEME FINDER BACKEND — Eligibility Scoring
 * Mirrors frontend/src/js/state.js scoreScheme().
 */

const ReviewedConditions = require('../data/shared')('reviewed-conditions');
const ProgrammeRules = require('../data/shared')('programme-rules');

function scoreScheme(scheme, u) {
  if (!u || (!u.cat && !u.edu && !u.inc)) {
    return { score: 0, reasons: [], blocks: ['Complete your profile to see match'], eligible: false };
  }
  if (scheme.reviewedConditions) return ProgrammeRules.score(scheme,u);
  if (typeof scheme.eligFn !== 'function' || scheme.matchingEnabled === false) {
    return { score: 0, reasons: [], blocks: ['Eligibility rules need review — check the official source'], eligible: false };
  }
  const result = scheme.eligFn(u);
  return ReviewedConditions.finishScore(result);
}

function scoreAllSchemes(schemes, u) {
  return schemes.map(s => ({ ...s, ...scoreScheme(s, u) }));
}

module.exports = { scoreScheme, scoreAllSchemes };
