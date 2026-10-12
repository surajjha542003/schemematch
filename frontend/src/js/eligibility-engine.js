/* ════════════════════════════════════════════════
   Scheme Finder — Eligibility Engine & Scheme Database
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══════════════════════════════════════════════
//   REAL ELIGIBILITY ENGINE
//   Each scheme has explicit criteria functions
// ══════════════════════════════════════════════

// Income bracket comparison utility
const INC_ORDER = ['under1', '1to2.5', '2.5to4.5', '4.5to8', 'above8'];
function incAtOrBelow(userInc, limit) {
  const userIndex = INC_ORDER.indexOf(userInc);
  const limitIndex = INC_ORDER.indexOf(limit);
  return userIndex >= 0 && limitIndex >= 0 && userIndex <= limitIndex;
}

// Education level groups
const EDU_PREMATRIC = ['9-10'];
const EDU_POSTMATRIC = ['11-12', 'diploma', 'ug-arts', 'ug-tech', 'ug-medical', 'pg', 'phd'];
const EDU_UG = ['ug-arts', 'ug-tech', 'ug-medical'];
const EDU_TECH = ['ug-tech'];
const EDU_SCIENCE = ['ug-arts', 'pg']; // arts includes science streams separately
const EDU_PG_ABOVE = ['pg', 'phd'];
const EDU_PHD = ['phd'];
const EDU_DIPLOMA = ['diploma'];
const EDU_11_12 = ['11-12'];

// North-east states
const NE_STATES = ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'];

// Minority categories
const MINORITY_CATS = ['Minority', 'Minority (Muslim)', 'Minority (Christian)', 'Minority (Buddhist)', 'Minority (Jain)', 'Minority (Sikh)'];
const SC_CATS = ['SC'];
const ST_CATS = ['ST'];
const OBC_CATS = ['OBC'];
const RESERVED_CATS = ['OBC', 'SC', 'ST', 'BC', 'MBC', 'DNC', 'EWS', 'Minority', 'Minority (Muslim)', 'Minority (Christian)', 'Minority (Buddhist)', 'Minority (Jain)', 'Minority (Sikh)'];

function isMinority(cat) { return MINORITY_CATS.includes(cat); }
function isSC(cat) { return SC_CATS.includes(cat); }
function isST(cat) { return ST_CATS.includes(cat); }
function isOBC(cat) { return OBC_CATS.includes(cat); }
function isReserved(cat) { return RESERVED_CATS.includes(cat); }
function isNorthEast(state) { return NE_STATES.includes(state); }

// ─── SCHEME DATABASE with eligibility functions ───
// verified/confidence/source added 2026-09-09 after a research pass against
// official portals + secondary scholarship-info sites (see SCHEME_AUDIT.md).
// confidence:'low' = figure unconfirmed or sources conflict — treat as
// approximate and tell the user to check the official portal before relying
// on it.
const SCHEMES = [
  {
    id: 'nsp-postmatric',
    ico: '📖', col: 'sf', type: 'scholarship',
    name: 'NSP Post-Matric Scholarship',
    by: 'Ministry of Education',
    amt: '₹2,000–₹25,000/yr',
    amtNum: 25000,
    tags: ['OBC/SC/ST/EWS/Minority', 'Income ceiling varies by category', 'Class 11–PhD'],
    exclusiveGroup: 'central-maintenance-allowance', // NSP's "no dual central maintenance allowance" rule — see chat.js's handleMultipleScholarshipsQuery
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!isReserved(u.cat)) { blocks.push('Only for reserved categories (OBC/SC/ST/EWS/Minority)'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ Category matches');
      if (EDU_POSTMATRIC.includes(u.edu)) { score += 30; reasons.push('✓ Education level eligible (Class 11–PhD)'); }
      else { blocks.push('Must be Class 11 or above'); return { score: 0, reasons, blocks }; }
      if (isSC(u.cat) || isST(u.cat)) {
        if (incAtOrBelow(u.inc, '1to2.5')) { score += 30; reasons.push('✓ Income within ₹2.5L limit (SC/ST)'); }
        else { blocks.push('Income must be below ₹2.5L/year for SC/ST'); }
      } else {
        if (incAtOrBelow(u.inc, 'under1')) { score += 30; reasons.push('✓ Income within ₹1L (below the ₹1.5L OBC/EWS/Minority ceiling)'); }
        else if (incAtOrBelow(u.inc, '1to2.5')) { score += 15; reasons.push('⚠ OBC/EWS/Minority income ceiling is ₹1.5L (not ₹2.5L) — confirm your exact income before applying'); }
        else { blocks.push('Income must be below ₹1.5L/year for OBC/EWS/Minority'); }
      }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'central-sector',
    ico: '🌟', col: 'sf', type: 'scholarship',
    name: 'Central Sector Scheme of Scholarship (PM-USP)',
    by: 'Ministry of Education',
    amt: '₹12,000–₹20,000/yr',
    amtNum: 12000,
    tags: ['All Categories', 'Top 12th Graders', 'Income<₹4.5L'],
    exclusiveGroup: 'central-maintenance-allowance',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!EDU_UG.includes(u.edu) && u.edu !== 'pg') { blocks.push('Must be Undergraduate or Postgraduate'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Education level (UG/PG)');
      reasons.push(u.edu === 'pg' ? 'ℹ Amount ≈ ₹20,000/yr at PG level' : 'ℹ Amount ≈ ₹12,000/yr for UG years 1–3, rising to ₹20,000/yr in year 4–5 of a professional course');
      if (incAtOrBelow(u.inc, '2.5to4.5')) { score += 40; reasons.push('✓ Income below ₹4.5L'); }
      else if (incAtOrBelow(u.inc, '4.5to8')) { score += 20; reasons.push('⚠ Income slightly above limit'); }
      else { blocks.push('Income must be below ₹4.5L/year'); return { score: 0, reasons, blocks }; }
      const marks = parseInt(u.marks) || 0;
      if (marks >= 80) { score += 30; reasons.push('✓ Strong marks (≥80%) — likely top 12th grader'); }
      else if (marks >= 60) { score += 15; reasons.push('⚠ Marks adequate but top 12th percentile preferred'); }
      else if (marks > 0) { score += 5; reasons.push('⚠ Higher marks needed (top 12th rank in state)'); }
      else { score += 10; reasons.push('ℹ Top 12th percentile required — enter marks to verify'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'aicte-pragati',
    ico: '🏛️', col: 'gd', type: 'grant',
    name: 'AICTE Pragati Scholarship',
    by: 'AICTE',
    amt: '₹50,000/yr',
    amtNum: 50000,
    tags: ['Girl Students Only', 'Technical Courses', 'Income<₹8L', 'Max 2 girls/family'],
    exclusiveGroup: 'central-maintenance-allowance',
    verified: '2026-09-09', confidence: 'medium-high', source: 'https://www.aicte-india.org',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (u.gender !== 'Female') { blocks.push('Only for female (girl) students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ Female student');
      if (!EDU_TECH.includes(u.edu)) { blocks.push('Must be in AICTE-approved technical course (BTech/BE/MCA/MBA/Pharmacy)'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ Technical course (BTech/BE)');
      if (incAtOrBelow(u.inc, '4.5to8')) { score += 30; reasons.push('✓ Family income below ₹8L'); }
      else { blocks.push('Income must be below ₹8L/year'); reasons.push('⚠ Income limit ₹8L — check exact figure'); }
      reasons.push('ℹ Capped at 2 girls per family; must be admitted in 1st year');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'inspire',
    ico: '🔭', col: 'bl', type: 'scholarship',
    name: 'INSPIRE Scholarship (DST)',
    by: 'Dept. of Science & Technology',
    amt: '₹80,000/yr',
    amtNum: 80000,
    tags: ['Science Stream', 'Top 1% in Class 12', 'BSc/MSc Only'],
    verified: '2026-09-09', confidence: 'high', source: 'https://www.indiascienceandtechnology.gov.in',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      const validEdu = ['ug-arts', 'pg'];
      if (!validEdu.includes(u.edu) && u.edu !== '11-12') { blocks.push('Only for BSc/MSc (not BTech) — science stream UG/PG'); return { score: 0, reasons, blocks }; }
      if (u.stream === 'engineering') { blocks.push('Not for engineering students — BSc/MSc science only'); return { score: 0, reasons, blocks }; }
      if (u.stream === 'science' || u.stream === 'medical') { score += 40; reasons.push('✓ Science stream'); }
      else { score += 10; reasons.push('⚠ Science stream preferred for INSPIRE'); }
      const marks = parseInt(u.marks) || 0;
      if (marks >= 90) { score += 40; reasons.push('✓ Excellent marks — likely in top 1%'); }
      else if (marks >= 80) { score += 25; reasons.push('⚠ Good marks but top 1% in state board required'); }
      else if (marks >= 70) { score += 10; reasons.push('⚠ Top 1% in state board required — marks may be insufficient'); }
      else if (marks > 0) { blocks.push('Top 1% in state board required (typically 90%+)'); score = Math.max(score - 10, 0); }
      else { reasons.push('ℹ Top 1% in state board (≈90%+) required — enter marks to verify'); }
      score += 20; reasons.push('✓ No income/category restriction');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'ugc-jrf',
    ico: '🔬', col: 'bl', type: 'fellowship',
    name: 'CSIR-UGC NET JRF',
    by: 'UGC / CSIR',
    portal: 'https://csirnet.nta.nic.in',
    amt: '₹31,000–₹37,000/mo',
    amtNum: 408000,
    tags: ['NET/JRF Qualified', 'Postgraduate', 'Research'],
    durationYears: 5, // JRF tenure 2 yrs, auto-upgrades to SRF for up to 3 more on progress review
    renewal: { minAttendance: null, minMarks: null, noArrears: false, windowMonths: null,
      notes: 'Renewed via annual research progress review by the host institute/guide, not attendance or exam marks — JRF→SRF upgrade after 2 years is based on published/ongoing research work.' },
    verified: '2026-09-09', confidence: 'low',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!EDU_PG_ABOVE.includes(u.edu)) { blocks.push('Must be Postgraduate or PhD level'); return { score: 0, reasons, blocks }; }
      score += 50; reasons.push('✓ PG/PhD level');
      score += 30; reasons.push('✓ No income/category restriction');
      reasons.push('ℹ Must qualify UGC-NET/CSIR-NET exam for JRF');
      reasons.push('⚠ Stipend sources conflict (₹31,000–₹37,000/mo reported) — confirm the current rate at csirnet.nta.nic.in before relying on this figure');
      const marks = parseInt(u.marks) || 0;
      if (marks >= 60) { score += 20; reasons.push('✓ Good marks — NET qualifying score typically 50-60%'); }
      else if (marks > 0) { score += 5; reasons.push('⚠ NET qualifying score typically 50-60% — marks may be insufficient'); }
      else { score += 10; reasons.push('ℹ NET qualifying score typically 50–60% — enter marks to verify'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'begum-hazrat',
    ico: '👩‍🎓', col: 'gn', type: 'scholarship',
    name: 'Begum Hazrat Mahal Scholarship',
    by: 'Maulana Azad Education Foundation',
    amt: '₹5,000–₹6,000/yr',
    amtNum: 6000,
    tags: ['Minority Girls Only', 'Class 9–12', '50%+ Marks', 'Income ≤ ₹2L'],
    verified: '2026-09-09', confidence: 'high', source: 'https://maef.nic.in',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (u.gender !== 'Female') { blocks.push('Only for female students'); return { score: 0, reasons, blocks }; }
      if (!isMinority(u.cat)) { blocks.push('Only for minority community (Muslim/Christian/Buddhist/Sikh/Jain/Parsi)'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Minority female student');
      const validEdu = ['9-10', '11-12'];
      if (!validEdu.includes(u.edu)) { blocks.push('Only for Class 9–12 students'); return { score: 0, reasons, blocks }; }
      score += 25; reasons.push(u.edu === '9-10' ? '✓ Class 9–10 (₹5,000/yr)' : '✓ Class 11–12 (₹6,000/yr)');
      if (incAtOrBelow(u.inc, 'under1')) { score += 20; reasons.push('✓ Income within ₹2L limit'); }
      else if (incAtOrBelow(u.inc, '1to2.5')) { score += 10; reasons.push('⚠ Scheme ceiling is ₹2L — confirm exact income (bracket spans ₹1L–₹2.5L)'); }
      else { blocks.push('Family income must be below ₹2L/year'); }
      const marks = parseInt(u.marks) || 0;
      if (marks >= 50) { score += 25; reasons.push('✓ Marks above 50%'); }
      else if (marks > 0) { blocks.push('Minimum 50% marks required'); score += 5; }
      else { score += 10; reasons.push('ℹ 50%+ marks required — enter marks to verify'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'pmrf',
    ico: '🎓', col: 'bl', type: 'fellowship',
    name: 'PM Research Fellowship (PMRF)',
    by: 'Ministry of Education',
    amt: '₹70,000–₹80,000/mo',
    amtNum: 840000,
    tags: ['PhD at IITs/IISc/NITs', 'CGPA ≥ 8.0', 'Any Category'],
    durationYears: 5, // standard PhD fellowship tenure
    renewal: { minAttendance: null, minMarks: null, noArrears: false, windowMonths: null,
      notes: 'Renewed via annual research progress review by the host IIT/IISc PMRF coordinator, not attendance or exam marks.' },
    verified: '2026-09-09', confidence: 'high', source: 'https://www.indiascienceandtechnology.gov.in',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!EDU_PHD.includes(u.edu) && !EDU_PG_ABOVE.includes(u.edu)) { blocks.push('Only for PhD students or final year UG/PG transitioning to PhD'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ PhD/PG level eligible');
      const marks = parseInt(u.marks) || 0;
      if (marks >= 80) { score += 40; reasons.push('✓ Strong marks — CGPA 8.0+ equivalent'); }
      else if (marks >= 70) { score += 20; reasons.push('⚠ CGPA 8.0+ required — enter accurate marks'); }
      else if (marks > 0) { score += 5; reasons.push('⚠ CGPA 8.0 (≈80%+) required'); }
      score += 20; reasons.push('✓ No category/income restriction');
      reasons.push('ℹ Must join an IIT/IISc/IISER/NIT/select Central University for PhD; stipend rises each year (see amount above)');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'aicte-saksham',
    ico: '♿', col: 'pu', type: 'grant',
    name: 'AICTE Saksham Scholarship',
    by: 'AICTE',
    amt: '₹50,000/yr',
    amtNum: 50000,
    tags: ['Differently-Abled (40%+)', 'Technical Courses', 'Income<₹8L'],
    exclusiveGroup: 'central-maintenance-allowance',
    verified: '2026-09-09', confidence: 'high', source: 'https://www.aicte-india.org',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!EDU_TECH.includes(u.edu)) { blocks.push('Only for AICTE-approved technical courses (BTech/BE/MCA/Pharmacy)'); return { score: 0, reasons, blocks }; }
      if (u.disability !== 'Yes') {
        if (!u.disability) { reasons.push('ℹ For students with ≥40% disability — confirm your disability status to finalise'); score += 20; }
        else { blocks.push('Only for students with ≥40% disability (certificate required)'); return { score: 0, reasons, blocks }; }
      } else { score += 30; reasons.push('✓ ≥40% disability certificate'); }
      score += 40; reasons.push('✓ Technical course');
      if (incAtOrBelow(u.inc, '4.5to8')) { score += 30; reasons.push('✓ Family income below ₹8L'); }
      else { blocks.push('Family income must be below ₹8L/year'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'nsp-prematric',
    ico: '📐', col: 'sf', type: 'scholarship',
    name: 'NSP Pre-Matric Scholarship',
    by: 'Ministry of Education',
    amt: '₹1,000–₹5,000/yr',
    amtNum: 5000,
    tags: ['OBC/SC/ST/Minority', 'Class 9–10 Only', 'Income ceiling varies by category'],
    durationYears: 2, // Class 9 through Class 10
    renewal: { minAttendance: 75, minMarks: 60, noArrears: true, windowMonths: ['Aug', 'Sep'],
      notes: 'Standard NSP renewal rule: ≥75% attendance and passing all subjects each year; renewal application opens on NSP in Aug/Sep for the new academic year.' },
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!isReserved(u.cat)) { blocks.push('Only for reserved categories (OBC/SC/ST/EWS/Minority)'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ Reserved category');
      if (!EDU_PREMATRIC.includes(u.edu)) { blocks.push('Only for Class 9–10 students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Class 9–10');
      if (isOBC(u.cat)) {
        if (incAtOrBelow(u.inc, '1to2.5')) { score += 30; reasons.push('✓ Income within ₹2.5L limit (OBC)'); }
        else { blocks.push('Income must be below ₹2.5L/year for OBC'); }
      } else {
        if (incAtOrBelow(u.inc, 'under1')) { score += 30; reasons.push('✓ Income within ₹1L limit (SC/ST/Minority)'); }
        else { blocks.push('Income must be below ₹1L/year for SC/ST/Minority'); }
      }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'ishan-uday',
    ico: '✈️', col: 'bl', type: 'scholarship',
    name: 'Ishan Uday Scholarship',
    by: 'UGC',
    amt: '₹5,400–₹7,800/mo',
    amtNum: 93600,
    tags: ['North-East India ONLY', 'Undergraduate', 'Income<₹4.5L'],
    verified: '2026-09-09', confidence: 'high', source: 'https://www.indiascienceandtechnology.gov.in',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      if (!isNorthEast(u.state)) { blocks.push('Only for students domiciled in North-East states'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ North-East state');
      if (EDU_UG.includes(u.edu)) { score += 30; reasons.push('✓ Undergraduate level'); }
      else { blocks.push('Only for Undergraduate students'); }
      if (incAtOrBelow(u.inc, '4.5to8')) { score += 30; reasons.push('✓ Family income below ₹4.5L'); }
      else { blocks.push('Family income must be below ₹4.5L/year'); }
      reasons.push(u.stream === 'medical' || u.stream === 'engineering' ? 'ℹ Technical/medical course rate: ₹7,800/mo' : 'ℹ General course rate: ₹5,400/mo');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'pm-yasasvi',
    ico: '⭐', col: 'gd', type: 'scholarship',
    name: 'PM-YASASVI Scholarship',
    by: 'Ministry of Social Justice',
    amt: '₹75,000–₹1.25L/yr',
    amtNum: 125000,
    tags: ['OBC/EBC/DNT Students', 'Class 9 to Degree', 'Income ≤ ₹2.5L', '60%+ Marks'],
    exclusiveGroup: 'central-maintenance-allowance',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      let score = 0, reasons = [], blocks = [];
      const validCats = ['OBC', 'EWS'];
      if (!validCats.includes(u.cat) && !u.cat.startsWith('OBC')) { blocks.push('Only for OBC, EBC, DNT, NT, SNT communities'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ OBC/EBC community');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 30; reasons.push('✓ Income within ₹2.5L limit'); }
      else { blocks.push('Income limit is ₹2.5L'); }
      const marks = parseInt(u.marks) || 0;
      if (marks >= 60) { score += 25; reasons.push('✓ Marks ≥60% (min. required)'); }
      else if (marks > 0) { blocks.push('Minimum 60% marks required in qualifying exam'); }
      else { score += 10; reasons.push('ℹ 60%+ marks required — enter marks to verify'); }
      reasons.push('ℹ Selection is marks/NSP-portal based — confirm current-cycle process on scholarships.gov.in');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
];

