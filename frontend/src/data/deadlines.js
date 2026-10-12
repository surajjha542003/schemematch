/**
 * SCHEME FINDER — DEADLINES DATA
 * Scholarship application deadlines for 2025-26 session.
 *
 * urgency levels:
 *   'critical'  — ≤10 days  (red)
 *   'warning'   — ≤30 days  (gold)
 *   'safe'      — >30 days  (green)
 */

/** @type {DeadlineItem[]} */
export const DEADLINES = [
  {
    id:       'nsp-postmatric-2025',
    schemeId: 'nsp-postmatric',
    name:     'NSP Post-Matric Scholarship',
    by:       'Ministry of Education',
    amt:      '₹25,000 / year',
    day:      31,
    month:    'Oct',
    daysLeft: 8,
    urgency:  'critical',
    link:     'https://scholarships.gov.in',
  },
  {
    id:       'aicte-pragati-2025',
    schemeId: 'aicte-pragati',
    name:     'AICTE Pragati Scholarship',
    by:       'AICTE',
    amt:      '₹50,000 / year',
    day:      15,
    month:    'Nov',
    daysLeft: 23,
    urgency:  'warning',
    link:     'https://www.aicte-india.org',
  },
  {
    id:       'inspire-2025',
    schemeId: 'inspire',
    name:     'INSPIRE Scholarship (DST)',
    by:       'Dept. of Science & Technology',
    amt:      '₹80,000 / year',
    day:      30,
    month:    'Nov',
    daysLeft: 38,
    urgency:  'safe',
    link:     'https://online-inspire.gov.in',
  },
  {
    id:       'central-sector-2025',
    schemeId: 'central-sector',
    name:     'Central Sector Scholarship',
    by:       'Ministry of Education',
    amt:      '₹20,000 / year',
    day:      15,
    month:    'Dec',
    daysLeft: 53,
    urgency:  'safe',
    link:     'https://scholarships.gov.in',
  },
  {
    id:       'ugc-jrf-2025',
    schemeId: 'ugc-jrf',
    name:     'CSIR-UGC JRF / NET',
    by:       'UGC',
    amt:      '₹37,000 / month',
    day:      31,
    month:    'Dec',
    daysLeft: 69,
    urgency:  'safe',
    link:     'https://ugcnet.nta.nic.in',
  },
  {
    id:       'pm-yasasvi-2025',
    schemeId: 'pm-yasasvi',
    name:     'PM-YASASVI Scholarship',
    by:       'Ministry of Social Justice',
    amt:      '₹1.25L / year',
    day:      31,
    month:    'Jan',
    daysLeft: 93,
    urgency:  'safe',
    link:     'https://yet.nta.ac.in',
  },
];

/** Urgency → colour token map */
export const URGENCY_COLORS = {
  critical: { bg: 'var(--rdl)', text: 'var(--rd)', label: '⚡ URGENT' },
  warning:  { bg: 'var(--gdl)', text: 'var(--gd)', label: 'Soon' },
  safe:     { bg: 'var(--gnl)', text: 'var(--gn)', label: 'On track' },
};
