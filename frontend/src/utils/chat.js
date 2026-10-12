/**
 * SCHEME FINDER — AI CHAT REPLY ENGINE
 *
 * Pattern-match based reply system.
 * Returns HTML strings — rendered inside chat bubbles.
 *
 * Depends on:
 *   - utils/eligibility.js  (live profile scoring)
 *   - data/schemes.js       (SCHEMES array)
 *
 * Zero direct DOM manipulation.
 */

import { SCHEMES } from '../data/schemes.js';
import {
  scoreAllSchemes,
  parseProfileFromText,
  scoreToColor,
} from './eligibility.js';

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** HTML-escape a user string before embedding in reply HTML */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Quick-reply button HTML */
const qb = (label, query) =>
  `<div class="cqb" data-query="${esc(query)}">${label}</div>`;

/** Scheme card HTML for chat */
function schemeCard(s) {
  return `
  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">${s.name}</div>
      <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;
        background:var(--${s.col}l, var(--sfl));color:${scoreToColor(s.score || 50)}">
        ${s.score ? s.score + '%' : ''}
      </span>
    </div>
    <div class="csc-amt">${s.amt}</div>
    ${s.score ? `
    <div class="cebar">
      <div class="ceb"><div class="cebf" style="width:${s.score}%;background:${scoreToColor(s.score)}"></div></div>
      <div class="cepc" style="color:${scoreToColor(s.score)}">${s.score}% match</div>
    </div>` : ''}
    ${s.reasons?.length ? `<div style="font-size:11.5px;color:var(--gn);margin-bottom:7px">${s.reasons.slice(0,2).join(' · ')}</div>` : ''}
    <div class="csc-btns">
      <button class="csc-bp" data-query="How to apply for ${s.name}?">How to Apply</button>
      <button class="csc-bs" data-query="${s.name} documents required">Documents</button>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
//  MAIN REPLY FUNCTION
// ─────────────────────────────────────────────

/**
 * Generate an AI reply HTML string for a given user message.
 *
 * @param {string}      rawText        — user's raw message
 * @param {UserProfile} currentProfile — app-level user profile state
 * @returns {string}                   — HTML string for the reply bubble
 */
export function generateReply(rawText, currentProfile = {}) {
  const t = rawText.toLowerCase().trim();

  // ── 1. Greetings ──────────────────────────────────────────
  if (/^(hi+|hello+|hey+|namaste|namaskar|hii+|helo)/i.test(t)) {
    const name = currentProfile.name ? `, ${currentProfile.name.split(' ')[0]}` : '';
    return `Hey${name}! How can I help today?
    <div class="cqr">
      ${qb('Find my scholarships', 'What scholarships can I apply for?')}
      ${qb('NSP details', 'NSP Post-Matric Scholarship details')}
      ${qb('JEE tips', 'JEE Main 2026 preparation tips')}
      ${qb('Income certificate', 'How to get income certificate?')}
    </div>`;
  }

  // ── 2. Thanks / Bye ───────────────────────────────────────
  if (/^(thanks?|thank you|dhanyawad|shukriya|bye|goodbye)/i.test(t)) {
    return `You're most welcome! Best of luck with your applications!<br>
    Remember — <strong>NSP deadline is October 31</strong> — apply now at scholarships.gov.in!`;
  }

  // ── 3. Self-description → live eligibility match ──────────
  const hasCat    = /\b(obc|sc\b|st\b|ews|minority|general)\b/i.test(t);
  const hasEdu    = /\b(btech|be\b|bsc|ba\b|phd|pg|msc|class\s*\d+|degree|diploma)\b/i.test(t);
  const hasIncome = /\d+\s*(lakh|lac|l\b)/i.test(t);

  if (hasCat || (hasEdu && hasIncome)) {
    const tempProfile = parseProfileFromText(rawText, currentProfile);
    const { eligible, partial } = scoreAllSchemes(SCHEMES, tempProfile);

    if (eligible.length === 0 && partial.length === 0) {
      return `Based on what you've told me, I didn't find any direct matches. This might be because:
      <br>${!tempProfile.cat  ? '• <strong>Category unclear</strong> — mention OBC/SC/ST/General<br>' : ''}
      ${!tempProfile.edu  ? '• <strong>Education level unclear</strong> — mention class, BTech, etc.<br>' : ''}
      ${!tempProfile.inc  ? '• <strong>Income not mentioned</strong> — add annual family income<br>' : ''}
      <div class="cqr">
        ${qb('Eligibility Checker', '__panel:eligibility')}
        ${qb('General category schemes', 'What scholarships are available for General category students?')}
      </div>`;
    }

    const top = eligible.slice(0, 3);
    return `I found <strong>${eligible.length} eligible scheme${eligible.length !== 1 ? 's' : ''}</strong> for you!
    ${top.map(schemeCard).join('')}
    <div class="cqr">
      ${qb('Full analysis', '__panel:eligibility')}
      ${eligible.length > 3 ? qb(`+${eligible.length - 3} more`, '__panel:schemes') : ''}
    </div>`;
  }

  // ── 4. Income certificate (Must precede generic scheme keywords) ──
  if (/income.*(cert|proof|document)|certificate.*income|how.*(get|make|apply).*income/i.test(t)) {
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">How to Get Income Certificate for Scholarships (NSP & State Portals)</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">Issued by Revenue Department / Tehsildar · Valid for Current Financial Year</div>
    <div class="csc">
      <div class="csc-h"><div class="csc-name">Fastest Ways to Apply</div></div>
      <div class="csc-steps">
        <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st"><strong>Online (Fastest):</strong> Apply via state e-District portal — e.g. TN e-Seva, UP eSathi, MahaOnline, Karnataka Seva Sindhu, or national eDistrict.nic.in.</div></div>
        <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st"><strong>Offline / CSC:</strong> Visit nearest <strong>Jan Seva Kendra (CSC)</strong> or local Taluk/Tehsildar office.</div></div>
        <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st"><strong>Documents needed:</strong> Parent/Guardian's Aadhaar, Ration card, Salary slip / Affidavit, Passport photo.</div></div>
        <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st"><strong>Time:</strong> Takes <strong>7–15 days</strong>. DigiLocker digital copy available in most states after issue.</div></div>
      </div>
      <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.25);border-radius:2px;padding:8px 12px;font-size:12px;color:var(--sf);margin-top:8px">
        <strong>Important for NSP:</strong> Certificate must be in the <strong>Parent/Guardian's name</strong>, issued for the current financial year. Apply now before the October 31 deadline!
      </div>
      <div class="csc-btns" style="margin-top:10px">
        <button class="csc-bp" data-query="NSP scholarship documents required">All NSP Documents</button>
        <button class="csc-bs" data-query="NSP Post-Matric Scholarship details">NSP Scheme Info</button>
      </div>
    </div>`;
  }

  // ── 5. Renewal ──
  if (/renewal|renew/i.test(t)) {
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Scholarship Renewal Guide (NSP & State Portals)</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">For students continuing in the 2nd, 3rd, or 4th year of their degree</div>
    <div class="csc">
      <div class="csc-h"><div class="csc-name">Steps to Apply for Renewal</div></div>
      <div class="csc-steps">
        <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st">Go to <strong>scholarships.gov.in</strong> → Click <strong>"Apply for Renewal"</strong> (Do NOT click New Registration!).</div></div>
        <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st">Log in with your previous year <strong>Application ID and Password</strong>.</div></div>
        <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st">Update details: current year/semester, attendance %, and fee receipt.</div></div>
        <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st">Upload previous year passing marksheet and updated income certificate (if required).</div></div>
        <div class="csc-step"><div class="csc-sn">5</div><div class="csc-st">Submit online and provide the printed copy to your college nodal officer for verification.</div></div>
      </div>
    </div>`;
  }

  // ── 6. NSP / Post-Matric ──────────────────────────────────
  if (/nsp|national scholarship.*portal|post.?matric/i.test(t)) {
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">NSP Post-Matric Scholarship</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">Ministry of Education · scholarships.gov.in</div>
    <strong>Amount:</strong> ₹2,000 – ₹25,000 / year<br>
    <strong>Eligible:</strong> OBC/SC/ST/EWS/Minority · Class 11 to PhD · Family income &lt;₹2.5 lakh<br>
    <strong>Not eligible:</strong> General (unreserved) category · Income above ₹2.5L
    <div class="csc">
      <div class="csc-h"><div class="csc-name">Step-by-Step Application</div></div>
      <div class="csc-steps">
        <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st">Go to <strong>scholarships.gov.in</strong> → New Registration → Enter Aadhaar number</div></div>
        <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st">Select your scheme → Fill academic details + bank account (DBT transfer)</div></div>
        <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st">Upload: Aadhaar, Income Certificate, Caste Certificate, Marksheet, Bank Passbook</div></div>
        <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st">College verifies online → Money sent directly to your bank account</div></div>
      </div>
      <div style="background:var(--rdl);border-radius:2px;padding:7px 10px;font-size:12px;color:var(--rd);font-weight:700;margin-bottom:7px">Deadline: October 31, 2026</div>
      <div class="csc-btns">
        <button class="csc-bp" data-query="Income certificate for NSP how to get">Income cert</button>
        <button class="csc-bs" data-query="NSP scholarship renewal process">Renewal</button>
      </div>
    </div>`;
  }

  // ── 7. AICTE Pragati ─────────────────────────────────────
  if (/aicte|pragati/i.test(t)) {
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">AICTE Pragati Scholarship</strong><br>
    <strong>For:</strong> Girl students only — AICTE-approved technical courses<br>
    <strong>Amount:</strong> ₹50,000 / year<br>
    <strong>Eligible:</strong> Female + BTech/BE/MCA/Pharmacy + Family income &lt;₹8L<br>
    <strong>Not eligible:</strong> Male students · BA/BSc/Commerce students · Income above ₹8L<br><br>
    <strong>Apply at:</strong> aicte-india.org → AICTE Pragati Portal
    <div class="cqr">
      ${qb('Check my eligibility', '__panel:eligibility')}
      ${qb('AICTE documents list', 'AICTE Pragati documents required')}
    </div>`;
  }

  // ── 7. Caste certificate ──────────────────────────────────
  if (/caste.*cert|obc.*cert|\bsc.*cert|\bst.*cert|category.*cert/i.test(t)) {
    return `<strong>Get Caste / Category Certificate</strong><br>
    Issued by Tehsildar / SDM office. Required for all reserved-category scholarship applications.
    <div class="csc"><div class="csc-steps">
      <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st"><strong>Online:</strong> eDistrict.nic.in → your state → "Apply for Caste Certificate"</div></div>
      <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st"><strong>Offline:</strong> Tehsildar office → Caste/SC/OBC certificate form → ₹10–50 fee</div></div>
      <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st"><strong>Documents:</strong> Aadhaar, Ration card, Father/Mother's caste proof, Affidavit</div></div>
      <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st">Processing time: 7–21 days. Available on DigiLocker after issue.</div></div>
    </div></div>`;
  }

  // ── 8. Girl / women scholarships ─────────────────────────
  if (/\b(girl|women|female|mahila|lady.*student)\b/i.test(t)) {
    return `<strong>Schemes Exclusively for Girl Students</strong>
    <div class="csc"><div class="csc-h"><div class="csc-name">AICTE Pragati</div><span class="badge b-gd">₹50,000/yr</span></div>
    <div style="font-size:12px;color:var(--t2)">BTech/BE girls · Family income &lt;₹8L · Any category · AICTE colleges</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">Begum Hazrat Mahal</div><span class="badge b-gn">₹12,000/yr</span></div>
    <div style="font-size:12px;color:var(--t2)">Minority girls · Class 9–12 · 50%+ marks</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">NSP Post-Matric (Girls)</div><span class="badge b-sf">₹25,000/yr</span></div>
    <div style="font-size:12px;color:var(--t2)">OBC/SC/ST/EWS/Minority · Class 11–PhD · Higher rates for girl students</div></div>
    <div class="cqr">
      ${qb('Check my eligibility', '__panel:eligibility')}
      ${qb('AICTE Pragati steps', 'AICTE Pragati scholarship application steps')}
    </div>`;
  }

  // ── 9. Research / fellowships ─────────────────────────────
  if (/\b(fellowship|research|ugc.*net|jrf|pmrf|csir)\b/i.test(t)) {
    return `<strong>Research Fellowships</strong>
    <div class="csc"><div class="csc-h"><div class="csc-name">PM Research Fellowship</div><span class="badge b-bl">₹70K–₹80K/mo</span></div>
    <div style="font-size:12px;color:var(--t2)">PhD at IIT/NIT/IISc · CGPA ≥8.0 · Any category · pmrf.in</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">CSIR-UGC NET JRF</div><span class="badge b-bl">₹37,000/mo</span></div>
    <div style="font-size:12px;color:var(--t2)">Qualify NET exam · PG level · 5-year tenure · Any category</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">Maulana Azad Fellowship</div><span class="badge b-gn">₹25K–₹28K/mo</span></div>
    <div style="font-size:12px;color:var(--t2)">Minority students · MPhil/PhD only · No income limit</div></div>`;
  }

  // ── 10. Deadlines ─────────────────────────────────────────
  if (/\b(deadline|last.?date|when.*apply|expir)\b/i.test(t)) {
    return `<strong>Current Scholarship Deadlines:</strong><br><br>
    • <strong>NSP Post-Matric</strong> → <span style="color:var(--rd);font-weight:700">Oct 31 · 8 DAYS LEFT!</span><br>
    • <strong>AICTE Pragati</strong> → <span style="color:var(--gd);font-weight:700">Nov 15 · 23 days</span><br>
    • <strong>INSPIRE DST</strong> → <span style="color:var(--gn);font-weight:700">Nov 30 · 38 days</span><br>
    • <strong>Central Sector</strong> → <span style="color:var(--gn);font-weight:700">Dec 15 · 53 days</span><br>
    • <strong>CSIR-UGC JRF</strong> → <span style="color:var(--gn);font-weight:700">Dec 31 · 69 days</span>
    <div class="cqr">
      ${qb('Full calendar', '__panel:deadlines')}
      ${qb('Apply NSP now', 'How to apply for NSP scholarship?')}
    </div>`;
  }

  // ── 11. JEE ───────────────────────────────────────────────
  if (/\bjee\b/i.test(t)) {
    return `<strong>JEE Main 2026 — Preparation Guide</strong><br><br>
    <strong>Dates:</strong> Session 1: Jan 22–30, 2026 · Session 2: April 2026<br>
    <strong>Register:</strong> jeemain.nta.nic.in (opens Dec 2025)<br><br>
    <strong>Priority Topics:</strong><br>
    • <strong>Physics:</strong> Electrostatics, Modern Physics, Mechanics, Optics<br>
    • <strong>Maths:</strong> Calculus, Coordinate Geometry, Algebra, Vectors<br>
    • <strong>Chemistry:</strong> Organic reactions (IUPAC), Equilibrium, Electrochemistry<br><br>
    <strong>Winning Strategy:</strong><br>
    • NCERT line-by-line — 80% of questions are NCERT-based<br>
    • Solve 10 years of previous papers<br>
    • Full mock test every Sunday under exam conditions
    <div class="cqr">
      ${qb('Best books', 'Best books for JEE Main preparation')}
      ${qb('JEE vs CUET', 'Difference between JEE Main and CUET')}
    </div>`;
  }

  // ── 12. NEET ──────────────────────────────────────────────
  if (/\bneet\b/i.test(t)) {
    return `<strong>NEET UG 2026 — Preparation Guide</strong><br><br>
    <strong>Date:</strong> May 2026 (tentative)<br>
    <strong>Marks split:</strong> Biology 360 · Physics 180 · Chemistry 180<br><br>
    <strong>Priority Topics:</strong><br>
    • <strong>Biology:</strong> Human Physiology, Plant Physiology, Genetics, Ecology<br>
    • <strong>Physics:</strong> Mechanics, Electrostatics, Modern Physics<br>
    • <strong>Chemistry:</strong> Organic Chemistry, Biomolecules, Chemical Bonding
    <div class="cqr">
      ${qb('NEET Biology strategy', 'NEET Biology preparation chapter-wise strategy')}
      ${qb('Medical scholarships', 'Scholarships for MBBS students')}
    </div>`;
  }

  // ── 13. General category ──────────────────────────────────
  if (/\b(general.*categor|general.*student|no.*scholarship.*general|open.*categor)\b/i.test(t)) {
    return `<strong>Scholarships for General Category Students</strong><br><br>
    General category has <strong>fewer income-based schemes</strong> but merit-based options exist:<br><br>
    • <strong>Central Sector Scholarship</strong> — ₹20,000/yr · top-12th-rank in state · income &lt;₹4.5L<br>
    • <strong>INSPIRE Scholarship</strong> — ₹80,000/yr · BSc/MSc science · top 1% in Class 12<br>
    • <strong>PMRF / JRF</strong> — ₹37K–₹80K/month for research · purely merit-based · all categories<br>
    • <strong>State-level schemes</strong> — Many states (MH, KA, TN, etc.) have their own merit scholarships<br><br>
    <strong>Key insight:</strong> General category schemes are <strong>merit-based</strong>, not income-based. Focus on high marks!
    <div class="cqr">
      ${qb('Check my eligibility', '__panel:eligibility')}
      ${qb('INSPIRE details', 'INSPIRE scholarship eligibility criteria')}
    </div>`;
  }

  // ── 14. Fallback ──────────────────────────────────────────
  return `I'm here to help! For "<em>${esc(rawText)}</em>", try being more specific:
  <div style="background:var(--sfl);border-radius:9px;padding:10px 12px;margin:8px 0;font-size:12.5px;line-height:1.7">
    Example: <em>"I'm 21, SC category from Bihar, BTech, family income 1.5 lakh"</em>
  </div>
  <div class="cqr">
    ${qb('Eligibility checker', '__panel:eligibility')}
    ${qb('Browse all schemes', '__panel:schemes')}
    ${qb('NSP Scholarship', 'NSP Post-Matric Scholarship details')}
    ${qb('Documents guide', 'Documents needed for scholarship application')}
  </div>`;
}
