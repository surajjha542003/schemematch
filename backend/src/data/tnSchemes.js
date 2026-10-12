/**
 * SCHEME FINDER BACKEND — Tamil Nadu Scheme Dataset
 *
 * Mirrors frontend/src/js/tn-schemes.js. See that file's header for sources
 * (tnadw.tn.gov.in, bcw.tn.gov.in, Minority Welfare Dept, DOTE, Dept. of
 * Welfare of Differently Abled Persons, TN Construction Workers Welfare
 * Board) and the disclaimer that amounts/income limits are illustrative —
 * verify exact figures on official portals before applying.
 *
 * exclusiveGroup / conflictsWith drive backend/src/services/conflictEngine.js:
 *   'tn-fee-reimbursement' — schemes paying/waiving the SAME tuition/exam fee.
 *   'tn-merit-cash'        — standalone merit cash awards.
 *   'tn-welfare-grant'     — welfare-board grants tied to parent status/occupation.
 *   'tn-fellowship'        — postgraduate research fellowships.
 *
 * verified/confidence/source added 2026-09-09 after a research pass against
 * tnadw.tn.gov.in, bcw.tn.gov.in, DOTE/TNEA, and secondary scholarship-info
 * sites. confidence:'low' or conflicting-figure schemes carry an explicit
 * warning reason in eligFn() instead of a flat "✓" — don't silently present
 * an unconfirmed number as fact.
 */

const {
  incAtOrBelow,
  EDU_PREMATRIC, EDU_POSTMATRIC, EDU_UG, EDU_TECH, EDU_PG_ABOVE, EDU_11_12,
  isMinority, isBC, isBCFamily, isADWFamily,
  tnDomicile,
} = require('../utils/schemeHelpers');

const TN_SCHEMES = [

  // ─────────────── ADI DRAVIDAR & TRIBAL WELFARE (SC / ST) ───────────────
  {
    id: 'tn-adw-prematric', ico: '📗', col: 'sf', type: 'scholarship',
    name: 'TN Pre-Matric Scholarship (SC/ST)', by: 'Adi Dravidar & Tribal Welfare Dept, TN',
    portal: 'https://tnadw.tn.gov.in', amt: '≈₹3,500/yr', amtNum: 3500,
    tags: ['SC/ST', 'Class 9–10', 'Income ≤ ₹2.5L'], exclusiveGroup: 'tn-fee-reimbursement',
    durationYears: 2, // Class 9 through Class 10
    renewal: { minAttendance: 75, minMarks: 60, noArrears: true, windowMonths: ['Aug', 'Sep'],
      notes: 'Standard renewal rule: ≥75% attendance and passing all subjects each year; renewal window aligns with the new academic year in Aug/Sep.' },
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isADWFamily(u.cat)) { blocks.push('Only for SC/ST students (Adi Dravidar Welfare Dept)'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ SC/ST category');
      if (!EDU_PREMATRIC.includes(u.edu)) { blocks.push('Only for Class 9–10 students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Class 9–10');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 35; reasons.push('✓ Family income within ₹2.5L limit'); }
      else { blocks.push('Family income must be ≤ ₹2.5 lakh/year'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-adw-postmatric-school', ico: '📘', col: 'sf', type: 'scholarship',
    name: 'TN Post-Matric Scholarship — School (SC/ST)', by: 'Adi Dravidar & Tribal Welfare Dept, TN',
    portal: 'https://tnadw.tn.gov.in', amt: 'Tuition + exam fee waived', amtNum: 6000,
    tags: ['SC/ST', 'Class 11–12', 'Income ≤ ₹2.5L'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isADWFamily(u.cat)) { blocks.push('Only for SC/ST students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ SC/ST category');
      if (!EDU_11_12.includes(u.edu)) { blocks.push('Only for Class 11–12 (+1/+2) students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Class 11–12');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 35; reasons.push('✓ Family income within ₹2.5L limit'); }
      else { blocks.push('Family income must be ≤ ₹2.5 lakh/year'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-adw-postmatric-college', ico: '🎓', col: 'sf', type: 'scholarship',
    name: 'TN Post-Matric Scholarship — College (SC/ST)', by: 'Adi Dravidar & Tribal Welfare Dept, TN',
    portal: 'https://tnadw.tn.gov.in', amt: 'Tuition + ₹230–₹1,200/mo Hostel', amtNum: 60000,
    tags: ['SC/ST', 'UG/PG/Diploma/ITI/PhD', 'Income ≤ ₹2.5L'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isADWFamily(u.cat)) { blocks.push('Only for SC/ST students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ SC/ST category');
      if (!EDU_POSTMATRIC.includes(u.edu)) { blocks.push('Only for Class 11 and above (post-matric)'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Post-matric level (UG/PG/Diploma/ITI/PhD)');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 35; reasons.push('✓ Family income within ₹2.5L limit'); }
      else { blocks.push('Family income must be ≤ ₹2.5 lakh/year'); }
      reasons.push('ℹ Hostel allowance ₹230–₹1,200/month (10 months, amount depends on course/level) if in government hostel — the "amtNum" used for ranking is an approximation, not a fixed official figure');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-adw-cm-merit-award', ico: '🏅', col: 'gd', type: 'scholarship',
    name: "Chief Minister's Merit Award (SC/ST)", by: 'Adi Dravidar & Tribal Welfare Dept, TN',
    portal: 'https://tnadw.tn.gov.in', amt: '₹3,000/yr for 5 years', amtNum: 3000,
    tags: ['SC/ST', 'Top +2 rank holders', 'No income limit'], exclusiveGroup: 'tn-merit-cash',
    verified: '2026-09-09', confidence: 'high',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isADWFamily(u.cat)) { blocks.push('Only for SC/ST/Adi Dravidar-converted-Christian students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ SC/ST category');
      if (!EDU_UG.includes(u.edu) && u.edu !== '11-12') { blocks.push('For students who just completed Class 12 and are entering UG'); return { score: 0, reasons, blocks }; }
      score += 20; reasons.push('✓ Post-12th stage');
      const marks = parseInt(u.marks) || 0;
      if (marks >= 90) { score += 50; reasons.push('✓ Marks ≥90% — strong chance among top 1,000 boys/1,000 girls statewide'); }
      else if (marks >= 75) { score += 25; reasons.push('⚠ Award is rank-based (top 1,000 boys/1,000 girls in state) — 90%+ typically needed'); }
      else if (marks > 0) { blocks.push('Award is merit-ranked statewide — marks appear too low to be competitive'); }
      else { reasons.push('ℹ Award is merit-ranked statewide (90%+ typically needed) — enter marks to verify'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-adw-iit-iim-nit', ico: '🏛️', col: 'bl', type: 'scholarship',
    name: 'SC/ST Scholarship for IIT/IIM/NIT/Central University', by: 'Adi Dravidar & Tribal Welfare Dept, TN',
    portal: 'https://tnadw.tn.gov.in', amt: 'Up to ₹2,00,000/yr', amtNum: 200000,
    tags: ['SC/ST', 'IIT/IIM/NIT/Central Univ', 'Income ≤ ₹2.5L'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'low',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isADWFamily(u.cat)) { blocks.push('Only for SC/ST students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ SC/ST category');
      if (!EDU_UG.includes(u.edu) && u.edu !== 'pg') { blocks.push('Only for UG/PG students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ UG/PG level');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 25; reasons.push('✓ Family income within ₹2.5L limit'); }
      else { blocks.push('Family income must be ≤ ₹2.5 lakh/year'); }
      reasons.push('ℹ Only applicable if admitted to an IIT / IIM / NIT / IIIT / Central University — confirm your institute');
      reasons.push('⚠ The ₹2,00,000/yr cap could not be independently confirmed — verify the exact figure at tnadw.tn.gov.in before relying on it');
      score += 15;
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-adw-medical-75', ico: '🩺', col: 'pu', type: 'grant',
    name: 'Medical Course Fee Reimbursement — 7.5% Reservation (SC/ST)', by: 'Adi Dravidar & Tribal Welfare Dept, TN',
    portal: 'https://tnadw.tn.gov.in', amt: 'Full Course Fee + Hostel', amtNum: 150000,
    tags: ['SC/ST', 'Govt school alumni', 'MBBS/BDS/Medical', 'Income ≤ ₹2.5L'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isADWFamily(u.cat)) { blocks.push('Only for SC/ST students admitted under the 7.5% government-school-quota reservation'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ SC/ST category');
      if (u.stream !== 'medical') { blocks.push('Only for Medical / MBBS / BDS courses'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Medical stream');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 25; reasons.push('✓ Family income within ₹2.5L limit'); }
      else { blocks.push('Family income must be ≤ ₹2.5 lakh/year'); }
      reasons.push('ℹ Only for students who studied Class 6–12 in a Tamil Nadu government school');
      reasons.push('ℹ The 7.5% quota itself (per G.O. Ms No.6 ADW Dept 2012 / G.O. Ms No.51 2013) is open to ALL govt-school students; this specific fee exemption applies to SC/ST admits under it. Benefit is an uncapped fee waiver, not a fixed ₹1,50,000 — the amtNum shown is illustrative for ranking only.');
      score += 15;
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },

  // ─────────────── BACKWARD CLASSES / MBC / DNC WELFARE ───────────────
  {
    id: 'tn-bcmbc-prematric-girls', ico: '👧', col: 'gn', type: 'scholarship',
    name: 'Pre-Matric Scholarship for Girls (BC/MBC/DNC)', by: 'BC/MBC/Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: '₹4,000/yr', amtNum: 4000,
    tags: ['BC/MBC/DNC Girls', 'Class 9–10', 'Govt school'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium', source: 'https://bcw.tn.gov.in/sub_page/8',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (u.gender !== 'Female') { blocks.push('Exclusively for girl students'); return { score: 0, reasons, blocks }; }
      if (!isBCFamily(u.cat)) { blocks.push('Only for BC/MBC/DNC category students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ BC/MBC/DNC girl student');
      if (!EDU_PREMATRIC.includes(u.edu)) { blocks.push('Only for Class 9–10 students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Class 9–10');
      if (isBC(u.cat) && !incAtOrBelow(u.inc, '1to2.5')) { blocks.push('BC category requires family income ≤ ₹2.5 lakh/year'); }
      else { score += 35; reasons.push(isBC(u.cat) ? '✓ Family income within ₹2.5L limit' : '✓ No income ceiling for MBC/DNC'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-bcmbc-postmatric-school', ico: '📙', col: 'gn', type: 'scholarship',
    name: 'Post-Matric Scholarship — School (BC/MBC/DNC)', by: 'BC/MBC/Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: 'Exam fee + tuition/special fee waived', amtNum: 6000,
    tags: ['BC/MBC/DNC', 'Class 11–12', 'Govt/aided school'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'high', source: 'https://bcw.tn.gov.in/sub_page/8',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isBCFamily(u.cat)) { blocks.push('Only for BC/MBC/DNC category students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ BC/MBC/DNC category');
      if (!EDU_11_12.includes(u.edu)) { blocks.push('Only for Class 11–12 (+1/+2) students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Class 11–12');
      if (isBC(u.cat) && !incAtOrBelow(u.inc, '1to2.5')) { blocks.push('BC category requires family income ≤ ₹2.5 lakh/year'); }
      else { score += 35; reasons.push(isBC(u.cat) ? '✓ Family income within ₹2.5L limit' : '✓ No income ceiling for MBC/DNC'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-bcmbc-postmatric-college', ico: '🎓', col: 'gn', type: 'scholarship',
    name: 'Post-Matric Scholarship — College (BC/MBC/DNC)', by: 'BC/MBC/Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: 'Tuition + Exam fee + Hostel', amtNum: 55000,
    tags: ['BC/MBC/DNC', 'UG/PG/Diploma/ITI/PhD'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium', source: 'https://bcw.tn.gov.in/sub_page/8',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isBCFamily(u.cat)) { blocks.push('Only for BC/MBC/DNC category students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ BC/MBC/DNC category');
      if (!EDU_POSTMATRIC.includes(u.edu)) { blocks.push('Only for Class 11 and above (post-matric)'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Post-matric level');
      const isProfessional = EDU_TECH.includes(u.edu) || u.edu === 'ug-medical' || u.edu === 'diploma';
      const isFirstGenUGArts = !isProfessional && u.edu === 'ug-arts' && u.firstGrad === 'Yes';
      if (isFirstGenUGArts) {
        score += 35; reasons.push('✓ No income ceiling — UG Degree (Arts/Science) + confirmed First Generation Graduate');
      } else if (incAtOrBelow(u.inc, '1to2.5')) {
        score += 35; reasons.push('✓ Family income within ₹2.5L limit');
      } else if (u.cat === 'OBC' || u.cat === 'BC') {
        blocks.push('Family income must be ≤ ₹2.5 lakh/year for BC category');
      } else {
        score += 35; reasons.push('✓ No income ceiling for MBC/DNC category');
      }
      reasons.push('ℹ Covers full tuition/special/exam fee (free education); hostel allowance ₹400/month if in government hostel — the "amtNum" figure is an estimate of full college benefit');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-bcmbc-iit-iim', ico: '🏛️', col: 'bl', type: 'scholarship',
    name: 'BC/MBC Scholarship for IIT/IIM/NIT/Central Institutions', by: 'BC/MBC/Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: 'Up to ₹2,00,000/yr', amtNum: 200000,
    tags: ['BC/MBC/DNC', 'IIT/IIM/NIT/IIIT/Central Univ', 'Income ≤ ₹2.5L'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium', source: 'https://bcw.tn.gov.in/sub_page/8',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isBCFamily(u.cat)) { blocks.push('Only for BC/MBC/DNC category students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ BC/MBC/DNC category');
      if (!EDU_UG.includes(u.edu) && u.edu !== 'pg') { blocks.push('Only for UG/PG students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ UG/PG level');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 25; reasons.push('✓ Family income within ₹2.5L limit'); }
      else { blocks.push('Family income must be ≤ ₹2.5 lakh/year'); }
      reasons.push('ℹ Only applicable if admitted to an IIT / IIM / NIT / IIIT / Central University — confirm your institute');
      score += 15;
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-bc-free-hostel', ico: '🏠', col: 'gn', type: 'free-hostel',
    name: 'Free Boarding & Lodging in BC/MBC Hostels', by: 'BC/MBC/Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: '≈₹2,000/yr', amtNum: 2000,
    tags: ['BC/MBC/DNC', 'School & College', 'Income ≤ ₹1L'],
    verified: '2026-09-09', confidence: 'medium', source: 'https://bcw.tn.gov.in/sub_page/8',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isBCFamily(u.cat)) { blocks.push('Only for BC/MBC/DNC category students'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ BC/MBC/DNC category');
      score += 30; reasons.push('✓ Open to school & college students');
      if (incAtOrBelow(u.inc, 'under1')) { score += 30; reasons.push('✓ Family income within ₹1L limit for free hostel admission'); }
      else { blocks.push('Free hostel admission requires family income ≤ ₹1 lakh/year'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-kallam-periyar-hostel', ico: '🏢', col: 'pu', type: 'free-hostel',
    name: 'Periyar Memorial Model Hostel (PG)', by: 'BC/MBC/Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: '≈₹20,000/yr', amtNum: 2000,
    tags: ['BC/MBC/DNC', 'PG students', 'Income ≤ ₹1L'],
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isBCFamily(u.cat)) { blocks.push('Only for BC/MBC/DNC category students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ BC/MBC/DNC category');
      if (u.edu !== 'pg') { blocks.push('Exclusively for Postgraduate (PG) students'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ Postgraduate level');
      if (incAtOrBelow(u.inc, 'under1')) { score += 30; reasons.push('✓ Family income within ₹1L limit'); }
      else { blocks.push('Requires family income ≤ ₹1 lakh/year'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },

  // ─────────────── MINORITY WELFARE ───────────────
  {
    id: 'tn-minority-prematric', ico: '🕌', col: 'pk', type: 'scholarship',
    name: 'Pre-Matric Scholarship (Minority)', by: 'Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: '≈₹2,000/yr', amtNum: 2000,
    tags: ['Minority', 'Class 1–10', 'Income < ₹1L'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isMinority(u.cat)) { blocks.push('Only for notified minority students (Muslim/Christian/Sikh/Buddhist/Jain/Parsi)'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ Minority community');
      if (!EDU_PREMATRIC.includes(u.edu)) { blocks.push('Only for Class 1–10 students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ School level (Class 1–10)');
      if (incAtOrBelow(u.inc, 'under1')) { score += 35; reasons.push('✓ Family income below ₹1L limit'); }
      else { blocks.push('Family income must be below ₹1 lakh/year for pre-matric minority scholarship'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-minority-postmatric', ico: '☪️', col: 'pk', type: 'scholarship',
    name: 'Post-Matric Scholarship (Minority)', by: 'Minority Welfare Dept, TN',
    portal: 'https://bcw.tn.gov.in', amt: '≈₹20,000/yr', amtNum: 20000,
    tags: ['Minority', 'Class 11–PhD', 'Income ≤ ₹2L', 'Marks ≥ 50%'], exclusiveGroup: 'tn-fee-reimbursement',
    verified: '2026-09-09', confidence: 'medium-high', source: 'https://www.tntribalwelfare.tn.gov.in/scholarship_post_matric.php',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!isMinority(u.cat)) { blocks.push('Only for notified minority students'); return { score: 0, reasons, blocks }; }
      score += 30; reasons.push('✓ Minority community');
      if (!EDU_POSTMATRIC.includes(u.edu)) { blocks.push('Only for Class 11 and above (post-matric)'); return { score: 0, reasons, blocks }; }
      score += 25; reasons.push('✓ Post-matric level');
      if (incAtOrBelow(u.inc, 'under1')) { score += 25; reasons.push('✓ Family income within ₹2L limit'); }
      else if (incAtOrBelow(u.inc, '1to2.5')) { score += 12; reasons.push('⚠ Official ceiling is ₹2L, not ₹2.5L — confirm your exact income (this bracket spans ₹1L–₹2.5L)'); }
      else { blocks.push('Family income must be ≤ ₹2 lakh/year'); }
      const marks = parseInt(u.marks) || 0;
      if (marks >= 50) { score += 20; reasons.push('✓ Marks ≥ 50%'); }
      else if (marks > 0) { blocks.push('Minimum 50% marks required in previous exam'); }
      else { score += 10; reasons.push('ℹ 50%+ marks required — enter marks to verify'); }
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },

  // ─────────────── FIRST GENERATION GRADUATE ───────────────
  {
    id: 'tn-first-graduate', ico: '🌱', col: 'gd', type: 'scholarship',
    name: 'TN First Graduate Scholarship', by: 'Higher Education Dept, TN',
    portal: 'https://www.tneaonline.org/user/register', amt: '₹25,000 + Tuition fee', amtNum: 25000,
    tags: ['No caste/income limit', 'TNEA counseling', 'First graduate in family'], exclusiveGroup: 'tn-fee-reimbursement',
    conflictsWith: ['tn-adw-postmatric-college', 'tn-bcmbc-postmatric-college'],
    verified: '2026-09-09', confidence: 'high', source: 'https://static.tneaonline.org/docs/11_FG_PMSS_2025.pdf',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (u.firstGrad !== 'Yes') {
        if (!u.firstGrad) { reasons.push('ℹ For first graduates in family — confirm "First Generation Graduate" status'); score += 20; }
        else { blocks.push('Only for students certified as the first graduate in their family'); return { score: 0, reasons, blocks }; }
      } else { score += 50; reasons.push('✓ First generation graduate in family'); }
      if (!EDU_UG.includes(u.edu)) { blocks.push('Only for Professional UG Degree courses (Engineering, Medical, Agri, etc.) admitted via single-window counseling'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ Professional UG degree level');
      score += 15; reasons.push('ℹ Must be admitted via single-window counseling (TNEA) in a government quota seat — tuition fee waiver + ₹25,000/yr covers the tuition portion');
      reasons.push('✓ No caste or income restriction');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },

  // ─────────────── WELFARE-BOARD GRANTS ───────────────
  {
    id: 'tn-differently-abled-wards', ico: '♿', col: 'pu', type: 'grant',
    name: 'Scholarship for Son/Daughter of Differently-Abled Persons', by: 'Dept. of Welfare of Differently Abled Persons, TN',
    portal: 'https://scd.tn.gov.in', amt: '₹4,000–₹12,500/yr', amtNum: 6000,
    tags: ['Parent is Differently-Abled', 'Class 11 onward', 'No income limit'], exclusiveGroup: 'tn-welfare-grant',
    verified: '2026-09-09', confidence: 'low',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (u.parentDisabled !== 'Yes') {
        if (!u.parentDisabled) { reasons.push('ℹ For children of a certified differently-abled parent — confirm parent disability status'); score += 20; }
        else { blocks.push('Only for children whose parent holds a valid disability certificate'); return { score: 0, reasons, blocks }; }
      } else { score += 50; reasons.push('✓ Parent holds disability certificate'); }
      if (!EDU_POSTMATRIC.includes(u.edu)) { blocks.push('Only for Class 11 and above'); return { score: 0, reasons, blocks }; }
      score += 35; reasons.push('✓ Class 11 and above');
      reasons.push('✓ No family income limit');
      reasons.push('⚠ Amount figure is unconfirmed — secondary sources conflict (₹4,000–₹12,500/yr range reported depending on class); verify the current amount with the Commissionerate for Welfare of the Differently Abled before applying');
      score += 15;
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-construction-workers', ico: '👷', col: 'gd', type: 'grant',
    name: 'Educational Assistance — Construction Workers Welfare Board', by: 'TN Construction Workers Welfare Board',
    portal: 'https://tnuwwb.tn.gov.in/users/login', amt: 'Up to ₹50,000/yr', amtNum: 50000,
    tags: ['Parent = Registered Construction Worker', 'Class 1–PG'], exclusiveGroup: 'tn-welfare-grant',
    verified: '2026-09-09', confidence: 'medium',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (u.parentOcc !== 'construction') {
        if (!u.parentOcc) { reasons.push('ℹ Only if a parent is a Welfare-Board-registered construction worker — confirm parent occupation'); score += 15; }
        else { blocks.push('Only for children of a Welfare-Board-registered construction worker'); return { score: 0, reasons, blocks }; }
      } else { score += 60; reasons.push('✓ Parent registered with Construction Workers Welfare Board'); }
      score += 40; reasons.push('✓ Open to all education levels (amount scales with class — school tuition assistance up to a ₹50,000/yr living allowance + full fees for IIT/IIM/govt-medical admits; separate PhD and Nursing/Catering diploma tiers also exist)');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
  {
    id: 'tn-cm-relief-fund-betech', ico: '🛟', col: 'rd', type: 'grant',
    name: "Chief Minister's Public Relief Fund — BE/BTech Assistance", by: "Chief Minister's Public Relief Fund, TN",
    portal: 'https://dte.tn.gov.in/schemes-engineering-students', amt: '₹50,000/yr', amtNum: 50000,
    tags: ['Economically Weaker', 'BE/BTech only', 'Discretionary'], exclusiveGroup: 'tn-welfare-grant',
    verified: '2026-09-09', confidence: 'high', source: 'https://dte.tn.gov.in/schemes-engineering-students',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!EDU_TECH.includes(u.edu)) { blocks.push('Only for BE/BTech students'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ BE/BTech course');
      if (incAtOrBelow(u.inc, '1to2.5')) { score += 40; reasons.push('✓ Economically weaker family (income ≤ ₹2.5L, an assumed proxy — no numeric ceiling is officially published)'); }
      else { blocks.push('Targeted at economically weaker section families — income appears above typical threshold'); }
      reasons.push('ℹ Discretionary — sanctioned case-by-case via MLA/MP recommendation or district collector. First Generation Graduates are also cited as a target group.');
      score += 20;
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },

  // ─────────────── RESEARCH FELLOWSHIP ───────────────
  {
    id: 'tn-cm-fellowship-pg', ico: '🔬', col: 'bl', type: 'fellowship',
    name: "Chief Minister's Fellowship Programme", by: 'Government of Tamil Nadu',
    portal: 'https://bim.edu/index/tncmfp/', amt: '₹75,000/mo for 2 years', amtNum: 900000,
    tags: ['PG/Research', 'Age 22–30 (relaxed for SC/ST/BC/MBC)', 'TN permanent resident'], exclusiveGroup: 'tn-fellowship',
    verified: '2026-09-09', confidence: 'high',
    eligFn(u) {
      const reasons = [], blocks = []; let score = 0;
      if (!tnDomicile(u, reasons, blocks)) return { score: 0, reasons, blocks };
      if (!EDU_PG_ABOVE.includes(u.edu)) { blocks.push('Only for postgraduate/research-stage candidates'); return { score: 0, reasons, blocks }; }
      score += 40; reasons.push('✓ PG/research stage');
      let maxAge = 30;
      if (isADWFamily(u.cat)) maxAge = 35;
      else if (isBCFamily(u.cat)) maxAge = 33;
      const age = parseInt(u.age) || 0;
      if (age >= 22 && age <= maxAge) { score += 40; reasons.push(`✓ Age within 22–${maxAge} range` + (maxAge > 30 ? ' (relaxed for your category)' : '')); }
      else if (age > 0) { blocks.push(`Age must be between 22 and ${maxAge} at time of application` + (maxAge > 30 ? ' (relaxed upper limit for SC/ST/BC/MBC)' : '')); }
      else { score += 15; reasons.push(`ℹ Age 22–${maxAge} required (upper limit relaxed for SC/ST to 35, BC/MBC to 33) — enter age to verify`); }
      score += 20; reasons.push('ℹ 2-year fixed-term fellowship, not a recurring annual scholarship');
      return { score: Math.min(score, 100), reasons, blocks };
    }
  },
];

module.exports = { TN_SCHEMES };
