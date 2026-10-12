/**
 * SCHEME FINDER — SCHEMES DATA (Stage 1: Ministry of Education)
 *
 * Each scheme object contains:
 *   - metadata (id, name, icon, ministry, type, amount)
 *   - tags[]  — short display pills
 *   - eligFn(userProfile) → { score: 0–100, reasons: string[], blocks: string[] }
 *
 * Eligibility scoring rules:
 *   blocks.length === 0 && score >= 30  →  Fully Eligible ✅
 *   blocks.length  >  0                 →  Partially Eligible ⚠️  (blocked)
 *   score === 0                         →  Not Eligible ❌
 *
 * "blocks" are HARD disqualifiers (wrong category, wrong education level, etc.)
 * "reasons" are positive signals (income ok, marks sufficient, etc.)
 */

import { ELIGIBILITY_HELPERS as H } from '../utils/eligibility.js';

/** @type {SchemeDefinition[]} */
export const SCHEMES = [

  /* ─────────────────────────────────────────────────────────
     1. NSP POST-MATRIC SCHOLARSHIP
     Ministry of Education / National Scholarship Portal
     ───────────────────────────────────────────────────────── */
  {
    id:     'nsp-postmatric',
    ico:    '📖',
    col:    'sf',
    type:   'scholarship',
    name:   'NSP Post-Matric Scholarship',
    by:     'Ministry of Education',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹2,000 – ₹25,000 / year',
    amtNum: 25000,
    tags:   ['OBC/SC/ST/EWS/Minority', 'Income < ₹2.5L', 'Class 11 – PhD'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      // Hard block — category
      if (!H.isReserved(u.cat)) {
        blocks.push('Only for reserved categories: OBC / SC / ST / EWS / Minority');
        return { score: 0, reasons, blocks };
      }
      add(40, '✓ Category (OBC/SC/ST/EWS/Minority) matches');

      // Hard block — education level
      if (!H.EDU_POSTMATRIC.includes(u.edu)) {
        blocks.push('Must be studying Class 11 or above (post-matric)');
        return { score: 0, reasons, blocks };
      }
      add(30, '✓ Education level is post-matric (Class 11 – PhD)');

      // Income check
      if (H.incAtOrBelow(u.inc, '1to2.5')) {
        add(30, '✓ Family income is within the ₹2.5L limit');
      } else if (H.incAtOrBelow(u.inc, '2.5to4.5')) {
        blocks.push('Family income must be below ₹2.5 lakh per year (yours appears to exceed it)');
      } else {
        blocks.push('Family income must be below ₹2.5 lakh per year');
      }

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     2. CENTRAL SECTOR SCHOLARSHIP
     Ministry of Education (Merit-based, all categories)
     ───────────────────────────────────────────────────────── */
  {
    id:     'central-sector',
    ico:    '🌟',
    col:    'sf',
    type:   'scholarship',
    name:   'Central Sector Scholarship',
    by:     'Ministry of Education',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹10,000 – ₹20,000 / year',
    amtNum: 20000,
    tags:   ['All Categories', 'Top 12th Percentile', 'Income < ₹4.5L'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      // Must be UG or PG
      if (![...H.EDU_UG, 'pg'].includes(u.edu)) {
        blocks.push('Only for Undergraduate or Postgraduate students');
        return { score: 0, reasons, blocks };
      }
      add(30, '✓ Education level (UG/PG)');

      // Income
      if (H.incAtOrBelow(u.inc, '2.5to4.5')) {
        add(40, '✓ Family income within ₹4.5L limit');
      } else if (H.incAtOrBelow(u.inc, '4.5to8')) {
        add(15, '⚠ Income slightly above ₹4.5L limit — verify exact figure');
      } else {
        blocks.push('Family income must be below ₹4.5 lakh per year');
        return { score: 0, reasons, blocks };
      }

      // Marks (proxy for top-12th percentile)
      const marks = parseInt(u.marks) || 0;
      if      (marks >= 80) add(30, '✓ Strong marks ≥ 80% — likely in state top percentile');
      else if (marks >= 65) add(15, '⚠ Marks adequate but top-12th-percentile in state is required');
      else if (marks  >  0) add(5,  '⚠ Higher marks needed — scheme targets top percentile scorers');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     3. AICTE PRAGATI SCHOLARSHIP
     Girls in AICTE-approved technical courses
     ───────────────────────────────────────────────────────── */
  {
    id:     'aicte-pragati',
    ico:    '🏛️',
    col:    'gd',
    type:   'grant',
    name:   'AICTE Pragati Scholarship',
    by:     'AICTE',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹50,000 / year',
    amtNum: 50000,
    tags:   ['Girls Only', 'BTech / BE / MCA / Pharmacy', 'Income < ₹8L'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (u.gender !== 'Female') {
        blocks.push('Exclusively for female (girl) students');
        return { score: 0, reasons, blocks };
      }
      add(35, '✓ Female student');

      if (!H.EDU_TECH.includes(u.edu)) {
        blocks.push('Must be enrolled in an AICTE-approved technical course (BTech / BE / MCA / Pharmacy)');
        return { score: 0, reasons, blocks };
      }
      add(35, '✓ Technical course (BTech / BE)');

      if (H.incAtOrBelow(u.inc, '4.5to8')) {
        add(30, '✓ Family income within ₹8L limit');
      } else {
        blocks.push('Family income must be below ₹8 lakh per year');
      }

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     4. INSPIRE SCHOLARSHIP (DST)
     Science undergraduate students — top 1% Class 12
     ───────────────────────────────────────────────────────── */
  {
    id:     'inspire',
    ico:    '🔭',
    col:    'bl',
    type:   'scholarship',
    name:   'INSPIRE Scholarship (DST)',
    by:     'Dept. of Science & Technology',
    portal: 'https://online-inspire.gov.in/Account/Register',
    amt:    '₹80,000 / year',
    amtNum: 80000,
    tags:   ['Science / Medical Stream', 'BSc / MSc only', 'Top 1% Class 12'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      // Engineering students are NOT eligible — only pure science
      if (u.stream === 'engineering') {
        blocks.push('INSPIRE is for BSc/MSc science students, NOT BTech/BE engineering students');
        return { score: 0, reasons, blocks };
      }

      // Education level — BSc (ug-arts) or MSc (pg)
      if (!['ug-arts', 'pg'].includes(u.edu)) {
        blocks.push('Only for BSc or MSc (natural sciences) students — not available for BTech or Commerce');
        return { score: 0, reasons, blocks };
      }

      // Stream check
      if (u.stream === 'science' || u.stream === 'medical') {
        add(40, '✓ Science stream');
      } else {
        add(10, '⚠ Science / natural science stream is required');
      }

      // Marks — proxy for top 1% in state board
      const marks = parseInt(u.marks) || 0;
      if      (marks >= 90) add(40, '✓ Excellent marks ≥ 90% — likely in top 1% of state board');
      else if (marks >= 80) add(22, '⚠ Good marks, but top 1% in state board typically needs 90%+');
      else if (marks >= 70) add(8,  '⚠ Top 1% in state board required — marks below typical threshold');
      else if (marks  >  0) { blocks.push('Marks appear to be below the top 1% threshold for your state board'); }

      add(20, '✓ No income or category restriction');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     5. CSIR-UGC NET JRF
     Junior Research Fellowship via NET exam
     ───────────────────────────────────────────────────────── */
  {
    id:     'ugc-jrf',
    ico:    '🔬',
    col:    'bl',
    type:   'fellowship',
    name:   'CSIR-UGC NET JRF',
    by:     'UGC / CSIR',
    portal: 'https://ugcnet.nta.nic.in',
    amt:    '₹37,000 / month',
    amtNum: 444000,
    tags:   ['NET / JRF Qualified', 'Postgraduate', 'Any Category'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.EDU_PG_ABOVE.includes(u.edu)) {
        blocks.push('Must be at Postgraduate or PhD level to appear in NET/JRF');
        return { score: 0, reasons, blocks };
      }
      add(50, '✓ PG / PhD level eligible');
      add(30, '✓ No income or category restriction — open to all');
      reasons.push('ℹ You must qualify the UGC-NET or CSIR-NET exam to receive the fellowship');

      const marks = parseInt(u.marks) || 0;
      if (marks >= 60) add(20, '✓ Marks ≥ 60% (minimum requirement for NET)');
      else if (marks > 0) reasons.push('⚠ NET requires 50–60% in PG. Improve marks to be safe.');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     6. BEGUM HAZRAT MAHAL NATIONAL SCHOLARSHIP
     Maulana Azad Education Foundation — minority girls
     ───────────────────────────────────────────────────────── */
  {
    id:     'begum-hazrat',
    ico:    '👩‍🎓',
    col:    'gn',
    type:   'scholarship',
    name:   'Begum Hazrat Mahal Scholarship',
    by:     'Maulana Azad Education Foundation',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹5,000 – ₹12,000 / year',
    amtNum: 12000,
    tags:   ['Minority Girls', 'Class 9 – 12', 'Marks ≥ 50%'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (u.gender !== 'Female') {
        blocks.push('Exclusively for female (girl) students');
        return { score: 0, reasons, blocks };
      }
      if (!H.isMinority(u.cat)) {
        blocks.push('Only for minority community students: Muslim, Christian, Buddhist, Sikh, Jain, Parsi');
        return { score: 0, reasons, blocks };
      }
      add(40, '✓ Minority female student');

      if (!['9-10', '11-12'].includes(u.edu)) {
        blocks.push('Only for students in Class 9 to 12');
        return { score: 0, reasons, blocks };
      }
      add(30, '✓ Class 9–12 student');

      const marks = parseInt(u.marks) || 0;
      if      (marks >= 50) add(30, '✓ Marks ≥ 50% (minimum requirement met)');
      else if (marks  >  0) { blocks.push('Minimum 50% marks in last exam required'); }
      else                   add(15, 'ℹ 50% marks required — enter your marks to verify');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     7. PM RESEARCH FELLOWSHIP (PMRF)
     PhD students at IITs, NITs, IISc
     ───────────────────────────────────────────────────────── */
  {
    id:     'pmrf',
    ico:    '🎓',
    col:    'bl',
    type:   'fellowship',
    name:   'PM Research Fellowship (PMRF)',
    by:     'Ministry of Education',
    portal: 'https://www.pmrf.in',
    amt:    '₹70,000 – ₹80,000 / month',
    amtNum: 960000,
    tags:   ['PhD at IIT / NIT / IISc', 'CGPA ≥ 8.0', 'Any Category'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.EDU_PG_ABOVE.includes(u.edu)) {
        blocks.push('Only for PhD students or final-year UG/PG students transitioning to a PhD at IIT/NIT/IISc');
        return { score: 0, reasons, blocks };
      }
      add(40, '✓ PG / PhD level eligible for PMRF');

      const marks = parseInt(u.marks) || 0;
      if      (marks >= 80) add(40, '✓ Marks ≥ 80% (CGPA 8.0+ equivalent) — meets the bar');
      else if (marks >= 70) add(20, '⚠ CGPA ≥ 8.0 (roughly 80%+) is required');
      else if (marks  >  0) add(5,  '⚠ CGPA ≥ 8.0 required — your marks appear insufficient');

      add(20, '✓ No income or category restriction — purely merit-based');
      reasons.push('ℹ You must enrol in a PhD programme at IIT / NIT / IISc');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     8. AICTE SAKSHAM SCHOLARSHIP
     Specially-abled students in technical courses
     ───────────────────────────────────────────────────────── */
  {
    id:     'aicte-saksham',
    ico:    '♿',
    col:    'pu',
    type:   'grant',
    name:   'AICTE Saksham Scholarship',
    by:     'AICTE',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹30,000 / year',
    amtNum: 30000,
    tags:   ['Differently-Abled (≥40%)', 'Technical Courses', 'Any Category'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.EDU_TECH.includes(u.edu)) {
        blocks.push('Only for students in AICTE-approved technical courses (BTech / BE / MCA / Pharmacy / MBA)');
        return { score: 0, reasons, blocks };
      }
      if (u.disability !== 'Yes') {
        if (!u.disability) { add(20, 'ℹ Valid for students with ≥ 40% disability — confirm your disability status to finalise'); }
        else { blocks.push('Only for students with ≥ 40% disability (disability certificate required)'); return { score: 0, reasons, blocks }; }
      } else {
        add(40, '✓ ≥ 40% disability certificate');
      }
      add(60, '✓ Technical course (BTech / BE) — AICTE approved');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     9. MAULANA AZAD NATIONAL FELLOWSHIP
     Minority MPhil / PhD students
     ───────────────────────────────────────────────────────── */
  {
    id:     'maulana-azad',
    ico:    '☪️',
    col:    'gn',
    type:   'fellowship',
    name:   'Maulana Azad National Fellowship',
    by:     'Ministry of Minority Affairs',
    portal: 'https://www.minorityaffairs.gov.in',
    amt:    '₹25,000 – ₹28,000 / month',
    amtNum: 336000,
    tags:   ['Minority Students', 'MPhil / PhD', 'No Income Limit'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.isMinority(u.cat)) {
        blocks.push('Only for minority students: Muslim, Christian, Buddhist, Sikh, Jain, Parsi');
        return { score: 0, reasons, blocks };
      }
      add(50, '✓ Minority community');

      if (!H.EDU_PHD.includes(u.edu) && u.edu !== 'pg') {
        blocks.push('Only for MPhil / PhD level students');
        return { score: 0, reasons, blocks };
      }
      add(50, '✓ MPhil / PhD level');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     10. NSP PRE-MATRIC SCHOLARSHIP
     Class 9–10 reserved category students
     ───────────────────────────────────────────────────────── */
  {
    id:     'nsp-prematric',
    ico:    '📐',
    col:    'sf',
    type:   'scholarship',
    name:   'NSP Pre-Matric Scholarship',
    by:     'Ministry of Education',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹1,000 – ₹5,000 / year',
    amtNum: 5000,
    tags:   ['OBC / SC / ST / Minority', 'Class 9 – 10', 'Income < ₹2.5L'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.isReserved(u.cat)) {
        blocks.push('Only for reserved categories: OBC / SC / ST / EWS / Minority');
        return { score: 0, reasons, blocks };
      }
      add(40, '✓ Reserved category');

      if (!H.EDU_PREMATRIC.includes(u.edu)) {
        blocks.push('Only for students in Class 9 or 10 (pre-matric)');
        return { score: 0, reasons, blocks };
      }
      add(30, '✓ Pre-matric (Class 9–10)');

      if (H.incAtOrBelow(u.inc, '1to2.5')) {
        add(30, '✓ Family income within ₹2.5L limit');
      } else {
        blocks.push('Family income must be below ₹2.5 lakh per year');
      }

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     11. ISHAN UDAY SCHOLARSHIP (UGC)
     North-East state domicile students
     ───────────────────────────────────────────────────────── */
  {
    id:     'ishan-uday',
    ico:    '✈️',
    col:    'bl',
    type:   'scholarship',
    name:   'Ishan Uday Scholarship',
    by:     'UGC',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹5,400 – ₹7,800 / month',
    amtNum: 93600,
    tags:   ['North-East India ONLY', 'Undergraduate', 'Any Category'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.isNorthEast(u.state)) {
        blocks.push('Only for students with domicile in one of the 8 North-East states');
        return { score: 0, reasons, blocks };
      }
      add(60, '✓ North-East state domicile');

      if (H.EDU_UG.includes(u.edu)) {
        add(40, '✓ Undergraduate level');
      } else {
        blocks.push('Only for undergraduate (UG) students');
      }

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },


  /* ─────────────────────────────────────────────────────────
     12. PM-YASASVI SCHOLARSHIP
     OBC / EBC / DNT students via NTA exam
     ───────────────────────────────────────────────────────── */
  {
    id:     'pm-yasasvi',
    ico:    '⭐',
    col:    'gd',
    type:   'scholarship',
    name:   'PM-YASASVI Scholarship',
    by:     'Ministry of Social Justice',
    portal: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    amt:    '₹75,000 – ₹1.25L / year',
    amtNum: 125000,
    tags:   ['OBC / EBC / DNT', 'Class 9 to Degree', 'NTA Exam-Based'],

    eligFn(u) {
      const score = { val: 0 };
      const reasons = [], blocks = [];
      const add = (n, r) => { score.val += n; reasons.push(r); };

      if (!H.isOBC(u.cat) && !H.isEWS(u.cat)) {
        blocks.push('Only for OBC, EBC (Economically Backward Classes), DNT, NT, SNT communities');
        return { score: 0, reasons, blocks };
      }
      add(40, '✓ OBC / EBC community');

      if (H.incAtOrBelow(u.inc, '1to2.5')) {
        add(30, '✓ Income within limit (≤ ₹2.5L for Post-Matric variant)');
      } else {
        blocks.push('Income limit is ₹2.5L/year for most YASASVI variants');
      }

      add(30, 'ℹ Selection is through the YASASVI Entrance Test (YET) conducted by NTA');

      return { score: Math.min(score.val, 100), reasons, blocks };
    },
  },

]; // end SCHEMES
