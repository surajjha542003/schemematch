/**
 * SCHEME FINDER BACKEND — Scheme Eligibility Helpers
 *
 * Mirrors frontend/src/js/eligibility-engine.js + tn-schemes.js helper
 * functions. Kept as a separate CommonJS module (no shared bundler exists
 * in this project) — if you change category/education logic here, mirror
 * the change on the frontend copy too.
 */

// ── Income bracket comparison ──
const INC_ORDER = ['under1', '1to2.5', '2.5to4.5', '4.5to8', 'above8'];
function incAtOrBelow(userInc, limit) {
  const userIndex = INC_ORDER.indexOf(userInc);
  const limitIndex = INC_ORDER.indexOf(limit);
  return userIndex >= 0 && limitIndex >= 0 && userIndex <= limitIndex;
}

// ── Education level groups ──
const EDU_PREMATRIC   = ['9-10'];
const EDU_POSTMATRIC  = ['11-12', 'diploma', 'ug-arts', 'ug-tech', 'ug-medical', 'pg', 'phd'];
const EDU_UG          = ['ug-arts', 'ug-tech', 'ug-medical'];
const EDU_TECH        = ['ug-tech'];
const EDU_PG_ABOVE     = ['pg', 'phd'];
const EDU_PHD          = ['phd'];
const EDU_11_12        = ['11-12'];

// ── All-India category helpers ──
const MINORITY_CATS = ['Minority', 'Minority (Muslim)', 'Minority (Christian)', 'Minority (Buddhist)', 'Minority (Jain)', 'Minority (Sikh)'];
const RESERVED_CATS = ['OBC', 'SC', 'ST', 'BC', 'MBC', 'DNC', 'EWS', ...MINORITY_CATS];
function isMinority(cat) { return MINORITY_CATS.includes(cat); }
function isSC(cat) { return cat === 'SC'; }
function isST(cat) { return cat === 'ST'; }
function isOBC(cat) { return cat === 'OBC'; }
function isReserved(cat) { return RESERVED_CATS.includes(cat); }

// ── North-east states (Ishan Uday eligibility) ──
const NE_STATES = ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'];
function isNorthEast(state) { return NE_STATES.includes(state); }

// ── TN-specific category helpers (TN uses SC/ST/BC/MBC/DNC, distinct from all-India OBC) ──
function isBC(cat) { return cat === 'BC'; }
function isMBC(cat) { return cat === 'MBC'; }
function isDNC(cat) { return cat === 'DNC'; }
function isBCFamily(cat) { return isBC(cat) || isMBC(cat) || isDNC(cat); }
function isADWFamily(cat) { return isSC(cat) || isST(cat); }

// ── TN domicile hard-gate — every TN scheme requires TN residency ──
function tnDomicile(u, reasons, blocks) {
  if (u.state === 'Tamil Nadu') { reasons.push('✓ Tamil Nadu domicile'); return true; }
  if (!u.state) { blocks.push('Confirm Tamil Nadu domicile before checking this scheme'); return false; }
  blocks.push('Only for students domiciled in Tamil Nadu');
  return false;
}

module.exports = {
  INC_ORDER, incAtOrBelow,
  EDU_PREMATRIC, EDU_POSTMATRIC, EDU_UG, EDU_TECH, EDU_PG_ABOVE, EDU_PHD, EDU_11_12,
  isMinority, isSC, isST, isOBC, isReserved,
  isBC, isMBC, isDNC, isBCFamily, isADWFamily,
  NE_STATES, isNorthEast,
  tnDomicile,
};
