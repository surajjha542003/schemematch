/**
 * SCHEME FINDER — ELIGIBILITY ENGINE
 *
 * Pure utility functions used by:
 *   1. Frontend eligibility checker (pages/Eligibility.js)
 *   2. AI chat parser (utils/chat.js)
 *   3. Dashboard live scoring (pages/Dashboard.js)
 *   4. Backend API mirror (backend/src/utils/eligibilityEngine.js) — Stage 2
 *
 * Zero DOM dependencies — can be unit-tested in isolation.
 */

// ─────────────────────────────────────────────
//  INCOME BRACKET ORDERING
// ─────────────────────────────────────────────

/** Ordered income bracket keys — lowest to highest */
export const INCOME_BRACKETS = ['under1', '1to2.5', '2.5to4.5', '4.5to8', 'above8'];

/**
 * Returns true if userInc is at or below the limit bracket.
 * @param {string} userInc  — e.g. '1to2.5'
 * @param {string} limit    — e.g. '2.5to4.5'
 */
export function incAtOrBelow(userInc, limit) {
  const userIndex = INCOME_BRACKETS.indexOf(userInc);
  const limitIndex = INCOME_BRACKETS.indexOf(limit);
  return userIndex >= 0 && limitIndex >= 0 && userIndex <= limitIndex;
}


// ─────────────────────────────────────────────
//  EDUCATION LEVEL GROUPS
// ─────────────────────────────────────────────

export const EDU_PREMATRIC  = ['9-10'];
export const EDU_POSTMATRIC = ['11-12', 'diploma', 'ug-arts', 'ug-tech', 'ug-medical', 'pg', 'phd'];
export const EDU_UG         = ['ug-arts', 'ug-tech', 'ug-medical'];
export const EDU_TECH       = ['ug-tech'];           // AICTE-approved only
export const EDU_PG_ABOVE   = ['pg', 'phd'];
export const EDU_PHD        = ['phd'];


// ─────────────────────────────────────────────
//  CATEGORY GROUPS
// ─────────────────────────────────────────────

export const MINORITY_CATS = [
  'Minority',
  'Minority (Muslim)',
  'Minority (Christian)',
  'Minority (Buddhist)',
  'Minority (Jain)',
  'Minority (Sikh)',
  'Minority (Parsi)',
];

export const RESERVED_CATS = [
  'OBC', 'SC', 'ST', 'EWS',
  ...MINORITY_CATS,
];

export const NE_STATES = [
  'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Sikkim', 'Tripura',
];

/** Predicate helpers */
export const isMinority  = (cat) => MINORITY_CATS.includes(cat);
export const isSC        = (cat) => cat === 'SC';
export const isST        = (cat) => cat === 'ST';
export const isOBC       = (cat) => cat === 'OBC';
export const isEWS       = (cat) => cat === 'EWS';
export const isReserved  = (cat) => RESERVED_CATS.includes(cat);
export const isNorthEast = (state) => NE_STATES.includes(state);

/**
 * Bundled export — convenience object for scheme eligFn functions.
 * Keeps scheme definitions clean: `H.isReserved(u.cat)` etc.
 */
export const ELIGIBILITY_HELPERS = {
  incAtOrBelow,
  isMinority, isSC, isST, isOBC, isEWS, isReserved, isNorthEast,
  EDU_PREMATRIC, EDU_POSTMATRIC, EDU_UG, EDU_TECH, EDU_PG_ABOVE, EDU_PHD,
  INCOME_BRACKETS,
};


// ─────────────────────────────────────────────
//  MAIN ENGINE FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Score a single scheme against a user profile.
 *
 * @param {SchemeDefinition} scheme
 * @param {UserProfile}      userProfile
 * @returns {ScoredScheme}
 */
export function scoreScheme(scheme, userProfile) {
  // If the profile is essentially empty, return zero
  if (!userProfile.cat && !userProfile.edu && !userProfile.inc) {
    return {
      ...scheme,
      score:    0,
      reasons:  [],
      blocks:   ['Complete your profile to see match score'],
      eligible: false,
    };
  }

  const result = scheme.eligFn(userProfile);
  return {
    ...scheme,
    ...result,
    eligible: result.blocks.length === 0 && result.score >= 30,
  };
}

/**
 * Score ALL schemes and return sorted results.
 *
 * @param {SchemeDefinition[]} schemes
 * @param {UserProfile}        userProfile
 * @returns {{ eligible: ScoredScheme[], partial: ScoredScheme[] }}
 */
export function scoreAllSchemes(schemes, userProfile) {
  const scored = schemes.map((s) => scoreScheme(s, userProfile));

  const eligible = scored
    .filter((s) => s.eligible)
    .sort((a, b) => b.score - a.score);

  const partial = scored
    .filter((s) => !s.eligible && s.score > 0)
    .sort((a, b) => b.score - a.score);

  return { eligible, partial };
}

/**
 * Return only the eligible schemes — convenience wrapper.
 *
 * @param {SchemeDefinition[]} schemes
 * @param {UserProfile}        userProfile
 * @returns {ScoredScheme[]}
 */
export function getEligibleSchemes(schemes, userProfile) {
  return scoreAllSchemes(schemes, userProfile).eligible;
}

/**
 * Given the eligible schemes, sum up the maximum annual benefit.
 *
 * @param {ScoredScheme[]} eligibleSchemes
 * @returns {number}  total rupees per year
 */
export function totalPotential(eligibleSchemes) {
  return eligibleSchemes.reduce((sum, s) => sum + (s.amtNum || 0), 0);
}

/**
 * Score colour based on match percentage.
 *
 * @param {number} score
 * @returns {string} CSS colour value
 */
export function scoreToColor(score) {
  if (score >= 75) return 'var(--color-green-2)';
  if (score >= 50) return 'var(--color-gold)';
  return 'var(--color-saffron)';
}


// ─────────────────────────────────────────────
//  INLINE PROFILE PARSER (for AI chat)
// ─────────────────────────────────────────────

/**
 * Parse a free-text user message into a partial UserProfile.
 * Used by the chat assistant to run live eligibility from natural language.
 *
 * @param {string}      rawText
 * @param {UserProfile} existingProfile — merged as fallback
 * @returns {UserProfile}
 */
export function parseProfileFromText(rawText, existingProfile = {}) {
  const t = rawText.toLowerCase();
  const p = { ...existingProfile };

  // Category
  if (/\bobc\b/.test(t))                                          p.cat = 'OBC';
  else if (/\bsc\b/.test(t) && !/bsc/.test(t))                   p.cat = 'SC';
  else if (/\bst\b/.test(t))                                      p.cat = 'ST';
  else if (/\bews\b/.test(t))                                     p.cat = 'EWS';
  else if (/minority|muslim|christian|sikh|buddhist|jain|parsi/.test(t)) p.cat = 'Minority (Muslim)';
  else if (/\bgeneral\b/.test(t))                                 p.cat = 'General';

  // Income — match "1.5 lakh", "2 lakh", "80000" etc.
  const mInc = rawText.match(/(\d+\.?\d*)\s*(l\b|lakh|lac)/i);
  if (mInc) {
    const val = parseFloat(mInc[1]);
    if      (val <  1)   p.inc = 'under1';
    else if (val <= 2.5) p.inc = '1to2.5';
    else if (val <= 4.5) p.inc = '2.5to4.5';
    else if (val <= 8)   p.inc = '4.5to8';
    else                 p.inc = 'above8';
  }

  // Education
  if      (/\bphd\b/.test(t))                                p.edu = 'phd';
  else if (/\b(pg|postgrad|msc|mtech|ma\b|mba\b)/.test(t))  p.edu = 'pg';
  else if (/btech|be\b|b\.e\.|engineering/.test(t))          p.edu = 'ug-tech';
  else if (/\b(ba|bsc|b\.sc|bcom|undergrad|degree)\b/.test(t)) p.edu = 'ug-arts';
  else if (/\bmbbs\b|bds\b|nursing/.test(t))                 p.edu = 'ug-medical';
  else if (/class\s*(11|12)|12th|11th/.test(t))              p.edu = '11-12';
  else if (/class\s*(9|10)|10th|9th/.test(t))                p.edu = '9-10';

  // Gender
  if      (/\b(female|girl|woman|she)\b/.test(t))   p.gender = 'Female';
  else if (/\b(male|boy|man|he)\b/.test(t))          p.gender = 'Male';

  // Stream
  if      (/btech|engineering/.test(t))       p.stream = 'engineering';
  else if (/\bscience\b|physics|chemistry/.test(t)) p.stream = 'science';
  else if (/medical|mbbs|biology/.test(t))    p.stream = 'medical';
  else if (/commerce|accounting/.test(t))     p.stream = 'commerce';
  else if (/arts|humanities/.test(t))         p.stream = 'arts';

  return p;
}
