/**
 * SCHEME FINDER — COLLEGE COMPARISON DATA
 * Static data for the College Compare panel.
 * Stage 2 will fetch this from the backend API.
 */

/** @type {Record<string, CollegeComparison>} */
export const COLLEGE_COMPARISONS = {

  iit: {
    label: 'IITs (BTech)',
    headers: ['Parameter', 'IIT Bombay', 'IIT Delhi'],
    rows: [
      ['NIRF Rank (2024)',     '3',                '2'],
      ['BTech Annual Fees',   '₹2.2L / year',     '₹2.0L / year'],
      ['Average Package',     '₹21 LPA',          '₹20 LPA'],
      ['Highest Package',     '₹3.67 Cr',         '₹2.5 Cr'],
      ['Scholarships',        'SC/ST free · PMRF', 'SC/ST free · PMRF'],
      ['BTech Seats',         '900+',             '850+'],
      ['JEE Adv. Cutoff',    '~100 rank',         '~50 rank'],
      ['Campus Location',     'Mumbai, MH',       'New Delhi'],
    ],
  },

  nit: {
    label: 'NITs (BTech)',
    headers: ['Parameter', 'NIT Trichy', 'NIT Warangal'],
    rows: [
      ['NIRF Rank (2024)',     '11',               '18'],
      ['BTech Annual Fees',   '₹1.4L / year',     '₹1.2L / year'],
      ['Average Package',     '₹12 LPA',          '₹11 LPA'],
      ['Highest Package',     '₹1.2 Cr',          '₹1.0 Cr'],
      ['Scholarships',        'NSP · Central Sector', 'NSP · Central Sector'],
      ['JEE Main Cutoff',     '~1,200 rank',       '~2,500 rank'],
      ['Campus Location',     'Tiruchirappalli, TN', 'Warangal, TS'],
    ],
  },

  central: {
    label: 'Central Universities',
    headers: ['Parameter', 'JNU Delhi', 'BHU Varanasi'],
    rows: [
      ['NIRF Rank (2024)',     '2 (Universities)', '5 (Universities)'],
      ['Annual Fees',          '₹400 / semester',  '₹3,000 / semester'],
      ['Scholarships',         'NSP · JRF · PMRF', 'NSP · JRF · PMRF'],
      ['Research Output',      'Very High',        'Very High'],
      ['CUET Required',        'Yes',              'Yes'],
      ['Hostel Available',     'Yes',              'Yes'],
      ['Campus Location',      'New Delhi',        'Varanasi, UP'],
    ],
  },

  medical: {
    label: 'Medical Colleges (MBBS)',
    headers: ['Parameter', 'AIIMS Delhi', 'JIPMER Pondicherry'],
    rows: [
      ['NIRF Rank (2024)',     '1 (Medical)',      '3 (Medical)'],
      ['MBBS Annual Fees',    '₹1,390 / year',    '₹5,000 / year'],
      ['NEET Cutoff 2024',    '~50 rank',         '~200 rank'],
      ['Intern Stipend',       '₹23,500 / month',  '₹18,000 / month'],
      ['Scholarships',         'NSP · State schemes', 'NSP · State schemes'],
      ['Seats (MBBS)',         '107',              '150'],
    ],
  },

  iim: {
    label: 'IIMs (MBA)',
    headers: ['Parameter', 'IIM Ahmedabad', 'IIM Bangalore'],
    rows: [
      ['NIRF Rank (2024)',     '1 (Management)',   '2 (Management)'],
      ['MBA Total Fees',       '₹34L total',       '₹32L total'],
      ['Average Package',      '₹33 LPA',          '₹32 LPA'],
      ['Scholarships',         'Need-based grants', 'Need-based grants'],
      ['CAT Cutoff',           '99.5 percentile+', '99 percentile+'],
      ['Batch Size',           '~400',             '~440'],
    ],
  },

};
