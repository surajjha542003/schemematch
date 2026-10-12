/* ════════════════════════════════════════════════
   Scheme Finder — AI Chat Assistant
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══ CHAT ══
function initChat(){
  const msgs=document.getElementById('chatMsgs'); msgs.innerHTML='';
  addAI(`<strong style="font-size:14px;font-family:'Plus Jakarta Sans',sans-serif">Namaste! I am your SchemeMatch assistant</strong>
  <div style="margin-top:6px;color:var(--t2);line-height:1.7;font-size:13px">Your dedicated AI assistant for welfare scholarships, eligibility evaluation, and competitive exam preparation. Select an option below or ask any question:</div>
  <div class="cqr">
    <div class="cqb" onclick="sendQ('find my schemes')">Find my schemes</div>
    <div class="cqb" onclick="goPanel('tracker')">My Application Tracker</div>
    <div class="cqb" onclick="sendQ('Official registration links for schemes')">Registration links</div>
    <div class="cqb" onclick="sendQ('How to get income certificate')">Income cert</div>
  </div>`);
}
function chatKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}}
function grow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,90)+'px';}
function sendQ(t){
  const c=document.getElementById('cinput');
  if(!chatReady){initChat();chatReady=true;}
  goPanel('chat');
  setTimeout(()=>{c.value=t;doSend();},50);
}
function doSend(){
  const el=document.getElementById('cinput');
  const t=el.value.trim(); if(!t) return;
  el.value=''; el.style.height='auto';
  addUser(t); showTyp();
  getReply(t).then(html=>{hideTyp();addAI(html);}).catch(()=>{hideTyp();addAI('I could not complete that request. Try again, or browse the saved scheme catalogue.');});
}

// Escapes model output, then only adds our own **bold**/newline tags —
// never trusts raw HTML from the LLM (that would be an XSS vector, since
// chat messages ultimately come from user-influenced input).
function mdToSafeHtml(md){
  let h=esc(md);
  h=h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/\n/g,'<br>');
  return h;
}

// Helper to retrieve applicant form data directly from the Eligibility Form DOM elements or state U
function getSavedApplicantProfile(){
  let profile=U;
  if(!(profile.cat && profile.edu && profile.inc)){
    try{const saved=JSON.parse(localStorage.getItem('sf_profile') || '{}');if(saved.cat && saved.edu && saved.inc)profile=saved;}catch(_){}
  }
  const keys=['name','age','gender','state','cat','inc','edu','marks','stream','firstGrad','disability','parentDisabled','parentOcc'];
  return {...Object.fromEntries(keys.map(key=>[key,profile[key] || ''])),eligibilityDetails:ReviewedConditions.sanitizeDetails(profile.eligibilityDetails)};
}
function getApplicantFormData(){
  const el = id => document.getElementById(id);
  const formData = {
    eligibilityDetails: { ...U.eligibilityDetails },
    name: el('ef-name')?.value?.trim() || U.name || '',
    age: el('ef-age')?.value?.trim() || U.age || '',
    gender: el('ef-gender')?.value || U.gender || '',
    state: el('ef-state')?.value || U.state || '',
    cat: el('ef-cat')?.value || U.cat || '',
    inc: el('ef-inc')?.value || U.inc || '',
    edu: el('ef-edu')?.value || U.edu || '',
    marks: el('ef-marks')?.value?.trim() || U.marks || '',
    stream: el('ef-stream')?.value || U.stream || '',
    firstGrad: el('ef-firstgrad')?.value || U.firstGrad || '',
    disability: el('ef-disability')?.value || U.disability || '',
    parentDisabled: el('ef-parentdis')?.value || U.parentDisabled || '',
    parentOcc: el('ef-parentocc')?.value || U.parentOcc || ''
  };

  // If DOM fields are blank but localStorage has profile, synchronize it
  if(!formData.cat || !formData.edu || !formData.inc){
    try {
      const saved = JSON.parse(localStorage.getItem('sf_profile') || '{}');
      if(saved && saved.cat && saved.edu && saved.inc){
        Object.assign(formData, saved);
        if(el('ef-cat') && !el('ef-cat').value) el('ef-cat').value = saved.cat;
        if(el('ef-edu') && !el('ef-edu').value) el('ef-edu').value = saved.edu;
        if(el('ef-inc') && !el('ef-inc').value) el('ef-inc').value = saved.inc;
        if(el('ef-state') && !el('ef-state').value && saved.state) el('ef-state').value = saved.state;
        if(el('ef-gender') && !el('ef-gender').value && saved.gender) el('ef-gender').value = saved.gender;
        if(el('ef-name') && !el('ef-name').value && saved.name) el('ef-name').value = saved.name;
        if(el('ef-marks') && !el('ef-marks').value && saved.marks) el('ef-marks').value = saved.marks;
        if(el('ef-firstgrad') && !el('ef-firstgrad').value && saved.firstGrad) el('ef-firstgrad').value = saved.firstGrad;
      }
    } catch(e){}
  }

  return formData;
}

// ══ ARCHITECTURAL FLOW 1: FIND MY SCHEMES ══
// 1. Import data from eligibility form
// 2. Evaluate Eligibility for Schemes out of all schemes (What schemes is the applicant eligible for)
// 3. Give out all the schemes the applicant is eligible for
function handleFindMySchemesFlow(){
  // 1. Retrieve applicant data directly from the eligibility form
  const rawForm = getSavedApplicantProfile();

  // ══ ARCHITECTURAL CONSTRAINT ══
  // Scheme eligibility MUST NOT be provided until the user fills the Eligibility Form.
  // The mandatory criteria required for evaluation are: Category, Education Level, and Annual Income.
  const isFormFilled = Boolean(rawForm.cat && rawForm.edu && rawForm.inc);

  if(!isFormFilled){
    // Flag so that when the form is submitted, the user is seamlessly returned to chat
    window.__fromChatFindSchemes = true;

    // Immediately schedule redirection to the Eligibility Form page
    setTimeout(() => {
      if(typeof goPanel === 'function') {
        goPanel('eligibility');
        const formTarget = document.getElementById('ef-cat') || document.querySelector('.eform');
        if(formTarget) formTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1200);

    return `
    <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Find My Schemes &mdash; Eligibility Form Required</strong>
    <div style="margin-top:6px;color:var(--t2);line-height:1.7;font-size:13px">
      Scheme eligibility cannot be evaluated until you fill out the Eligibility Form. The applicant data must be entered in the form first.
    </div>
    <div class="csc">
      <div class="csc-h">
        <div class="csc-name">Required Steps</div>
      </div>
      <div style="font-size:12.5px;color:var(--t2);line-height:1.6;margin-top:4px">
        1. Fill in your applicant details (Category, Education Level, and Income) in the Eligibility Form.<br>
        2. Your entered form data will be retrieved into this AI chat.<br>
        3. Review Central and 15-state programme suggestions and source-backed conditions.<br><br>
        <span style="color:#FFFFFF;font-weight:600">Redirecting you to the Eligibility Form now...</span>
      </div>
      <div class="csc-btns" style="margin-top:12px">
        <button class="csc-bp" onclick="goPanel('eligibility')">Go to Eligibility Form &rarr;</button>
      </div>
    </div>`;
  }

  // Synchronize state with the retrieved form details
  if(typeof invalidateEligibilityDetails==='function')rawForm.eligibilityDetails=invalidateEligibilityDetails(U,rawForm);
  Object.assign(U, rawForm);
  profileSet = true;
  if(typeof saveProfileLocal === 'function') saveProfileLocal();
  if(typeof updateUI === 'function') updateUI();
  if(typeof updateDashboard === 'function') updateDashboard();

  if(typeof SchemeCatalog !== 'undefined')return renderCatalogueMatches(U);

  // 2. Evaluate Eligibility for Schemes out of all schemes (Central + Tamil Nadu)
  const allSchemesList = [
    ...(typeof SCHEMES !== 'undefined' ? SCHEMES : []),
    ...(typeof TN_SCHEMES !== 'undefined' ? TN_SCHEMES : [])
  ];

  const seenIds = new Set();
  const dedupedSchemes = allSchemesList.filter(s => {
    const key = s.id || s.name;
    if(seenIds.has(key)) return false;
    seenIds.add(key);
    return true;
  });

  const scored = dedupedSchemes.map(s => {
    const res = typeof scoreScheme === 'function' ? scoreScheme(s, U) : (s.eligFn ? s.eligFn(U) : { score: 0, eligible: false, reasons: [], blocks: [] });
    return { ...s, ...res };
  });

  const eligible = scored.filter(s => s.eligible).sort((a,b) => b.score - a.score);
  const partial = scored.filter(s => !s.eligible && s.score > 0).sort((a,b) => b.score - a.score);

  // Remember what was just shown so a later "why is this 80% match?" follow-up
  // (which names no scheme) can still resolve to the right card's own reasons.
  LAST_SHOWN_SCHEMES = [...eligible, ...partial].map(s => ({ name: s.name, by: s.by, score: s.score, reasons: s.reasons, blocks: s.blocks }));

  let totalBenefit = 0;
  eligible.forEach(s => {
    if(s.amtNum && typeof s.amtNum === 'number') totalBenefit += s.amtNum;
  });

  const formattedBenefit = totalBenefit > 0 ? '₹' + totalBenefit.toLocaleString('en-IN') + '/yr' : 'Tuition Waivers & Stipends';

  const incLabels = { 'under1': 'Below ₹1 Lakh', '1to2.5': '₹1L – ₹2.5 Lakhs', '2.5to4.5': '₹2.5L – ₹4.5 Lakhs', '4.5to8': '₹4.5L – ₹8 Lakhs', 'above8': 'Above ₹8 Lakhs' };
  const eduLabels = { '9-10': 'Class 9–10', '11-12': 'Class 11–12', 'ug-tech': 'UG Engineering (BTech/BE)', 'ug-arts': 'UG Arts / Science / BCA (BA/BSc/BCom/BCA)', 'ug-medical': 'UG Medical (MBBS/BDS)', 'pg': 'Postgraduate', 'phd': 'PhD / Research' };

  const summaryPills = [
    U.name ? `Name: <strong>${U.name}</strong>` : '',
    U.cat ? `Category: <strong>${U.cat}</strong>` : '',
    U.inc ? `Income: <strong>${incLabels[U.inc] || U.inc}</strong>` : '',
    U.edu ? `Education: <strong>${eduLabels[U.edu] || U.edu}</strong>` : '',
    U.state ? `State: <strong>${U.state}</strong>` : '',
    U.marks ? `Marks: <strong>${U.marks}%</strong>` : '',
    U.firstGrad === 'Yes' ? `First Graduate: <strong>Yes</strong>` : '',
    U.gender ? `Gender: <strong>${U.gender}</strong>` : ''
  ].filter(Boolean).join(' &middot; ');

  // 3. Give out all the schemes the applicant is eligible for based on the form details
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Applicant Eligible Schemes (Retrieved from Eligibility Form)</strong>
  <div style="margin-top:6px;color:var(--t2);line-height:1.6;font-size:12.5px">
    Retrieved Form Details: ${summaryPills || 'Profile Active'}
  </div>
  <div style="margin:4px 0 10px;font-size:12.5px;color:var(--t1)">
    Total Potential Benefit: <strong style="color:var(--gn)">${formattedBenefit}</strong> &middot; ${eligible.length} eligible schemes matched out of ${dedupedSchemes.length} evaluated
  </div>

  <div>
    ${eligible.length === 0 ? `
    <div class="csc">
      <div style="font-size:12.5px;color:var(--t2)">
        No 100% matches found for this specific combination of category and income. See partially eligible schemes below or edit your form parameters.
      </div>
    </div>` :
    eligible.map(s => {
      const reg = findRegistrationForScheme(s.name) || { directUrl: SourcePolicy.registrationUrl(s) || '#', portalName: s.by, name: s.name };
      return `
      <div class="csc">
        <div class="csc-h">
          <div class="csc-name">${s.name}</div>
          <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:2px;background:rgba(16,185,129,0.15);color:var(--gn)">${s.score}% Match</span>
        </div>
        <div style="font-size:11.5px;color:var(--t3);margin:2px 0 4px">${s.by}</div>
        <div class="csc-amt">${s.amt}</div>
        
        <div style="font-size:12px;color:var(--t2);line-height:1.5;margin-bottom:8px">
          ${(s.reasons || []).slice(0, 3).map(r => `<div style="color:var(--gn)">&bull; ${r}</div>`).join('')}
        </div>

        <div class="csc-btns">
          <a href="${reg.directUrl}" target="_blank" rel="noopener noreferrer" class="csc-launch" style="margin:0;padding:7px 12px;font-size:12px">
            Direct Registration Link &rarr;
          </a>
          <button class="csc-bs" style="padding:7px 12px;font-size:12px" onclick="sendQ('How to apply for ${s.name}?')">How to Apply</button>
          <button class="kbtn-track" onclick="addToTracker('${s.id}','${escJs(s.name)}','${escJs(s.by)}','${escJs(s.amt)}','${escJs(reg.directUrl)}','${s.deadline||''}')">+ Track</button>
        </div>
      </div>`;
    }).join('')}
  </div>

  ${partial.length > 0 ? `
  <div style="margin-top:12px">
    <div style="font-size:11.5px;font-weight:700;color:var(--gd);text-transform:uppercase;margin-bottom:6px">Partially Eligible Schemes (${partial.length})</div>
    <div class="cqr">
      ${partial.slice(0, 4).map(p => `<div class="cqb" onclick="sendQ('What is required for ${p.name}?')">${p.name} (${p.score}%)</div>`).join('')}
    </div>
  </div>` : ''}

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="goPanel('eligibility')">Edit Eligibility Form</div>
    <div class="cqb" onclick="sendQ('find my schemes')">Re-evaluate from Form</div>
    <div class="cqb" onclick="sendQ('JEE mains Best Books')">JEE mains Best Books</div>
    <div class="cqb" onclick="sendQ('Official registration links for schemes')">Registration Links</div>
    <div class="cqb" onclick="sendQ('How to get income certificate')">Income Certificate</div>
  </div>`;
}

// ══ ARCHITECTURAL FLOW 2: JEE MAINS BEST BOOKS ══
// 1. Suggest latest and most reliable books and modules
// 2. Give tips about what chapters to study and QUESTION PATTERN AND WEIGHTAGE & P.Y.Q.S
function handleJeeMainsBestBooksFlow(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">JEE Main: Best Books, Question Pattern, Weightage and PYQs</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    Comprehensive preparation guide aligned with current NTA examination pattern and coaching modules.
  </div>

  <!-- Part 1: Latest and most reliable books and modules -->
  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">1. Recommended Books and Modules</div>
    </div>
    <div style="font-size:12.5px;line-height:1.7;margin-top:6px">
      <div style="margin-bottom:8px">
        <strong style="color:var(--pr)">Physics:</strong><br>
        &bull; <strong>Concepts of Physics (Vol 1 &amp; 2) &mdash; Dr. H.C. Verma:</strong> Unmatched for core conceptual grounding, thought experiments, and fundamental mechanics.<br>
        &bull; <strong>Understanding Physics &mdash; DC Pandey (Arihant) or Physics for JEE Main &mdash; BM Sharma (Cengage):</strong> Best for topic-wise multi-level graded JEE Main problem solving.<br>
        &bull; <strong>Problems in General Physics &mdash; I.E. Irodov:</strong> Selected problems for mechanics and electromagnetism depth.
      </div>
      <div style="margin-bottom:8px">
        <strong style="color:var(--gn)">Chemistry:</strong><br>
        &bull; <strong>NCERT Chemistry (Class 11 &amp; 12):</strong> Essential for JEE Main. Majority of inorganic and direct conceptual questions are lifted directly from NCERT tables and text.<br>
        &bull; <strong>Physical Chemistry:</strong> Problems in Physical Chemistry by N. Avasthi (Balaji Publications) for numerical questions.<br>
        &bull; <strong>Organic Chemistry:</strong> Advanced Problems in Organic Chemistry by M.S. Chouhan + Solomon &amp; Fryhle for reaction mechanisms.<br>
        &bull; <strong>Inorganic Chemistry:</strong> Concise Inorganic Chemistry by J.D. Lee (Adapted by Sudarshan Guha) + V.K. Jaiswal problems.
      </div>
      <div style="margin-bottom:8px">
        <strong style="color:var(--gd)">Mathematics:</strong><br>
        &bull; <strong>Cengage Mathematics Series &mdash; G. Tewani:</strong> Graded chapter modules for Algebra, Calculus, Coordinate Geometry, and Vectors/3D.<br>
        &bull; <strong>Differential &amp; Integral Calculus &mdash; Amit M. Agarwal (Arihant):</strong> Mastery on limits, continuity, definite integrals, and area under curve.<br>
        &bull; <strong>Coordinate Geometry &amp; Trigonometry &mdash; S.L. Loney:</strong> Classic analytical foundation for lines and conics.
      </div>
      <div>
        <strong style="color:var(--sf)">Premier Coaching Modules:</strong><br>
        &bull; <strong>Allen DLP / Resonance Rank Booster / FIITJEE Question Banks:</strong> Graded question banks (Level 1 for speed and accuracy in JEE Main, Level 2 for depth).
      </div>
    </div>
  </div>

  <!-- Part 2: Question Pattern and Marking Scheme -->
  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">2. Question Pattern and Marking Scheme (NTA Blueprint)</div>
    </div>
    <div style="font-size:12.5px;line-height:1.7;margin-top:6px">
      &bull; <strong>Exam Mode:</strong> Computer Based Test (CBT) &middot; 3 Hours duration.<br>
      &bull; <strong>Total Marks:</strong> 300 Marks (Physics: 100, Chemistry: 100, Mathematics: 100).<br>
      &bull; <strong>Questions:</strong> Total 90 questions &mdash; candidates attempt <strong>75 questions</strong> (25 per subject).<br>
      &bull; <strong>Section A (Compulsory):</strong> 20 Multiple Choice Questions (MCQs) per subject (+4 marks for correct, -1 mark for wrong).<br>
      &bull; <strong>Section B (Numerical Value):</strong> 10 Numerical questions per subject (<strong>Attempt ANY 5</strong>; +4 marks for correct, -1 mark for wrong).
    </div>
  </div>

  <!-- Part 3: High-Weightage Chapters to Study -->
  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">3. High-Weightage Chapters and Scoring Topics</div>
    </div>
    <div style="font-size:12.5px;line-height:1.7;margin-top:6px">
      <div style="margin-bottom:6px">
        <strong>Physics High-ROI Topics (~40+ Marks):</strong><br>
        &bull; <em>Modern Physics</em> (Dual Nature, Atoms, Nuclei, Semiconductors) &mdash; 3 to 4 questions (~12&ndash;16 marks, high return on investment).<br>
        &bull; <em>Current Electricity &amp; Magnetic Effects</em> &mdash; 3 questions (~12 marks).<br>
        &bull; <em>Heat &amp; Thermodynamics</em> &mdash; 2 to 3 questions (~8&ndash;12 marks).<br>
        &bull; <em>Gravitation &amp; Kinematics</em> &mdash; 2 questions (~8 marks).
      </div>
      <div style="margin-bottom:6px">
        <strong>Chemistry High-ROI Topics (~45+ Marks):</strong><br>
        &bull; <em>Coordination Compounds &amp; Chemical Bonding</em> &mdash; 4 questions (~16 marks, predictable and direct).<br>
        &bull; <em>General Organic Chemistry (GOC) &amp; Named Reactions</em> &mdash; 4 to 5 questions (~16&ndash;20 marks).<br>
        &bull; <em>Solutions &amp; Chemical Kinetics</em> &mdash; 3 questions (~12 marks in Numerical section).<br>
        &bull; <em>d- and f-Block Elements &amp; Periodic Trends</em> &mdash; 2 to 3 questions (~8&ndash;12 marks).
      </div>
      <div>
        <strong>Mathematics High-ROI Topics (~35+ Marks):</strong><br>
        &bull; <em>Vectors &amp; 3D Geometry</em> &mdash; 3 to 4 questions (~12&ndash;16 marks, direct standard formulas).<br>
        &bull; <em>Matrices &amp; Determinants</em> &mdash; 2 questions (~8 marks, easiest scoring).<br>
        &bull; <em>Definite Integrals &amp; Differential Equations</em> &mdash; 3 questions (~12 marks).<br>
        &bull; <em>Sequence &amp; Series &amp; Binomial Theorem</em> &mdash; 2 questions (~8 marks).
      </div>
    </div>
  </div>

  <!-- Part 4: Previous Year Questions (P.Y.Q.s) Master Strategy -->
  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">4. Previous Year Questions (PYQs) Strategy</div>
    </div>
    <div style="font-size:12.5px;line-height:1.7;margin-top:6px">
      &bull; <strong>Solve All 2021&ndash;2026 NTA Shift Papers:</strong> Solving these gives 100% familiarity with exact numerical formats and question patterns.<br>
      &bull; <strong>Recommended PYQ Resources:</strong> Disha 46/47 Years Chapterwise Solved Papers or online timed practice on Marks App / ExamGOAL.<br>
      &bull; <strong>Timed Mock Protocol:</strong> Practice in official 3-hour shift slots (9:00 AM &ndash; 12:00 PM or 3:00 PM &ndash; 6:00 PM) to align biological clock.<br>
      &bull; <strong>The Error Notebook:</strong> Record every incorrect problem or concept trap in a dedicated error journal. Review it before every mock exam.
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('find my schemes')">Find my schemes</div>
    <div class="cqb" onclick="sendQ('What scholarships can engineering students get?')">Engineering scholarships</div>
    <div class="cqb" onclick="goPanel('deadlines')">Exam calendar</div>
  </div>`;
}

function quickFillAndEvaluate(type){
  const el = id => document.getElementById(id);
  if(type==='obc'){
    if(el('ef-cat')) el('ef-cat').value='OBC';
    if(el('ef-inc')) el('ef-inc').value='1to2.5';
    if(el('ef-edu')) el('ef-edu').value='ug-tech';
    if(el('ef-state')) el('ef-state').value='Tamil Nadu';
    if(el('ef-gender')) el('ef-gender').value='Female';
    if(el('ef-firstgrad')) el('ef-firstgrad').value='Yes';
    if(el('ef-marks')) el('ef-marks').value='82';
  } else if(type==='sc'){
    if(el('ef-cat')) el('ef-cat').value='SC';
    if(el('ef-inc')) el('ef-inc').value='under1';
    if(el('ef-edu')) el('ef-edu').value='ug-arts';
    if(el('ef-state')) el('ef-state').value='Tamil Nadu';
    if(el('ef-gender')) el('ef-gender').value='Male';
    if(el('ef-marks')) el('ef-marks').value='75';
  } else if(type==='general'){
    if(el('ef-cat')) el('ef-cat').value='General';
    if(el('ef-inc')) el('ef-inc').value='2.5to4.5';
    if(el('ef-edu')) el('ef-edu').value='ug-arts';
    if(el('ef-state')) el('ef-state').value='Tamil Nadu';
    if(el('ef-marks')) el('ef-marks').value='88';
  }
  sendQ('find my schemes');
}
window.quickFillAndEvaluate = quickFillAndEvaluate;

// ══ GENERIC ADVISORY & SCORE EXPLANATION FLOWS ══

function handleScoreExplanationQuestion(query){
  const rawForm = getApplicantFormData();
  const hasProfile = Boolean((rawForm.cat && rawForm.edu && rawForm.inc) || (profileSet && U.cat));
  const activeCat = rawForm.cat || U.cat || 'General / OBC / SC / ST';
  const activeEdu = rawForm.edu || U.edu || 'Undergraduate / Diploma';
  const activeInc = rawForm.inc || U.inc || 'Within Statutory Limit';
  const activeMarks = rawForm.marks || U.marks || 'Passing Marks';
  
  const eduMap = {
    '9-10': 'Class 9–10 (Pre-Matric)',
    '11-12': 'Class 11–12 (Higher Secondary)',
    'diploma': 'Polytechnic Diploma',
    'ug-eng': 'UG Engineering (B.E. / B.Tech)',
    'ug-tech': 'UG Engineering / Technical',
    'ug-arts': 'UG Arts & Science (B.A. / B.Sc / B.Com)',
    'ug-med': 'UG Medical / Paramedical (MBBS/BDS/Allied)',
    'pg': 'Postgraduate (M.Tech / M.Sc / M.A / MBA)',
    'phd': 'Doctoral / Ph.D Research'
  };
  const incMap = {
    'under1': 'Under ₹1,00,000 / year',
    '1to2.5': '₹1,00,000 – ₹2,50,000 / year',
    '2.5to4.5': '₹2,50,000 – ₹4,50,000 / year',
    '4.5to8': '₹4,50,000 – ₹8,00,000 / year',
    'above8': 'Above ₹8,00,000 / year'
  };
  
  const displayEdu = eduMap[activeEdu] || activeEdu;
  const displayInc = incMap[activeInc] || activeInc;
  
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Why Schemes Match at 80%: Match Engine &amp; Data Breakdown</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    In government scholarship evaluation, an <strong>80% match</strong> signifies that an applicant satisfies all statutory eligibility fundamentals (Category, Course Level, and Income Tier), while the remaining 20% represents pending portal-level documentary authentications and merit cutoffs.
  </div>

  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">The 4-Pillar Evaluation Data Model</div>
      <span class="badge b-gn">Formula Breakdown</span>
    </div>
    
    <div class="csc-steps" style="margin-top:8px">
      <div class="csc-step">
        <div class="csc-sn" style="background:rgba(16,185,129,0.15);color:var(--gn);border:1px solid rgba(16,185,129,0.3)">+40%</div>
        <div class="csc-st">
          <strong>Pillar 1: Social Category &amp; Quota Alignment (40 Points):</strong><br>
          Government schemes target specific demographic mandates (e.g., SC, ST, OBC-NCL, EWS, Minority, or open merit quotas). Meeting the mandated community criteria awards the primary 40% weightage.
        </div>
      </div>

      <div class="csc-step">
        <div class="csc-sn" style="background:rgba(16,185,129,0.15);color:var(--gn);border:1px solid rgba(16,185,129,0.3)">+30%</div>
        <div class="csc-st">
          <strong>Pillar 2: Course Level &amp; Recognized Institution (30 Points):</strong><br>
          Verification that you are actively pursuing an eligible degree tier (e.g. Higher Secondary, AICTE Technical B.Tech, Arts/Science, Medical, or PG/PhD) at an accredited college/university awards 30% weightage.
        </div>
      </div>

      <div class="csc-step">
        <div class="csc-sn" style="background:rgba(16,185,129,0.15);color:var(--gn);border:1px solid rgba(16,185,129,0.3)">+10%</div>
        <div class="csc-st">
          <strong>Pillar 3: Household Annual Income Ceiling Compliance (10–15 Points):</strong><br>
          Applicant's reported income falls comfortably below the scheme's statutory ceiling (e.g., &le;₹2.5L for Centrally Sponsored Post-Matric, &le;₹4.5L for PM-USP, &le;₹8L for AICTE/EWS). This completes the 80%–85% baseline match.
        </div>
      </div>

      <div class="csc-step">
        <div class="csc-sn" style="background:rgba(239,68,68,0.15);color:var(--rd);border:1px solid rgba(239,68,68,0.3)">-20%</div>
        <div class="csc-st">
          <strong>Pillar 4: Why not 100%? The Pending Verification Buffer (Remaining 15–20%):</strong><br>
          The system caps pre-application scores at <strong>80%–85%</strong> because 100% sanction is strictly contingent on official portal verifications:
          <div style="margin-top:5px;line-height:1.5;color:var(--t2);font-size:11.8px">
            &bull; <strong>Board Marks / Merit Cutoff:</strong> Schemes like PM-USP require scoring in the top 20th percentile of your Class 12 state board.<br>
            &bull; <strong>College Nodal Officer Authentication:</strong> Verification of your active roll number, AISHE code, or School EMIS ID (Tamil Nadu 6th–12th Govt school certificate).<br>
            &bull; <strong>Digital Certificate Issuance:</strong> Valid revenue income and community certificate generated via state e-District or e-Seva for the current financial year.<br>
            &bull; <strong>NPCI Aadhaar-Bank Seeding:</strong> Confirmation that your active bank account is linked to the NPCI mapper for Direct Benefit Transfer (DBT).
          </div>
        </div>
      </div>
    </div>
  </div>

  ${hasProfile ? `
  <div class="csc" style="margin-top:10px">
    <div class="csc-h">
      <div class="csc-name">Your Active Form Parameters Evaluated</div>
      <span class="badge b-bl">Form Data</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:8px;font-size:12px">
      <div style="background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:2px;border:1px solid var(--bdr)">
        <div style="color:var(--t3);font-size:10.5px">Category</div>
        <div style="font-weight:700;color:var(--t1)">${activeCat}</div>
      </div>
      
      <div style="background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:2px;border:1px solid var(--bdr)">
        <div style="color:var(--t3);font-size:10.5px">Course Level</div>
        <div style="font-weight:700;color:var(--t1)">${displayEdu}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:2px;border:1px solid var(--bdr)">
        <div style="color:var(--t3);font-size:10.5px">Family Income</div>
        <div style="font-weight:700;color:var(--t1)">${displayInc}</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:2px;border:1px solid var(--bdr)">
        <div style="color:var(--t3);font-size:10.5px">Reported Marks</div>
        <div style="font-weight:700;color:var(--t1)">${activeMarks}%</div>
      </div>
    </div>
    <div style="font-size:11.8px;color:var(--t2);margin-top:8px;line-height:1.5">
      Based on your profile above, your demographic and academic parameters satisfy the mandatory statutory criteria. You can proceed directly to the scheme's official portal with your supporting documents.
    </div>
  </div>` : ''}

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('find my schemes')">Find My Schemes</div>
    <div class="cqb" onclick="goPanel('eligibility')">Edit Eligibility Form</div>
    <div class="cqb" onclick="sendQ('Can I get two scholarships at the same time?')">Dual Scholarships</div>
    <div class="cqb" onclick="sendQ('How to get income certificate')">Income Cert Steps</div>
    <div class="cqb" onclick="goPanel('schemes')">Browse All Schemes</div>
  </div>`;
}

function handleMultipleScholarshipsQuery(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Can I Receive Two Scholarships Simultaneously? Official Rules</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    Under Ministry of Education and state government scholarship guidelines, whether you can hold more than one scholarship depends on the nature of the benefit (Tuition Waiver vs. Monthly Maintenance Allowance):
  </div>

  <div class="csc">
    <div class="csc-h">
      <div class="csc-name">Statutory Guidelines on Dual Benefits</div>
    </div>
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>No Dual Central Maintenance Allowances:</strong><br>
          Under National Scholarship Portal (NSP) rules, a student <strong>cannot draw living / maintenance allowances from two government scholarships concurrently</strong>. If selected for two central schemes, you must surrender one before final disbursement.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>Tuition Fee Waiver + Monthly Maintenance IS Permitted:</strong><br>
          You <strong>CAN combine a 100% Tuition Fee Waiver with a Monthly Welfare Stipend</strong>. For example, a Tamil Nadu student can hold the <em>TN First Graduate Scholarship</em> (Tuition waiver) or <em>7.5% Govt School Quota</em> while concurrently receiving <em>Moovalur Ramamirtham Pudhumai Penn</em> (₹1,000/month) or <em>Tamil Pudhalvan</em> (₹1,000/month).
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Government + Private CSR Scholarships:</strong><br>
          Corporate foundation scholarships (such as Tata, Reliance, or HDFC Parivartan) can typically be held alongside state fee concessions, provided your college issues an institutional Bonafide / No Objection Certificate (NOC).
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">4</div>
        <div class="csc-st">
          <strong>Application Strategy:</strong><br>
          Always apply to <strong>all eligible schemes</strong> upfront during the application window. Once merit and selection lists are confirmed, choose and confirm the scheme offering the highest cumulative financial grant.
        </div>
      </div>
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('why is the scheme matching 80%')">Match Score Rules</div>
    <div class="cqb" onclick="sendQ('What scholarships are available for General category students?')">General Category</div>
    <div class="cqb" onclick="sendQ('What is the income limit for scholarships?')">Income Limits</div>
    <div class="cqb" onclick="goPanel('schemes')">Browse Schemes</div>
  </div>`;
}

function handleIncomeCeilingsQuery(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Government Scholarship Income Limits &amp; Slabs</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    Government scholarships in India are categorized across 3 primary statutory annual family income tiers:
  </div>

  <div class="csc">
    <div class="csc-h"><div class="csc-name">Annual Family Income Slabs Breakdown</div></div>
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>Tier 1: Annual Income &le; ₹2,50,000 / year</strong><br>
          Covers Centrally Sponsored Post-Matric Scholarships (SC, ST, OBC, EBC, DNT), PM-YASASVI, and state minority/backward classes welfare schemes.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>Tier 2: Annual Income &le; ₹4,50,000 / year</strong><br>
          Covers the <em>Central Sector Scheme of Scholarship (PM-USP)</em> (₹12,000–₹20,000/yr for top 20th percentile Class 12th board students), <em>Ishan Uday</em> for North-Eastern Region UG students, and the <em>Central Sector Interest Subsidy (CSIS)</em> on education loans.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Tier 3: Annual Income &le; ₹8,00,000 / year</strong><br>
          Covers <em>AICTE Pragati Scholarship for Girls</em> (₹50,000/yr), <em>AICTE Saksham for Differently Abled</em> (₹50,000/yr), PM-YASASVI Top Class College education, and Central Economically Weaker Section (EWS) fee concessions.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">4</div>
        <div class="csc-st">
          <strong>Zero Income Limit (No Income Restrictions):</strong><br>
          <em>DST INSPIRE Scholarship</em> (Top 1% Class 12 merit), <em>TN First Graduate Scholarship</em> (100% Tuition waiver), <em>TN 7.5% Govt School Quota</em>, <em>Moovalur Ramamirtham Pudhumai Penn</em>, and <em>Tamil Pudhalvan</em> have <strong>no family income ceilings</strong>.
        </div>
      </div>
    </div>
    <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:2px;padding:8px 12px;font-size:12px;color:var(--sf);margin-top:8px">
      <strong>Important Requirement:</strong> The income certificate must be in the parent/guardian's name, issued by the Revenue Department / Tehsildar via state e-District or e-Sevai for the current financial year.
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('How to get income certificate')">Income Cert Steps</div>
    <div class="cqb" onclick="sendQ('why is the scheme matching 80%')">Match Score Rules</div>
    <div class="cqb" onclick="goPanel('eligibility')">Check Eligibility</div>
  </div>`;
}

function handleDomicileRulesQuery(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">State Domicile &amp; Inter-State Scholarship Rules</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    Clear guidelines on central vs. state jurisdictions for students studying inside or outside their home state:
  </div>

  <div class="csc">
    <div class="csc-h"><div class="csc-name">How Domicile Affects Eligibility</div></div>
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>Central Schemes (All India):</strong><br>
          Schemes administered by Central Ministries via NSP (National Scholarship Portal), AICTE (Pragati, Saksham), DST (INSPIRE), and UGC/CSIR (NET JRF, PMRF) are <strong>open to Indian citizens from all 28 states and 8 union territories</strong>.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>Tamil Nadu State Schemes:</strong><br>
          Schemes like <em>Pudhumai Penn</em>, <em>Tamil Pudhalvan</em>, and <em>7.5% Govt School Fee Waiver</em> mandate specific Tamil Nadu domicile and enrollment from Class 6–12 in Tamil Nadu government schools verified through the state EMIS portal.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Students from Other States Studying in Tamil Nadu:</strong><br>
          If you are domiciled in another state (e.g. Kerala, Andhra Pradesh, Maharashtra, UP, Bihar) and studying in Tamil Nadu, you apply for the <strong>Centrally Sponsored Post-Matric Scholarship under your home state's portal or NSP</strong> using a Bonafide Certificate issued by your Tamil Nadu college.
        </div>
      </div>
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('find my schemes')">Find My Schemes</div>
    <div class="cqb" onclick="sendQ('Can I get two scholarships at the same time?')">Dual Scholarships</div>
    <div class="cqb" onclick="goPanel('schemes')">Browse Schemes</div>
  </div>`;
}

function handleScholarshipVsFellowshipQuery(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Difference Between Scholarship, Fellowship, and Grant</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    While all three provide financial support, government portals classify them with distinct legal and academic definitions:
  </div>

  <div class="csc">
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>Scholarship (e.g. NSP Post-Matric, PM-USP, INSPIRE):</strong><br>
          Financial aid awarded to school, undergraduate, or postgraduate students based on economic need, community category, or merit. <strong>No work or research deliverable is expected</strong> from the student.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>Fellowship (e.g. PMRF, CSIR-UGC NET JRF):</strong><br>
          Competitive research stipends awarded to postgraduate, doctoral (Ph.D), or postdoctoral researchers. Recipients receive a monthly living allowance (₹31,000–₹80,000/month) and are <strong>actively engaged in academic research, lab work, or teaching assistance</strong>.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Grant (e.g. AICTE Pragati, Saksham, DST Research Grants):</strong><br>
          Financial awards allocated to students or institutions for a specific designated expenditure (e.g. ₹50,000/year to cover tuition fees, computer/books purchase, or research equipment), with no repayment obligation.
        </div>
      </div>
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('why is the scheme matching 80%')">Match Score Rules</div>
    <div class="cqb" onclick="sendQ('Research Fellowships details')">Research Fellowships</div>
    <div class="cqb" onclick="goPanel('schemes')">Browse Schemes</div>
  </div>`;
}

function handleAttendanceArrearsQuery(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Attendance, Backlogs &amp; Academic Performance Rules</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    How academic standing affects fresh applications and annual scholarship renewals:
  </div>

  <div class="csc">
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>Minimum Attendance Requirement (75%):</strong><br>
          NSP, AICTE, and state welfare departments require a minimum of <strong>75% attendance</strong> in each academic semester. Your college nodal officer must confirm this figure on the verification portal.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>Impact of Backlogs / Arrears:</strong><br>
          Most government scholarships require students to pass all subjects annually. If you have an active backlog, your renewal application is placed on hold until you pass the arrear paper in the next supplementary cycle.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Fresh Applications:</strong><br>
          Fresh applications evaluate qualifying examination marks (e.g., Class 10 or Class 12 board marks). Having no arrears at the point of admission is essential for institutional verification.
        </div>
      </div>
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('Scholarship renewal steps')">Renewal Guide</div>
    <div class="cqb" onclick="sendQ('why is the scheme matching 80%')">Match Score Rules</div>
    <div class="cqb" onclick="goPanel('eligibility')">Eligibility Checker</div>
  </div>`;
}

function handleBankDbtQuery(){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Bank Account, PFMS &amp; Aadhaar NPCI Seeding for Scholarships</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    All central and state scholarship disbursements are processed exclusively via Direct Benefit Transfer (DBT):
  </div>

  <div class="csc">
    <div class="csc-h"><div class="csc-name">Mandatory Bank Account Criteria</div></div>
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>Aadhaar-NPCI Seeding vs Simple KYC:</strong><br>
          Linking Aadhaar for branch KYC is <strong>not sufficient</strong>. Your bank account must be actively mapped in the <strong>NPCI (National Payments Corporation of India)</strong> database for DBT credit.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>How to Check NPCI Mapping Status:</strong><br>
          Visit <em>resident.uidai.gov.in/bank-mapper</em> or your bank's mobile banking app to verify that your Aadhaar is mapped to an active bank account.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Avoid Minor / Zero-Balance Caps:</strong><br>
          Ensure your account is an adult savings account without restrictive daily credit limits (e.g. ₹10,000 limits on unverified Jan Dhan accounts), which cause PFMS payment rejections.
        </div>
      </div>
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('find my schemes')">Find My Schemes</div>
    <div class="cqb" onclick="sendQ('Documents required for scholarships')">All Documents</div>
    <div class="cqb" onclick="goPanel('deadlines')">Check Deadlines</div>
  </div>`;
}

// ══ "WHAT IF?" ELIGIBILITY SIMULATOR ══
// Recomputes eligibility against a HYPOTHETICAL profile change — never
// touches the student's real saved profile (U) unless they explicitly
// click "Apply this to my real profile". Reuses localExtractProfile()
// (eligibility.js — the same deterministic regex extractor "Fill form with
// AI" already relies on) so this never invents a field value; if it can't
// parse the sentence, it says so instead of guessing.
let LAST_WHATIF_CHANGES = null;

// SCHEMES and TN_SCHEMES can contain the same id twice (a scheme present in
// both the national and TN static datasets) — same dedup handleFindMySchemesFlow()
// already applies before scoring, reused here so gained/lost lists below
// don't show a scheme twice.
function dedupeSchemesById(list){
  const seen = new Set();
  return list.filter(s => {
    const key = s.id || s.name;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const WHATIF_INC_LABELS = { under1:'Below ₹1L', '1to2.5':'₹1L–₹2.5L', '2.5to4.5':'₹2.5L–₹4.5L', '4.5to8':'₹4.5L–₹8L', above8:'Above ₹8L' };
const WHATIF_EDU_LABELS = { '9-10':'Class 9–10', '11-12':'Class 11–12', diploma:'Diploma/ITI', 'ug-arts':'UG Arts/Science', 'ug-tech':'UG Engineering', 'ug-medical':'UG Medical', pg:'Postgraduate', phd:'PhD' };
const WHATIF_FIELD_LABELS = { gender:'Gender', cat:'Category', inc:'Annual Family Income', edu:'Education Level', marks:'Marks', stream:'Stream', firstGrad:'First Generation Graduate', disability:'Differently-Abled', parentDisabled:'Parent Differently-Abled', age:'Age' };

function describeWhatIfChanges(before, changes){
  return Object.entries(changes).map(([field, newVal]) => {
    const label = WHATIF_FIELD_LABELS[field] || field;
    const display = v => field === 'inc' ? (WHATIF_INC_LABELS[v] || v) : field === 'edu' ? (WHATIF_EDU_LABELS[v] || v) : v;
    const oldVal = before[field];
    return oldVal && oldVal !== newVal ? `${label}: ${display(oldVal)} → ${display(newVal)}` : `${label}: ${display(newVal)}`;
  });
}

// Hostel residency isn't a scoring input anywhere in the matching engine —
// it only ever appears as informational allowance text on a few schemes'
// own reasons[] (see tn-schemes.js). Answering this honestly (no scoring
// change) beats fabricating a hostel field that doesn't exist in the data.
function handleWhatIfHostel(){
  if(!(U.cat && U.edu && U.inc)){
    return `Fill your eligibility profile first so I can check which of your eligible schemes mention a hostel allowance.<div class="cqr" style="margin-top:8px"><div class="cqb" onclick="goPanel('eligibility')">Fill Eligibility Form</div></div>`;
  }
  const allSchemesList = dedupeSchemesById([...(typeof SCHEMES!=='undefined'?SCHEMES:[]), ...(typeof TN_SCHEMES!=='undefined'?TN_SCHEMES:[])]);
  const scored = allSchemesList.map(s=>({...s, ...scoreScheme(s,U)})).filter(s=>s.eligible);
  const withHostelInfo = scored.filter(s => (s.reasons||[]).some(r=>/hostel/i.test(r)));
  if(!withHostelInfo.length){
    return `Hostel residency isn't a scoring factor in this matcher, and none of your currently eligible schemes mention a separate hostel allowance — it won't change your eligible-schemes list.`;
  }
  return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Hostel Residency — What It Actually Affects</strong>
  <div style="font-size:12px;color:var(--t2);margin:6px 0 10px;line-height:1.6">Hostel status doesn't change which schemes you qualify for here — it only affects the payout on a few of your <em>already-eligible</em> schemes that pay a separate hostel/maintenance component:</div>
  ${withHostelInfo.map(s=>`<div class="csc" style="padding:8px 10px"><div style="font-size:12.5px;font-weight:700">${esc(s.name)}</div><div style="font-size:11.5px;color:var(--t2);margin-top:2px">${esc((s.reasons.find(r=>/hostel/i.test(r))||'').replace(/^[✓ℹ⚠\s]+/,''))}</div></div>`).join('')}
  <div class="cqr" style="margin-top:10px"><div class="cqb" onclick="sendQ('find my schemes')">Back to my schemes</div></div>`;
}

function handleWhatIfQuery(t){
  if(/hostel/i.test(t)) return handleWhatIfHostel();

  if(!(U.cat && U.edu && U.inc)){
    return `I need your current profile first so I have something to compare against.<div class="cqr" style="margin-top:8px"><div class="cqb" onclick="goPanel('eligibility')">Fill Eligibility Form</div></div>`;
  }

  const changes = typeof localExtractProfile === 'function' ? localExtractProfile(t) : {};
  if(Object.keys(changes).length === 0){
    return `I couldn't tell what you want to change. Try <strong>"What if my family income is ₹3 lakh?"</strong> or <strong>"What if I'm OBC instead?"</strong>`;
  }

  const before = { ...U };
  const after = { ...U, ...changes };
  const allSchemesList = dedupeSchemesById([...(typeof SCHEMES!=='undefined'?SCHEMES:[]), ...(typeof TN_SCHEMES!=='undefined'?TN_SCHEMES:[])]);
  const scoreAll = profile => allSchemesList.map(s => ({ ...s, ...scoreScheme(s, profile) }));

  const beforeScored = scoreAll(before);
  const afterScored = scoreAll(after);
  const beforeEligibleIds = new Set(beforeScored.filter(s=>s.eligible).map(s=>s.id));
  const afterEligible = afterScored.filter(s=>s.eligible);
  const afterEligibleIds = new Set(afterEligible.map(s=>s.id));

  const gained = afterScored.filter(s => s.eligible && !beforeEligibleIds.has(s.id));
  const lost = beforeScored.filter(s => s.eligible && !afterEligibleIds.has(s.id));

  const bestFitBefore = typeof computeBestFit === 'function' ? computeBestFit(before, allSchemesList) : null;
  const bestFitAfter = typeof computeBestFit === 'function' ? computeBestFit(after, allSchemesList) : null;
  const inr = n => '₹'+Number(n||0).toLocaleString('en-IN');

  LAST_WHATIF_CHANGES = changes;

  let html = `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">What If: ${describeWhatIfChanges(before, changes).map(esc).join(', ')}?</strong>
  <div style="font-size:12px;color:var(--t2);margin:6px 0 10px;line-height:1.6">Simulation only — your saved profile is unchanged. ${beforeEligibleIds.size} → ${afterEligibleIds.size} eligible scheme(s)${bestFitBefore&&bestFitAfter ? `, best-combo value ${inr(bestFitBefore.comboTotalValue)}/yr → ${inr(bestFitAfter.comboTotalValue)}/yr` : ''}.</div>`;

  if(gained.length){
    html += `<div style="font-size:12px;font-weight:700;color:var(--gn);margin-bottom:6px">Newly Eligible (${gained.length})</div>`;
    html += gained.map(s=>`<div class="csc" style="padding:8px 10px"><div style="font-size:12.5px;font-weight:700">${esc(s.name)}</div><div style="font-size:11px;color:var(--t3)">${esc(s.amt)}</div></div>`).join('');
  }
  if(lost.length){
    html += `<div style="font-size:12px;font-weight:700;color:var(--rd);margin:${gained.length?10:0}px 0 6px">No Longer Eligible (${lost.length})</div>`;
    html += lost.map(s=>`<div class="csc" style="padding:8px 10px;opacity:.8"><div style="font-size:12.5px;font-weight:700">${esc(s.name)}</div><div style="font-size:11px;color:var(--t3)">${esc(s.amt)}</div></div>`).join('');
  }
  if(!gained.length && !lost.length){
    html += `<div style="font-size:12.5px;color:var(--t2)">No change — your eligible schemes stay the same under this scenario.</div>`;
  }

  html += `<div class="cqr" style="margin-top:12px">
    <div class="cqb" onclick="applyWhatIfToProfile()">Apply this to my real profile</div>
    <div class="cqb" onclick="sendQ('find my schemes')">Back to my actual schemes</div>
  </div>`;
  return html;
}

function applyWhatIfToProfile(){
  if(!LAST_WHATIF_CHANGES) return;
  const next = {...U, ...LAST_WHATIF_CHANGES};
  if(typeof invalidateEligibilityDetails==='function') next.eligibilityDetails=invalidateEligibilityDetails(U,next);
  Object.assign(U, next);
  LAST_MATCH = null;
  // Also sync the actual eligibility-form <select>/<input> fields — a later
  // "find my schemes" reads the DOM form first (getApplicantFormData()) and
  // would silently overwrite U right back from whatever's still sitting in
  // the form otherwise.
  if(typeof EF_FIELD_MAP === 'object'){
    Object.entries(EF_FIELD_MAP).forEach(([elId, key]) => {
      if(key in LAST_WHATIF_CHANGES){
        const el = document.getElementById(elId);
        if(el) el.value = LAST_WHATIF_CHANGES[key];
      }
    });
  }
  profileSet = Boolean(U.cat && U.edu && U.inc);
  if(typeof saveProfileLocal==='function') saveProfileLocal();
  if(typeof saveFormData==='function') saveFormData();
  if(typeof pushProfileToBackend==='function') pushProfileToBackend();
  if(typeof updateUI==='function') updateUI();
  if(typeof updateDashboard==='function') updateDashboard();
  LAST_WHATIF_CHANGES = null;
  sendQ('find my schemes');
}
window.applyWhatIfToProfile = applyWhatIfToProfile;

function handleGenericAdvisorResponse(query){
  return `
  <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px">Scholarship Advisory &amp; Eligibility Guidance</strong>
  <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    Regarding <em>"${esc(query)}"</em>: Government financial aid in India is structured around statutory mandates set by Central Ministries and State Welfare Departments.
  </div>

  <div class="csc">
    <div class="csc-h"><div class="csc-name">How Welfare &amp; Merit Schemes Function</div></div>
    <div class="csc-steps">
      <div class="csc-step">
        <div class="csc-sn">1</div>
        <div class="csc-st">
          <strong>Core Assessment Pillars:</strong> Eligibility is evaluated against <strong>Demographic Category</strong> (SC/ST/OBC/Minority/General), <strong>Course Level</strong> (Pre-Matric, UG Tech, Arts/Science, Medical, PG/PhD), and <strong>Family Annual Income</strong> (&le;₹2.5L, &le;₹4.5L, &le;₹8L, or open merit).
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">2</div>
        <div class="csc-st">
          <strong>Central vs. State Portals:</strong> Central schemes are applied via the <strong>National Scholarship Portal (NSP)</strong>, while state initiatives (such as Tamil Nadu's Pudhumai Penn, Tamil Pudhalvan, and First Graduate waiver) are processed via state departmental counseling and College Nodal Officers.
        </div>
      </div>
      <div class="csc-step">
        <div class="csc-sn">3</div>
        <div class="csc-st">
          <strong>Official Direct Registration:</strong> In the <strong>All Schemes</strong> section, every scheme card connects directly to that scheme's verified government registration portal so you can apply without hassle.
        </div>
      </div>
    </div>
  </div>

  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('find my schemes')">Find My Schemes</div>
    <div class="cqb" onclick="sendQ('why is the scheme matching 80%')">Why 80% Match?</div>
    <div class="cqb" onclick="sendQ('Can I get two scholarships at the same time?')">Dual Scholarships</div>
    <div class="cqb" onclick="sendQ('What is the income limit for scholarships?')">Income Slabs</div>
    <div class="cqb" onclick="goPanel('schemes')">Browse All Schemes</div>
  </div>`;
}

// Real AI answer grounded in the actual scheme catalog (backend/src/
// services/chatReply.service.js). Prioritizes core architectural flows
// so users get immediate rich interactive cards.
function catalogueReply(query) {
  return typeof SchemeCatalog!=='undefined' && typeof routeCatalogueChat==='function'?routeCatalogueChat(query):null;
}
function stateScholarshipInfo(query) {
  if(typeof SchemeCatalog !== 'undefined') return catalogueReply(query);
  return null;
}
async function getReply(t){
  const verified=catalogueReply(t); if(verified) return verified;
  const l = t.trim().toLowerCase();

  // Guided Application Assistant (checked ABOVE everything else): once a
  // student has started walking through a scheme's document checklist,
  // every message is their answer to the current step, not a new intent —
  // must not get reinterpreted by the regexes below.
  if(GUIDED_APP){
    if(/^\s*(yes|y|yeah|yep|i have|have it|got it|already have)\b/i.test(l)) return answerGuidedStep(true);
    if(/^\s*(no|n|nope|don'?t have|dont have|missing|not yet|need it)\b/i.test(l)) return answerGuidedStep(false);
    const doc = GUIDED_APP.sch.docs[GUIDED_APP.docIndex];
    return `Please answer <strong>Yes</strong> or <strong>No</strong> — do you already have: <strong>${esc(doc)}</strong>?
    <div class="cqr" style="margin-top:8px">
      <div class="cqb" onclick="sendQ('yes')">Yes, I have it</div>
      <div class="cqb" onclick="sendQ('no')">No, I don't</div>
    </div>`;
  }

  if (/income.*(cert|proof|document)|certificate.*income|how.*(get|make|apply).*income/i.test(t)) return reply(t);
  const stateInfo = stateScholarshipInfo(t);
  if (stateInfo) return stateInfo;

  // "What if...?" simulator — checked before every other intent, since a
  // sentence like "what if my income is ₹3 lakh" contains "income" and
  // would otherwise get hijacked by the generic income-ceilings explainer
  // (handleIncomeCeilingsQuery) further down, which just recites slabs
  // instead of actually recomputing this student's eligibility.
  if(/what if\b/i.test(l)){
    return handleWhatIfQuery(t);
  }

  // Architectural Flow 3 (checked FIRST): a message that names a specific
  // scheme AND asks about its fit ("how is X 100% applicable for me",
  // "why is this a match", "am I eligible for X") must get that scheme's
  // own reasons/blocks — not the generic "find my schemes" list below.
  // Flow 1's regex matches broadly on "scholarship...for me" wording, which
  // was swallowing named-scheme questions before this check ever ran.
  const namedSchemeForExplain = findSchemeByName(t);
  const asksAboutFit = /(why|how|is|am i|applicable|eligible|qualify)\b/i.test(l) && /(match|matching|score|percent|\%|applicable|eligible|qualify)/i.test(l);
  if(namedSchemeForExplain && asksAboutFit){
    return explainMatchReply(t);
  }
  // Same explanation, for follow-ups that name no scheme ("why is this 80%
  // match?") — resolves via LAST_SHOWN_SCHEMES inside explainMatchReply().
  if(/(why|how).{0,25}(match|matching|score|percent|%)|explain.{0,25}(match|score|this)/i.test(l)){
    return explainMatchReply(t);
  }
  if(/why.*(is|are)?.*matching.*(80|score|\%)|why.*80\%|why.*match.*80|how.*match.*(score|percent)|why.*not.*100|why.*score.*80|what.*does.*(80|score).*mean|how.*matching.*work|scoring.*criteria/i.test(l)){
    return handleScoreExplanationQuestion(t);
  }

  const informationOnly = /\b(?:tell me about|details?|information|what is)\b/i.test(t) && !/\b(?:eligible|qualify|for me|my schemes|my scholarships)\b/i.test(t);
  if (informationOnly) {
    const entry = findRegistrationForScheme(t);
    if (entry) return renderSchemeRegistrationCard(entry);
  }

  // Architectural Flow 1: find my schemes & any query asking about eligible schemes / scholarships
  if(/find.*(my)?.*(scheme|scholarship)|what.*(scheme|scholarship).*(eligible|for me|can i (apply|get))|am i eligible|check.*(my)?.*(scheme|scholarship|eligib)|my.*eligible.*(scheme|scholarship)|eligible.*(scheme|scholarship)|which.*(scheme|scholarship).*(can i|eligible|for me)|tell me.*(my)?.*(scheme|scholarship|eligible)|show.*(my)?.*(scheme|scholarship|eligible)|give.*(my)?.*(scheme|scholarship|eligible)|scholarship.*for me|scheme.*for me|am i eligible/i.test(l)){
    return handleFindMySchemesFlow();
  }
  // Architectural Flow 2: JEE mains Best Books
  if(/jee.*(main)?.*(best)?.*book|book.*jee|jee.*module|jee.*weightage|jee.*pattern|pyq.*jee|jee.*pyq/i.test(l)){
    return handleJeeMainsBestBooksFlow();
  }

  // Guided step-by-step application — must be checked here, BEFORE the
  // backend /chat fetch below, not only in reply()'s offline fallback.
  // Bug found via end-to-end testing: with the backend reachable, this
  // intent used to fall through to the live AI chat call every time (a
  // ~5s round trip) before finally reaching reply()'s copy of this same
  // check — and if that delayed response landed after a later message had
  // already been sent, it could silently activate GUIDED_APP mid-
  // conversation and hijack whatever the student typed next.
  if(/guide me|walk me through|step.?by.?step|help me apply/i.test(t)){
    const guidedMatch = findRegistrationForScheme(t);
    if(guidedMatch) return startGuidedApplication(guidedMatch.id);
  }

  if(navigator.onLine===false)return reply(t);
  try{
    const rawForm = getApplicantFormData();
    const activeProfile = (rawForm.cat && rawForm.edu && rawForm.inc) ? rawForm : (profileSet ? U : null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(API_BASE+'/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:t, profile: activeProfile}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if(res.ok){
      const json = await res.json();
      // Backend returns aiGenerated:false when OpenRouter isn't configured
      // (or the call failed) — that's just its own canned "can't reach AI"
      // fallback, not an actual answer, so prefer the local rule-based
      // reply() below instead of showing that unhelpful text.
      if(json && json.data && json.data.reply && json.data.aiGenerated) {
        return mdToSafeHtml(json.data.reply);
      }
    }
  }catch(e){
    // Backend offline or timeout — fall back to local rule engine immediately
  }
  return reply(t);
}
let typEl=null;
function addUser(t){
  const r=document.createElement('div'); r.className='mr user';
  r.innerHTML=`<div class="mav u">${U.name?U.name.charAt(0).toUpperCase():'U'}</div><div><div class="mbub user">${esc(t)}</div><div class="mt">${now()}</div></div>`;
  document.getElementById('chatMsgs').appendChild(r); scrollChat();
}
const aiIconSvg = `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`;
function addAI(h){
  const r=document.createElement('div'); r.className='mr';
  r.innerHTML=`<div class="mav ai">${aiIconSvg}</div><div style="max-width:76%"><div class="mbub ai">${h}</div><div class="mt">${now()}</div></div>`;
  document.getElementById('chatMsgs').appendChild(r); scrollChat();
}
function showTyp(){typEl=document.createElement('div');typEl.className='tdots';typEl.innerHTML=`<div class="mav ai">${aiIconSvg}</div><div class="tdot-bub"><div class="td"></div><div class="td"></div><div class="td"></div></div>`;document.getElementById('chatMsgs').appendChild(typEl);scrollChat();}
function hideTyp(){if(typEl){typEl.remove();typEl=null;}}
function scrollChat(){const c=document.getElementById('chatMsgs');setTimeout(()=>{c.scrollTop=c.scrollHeight;},50);}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function now(){return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});}

// ══ DIRECT SCHEME REGISTRATION DIRECTORY ══
// Maps every state & national scheme to its verified official direct registration URL,
// host department, and realistic procedural guide so users are never misled.
const DIRECT_REGISTRATION_DIRECTORY = [
  {
    id: 'pudhumai-penn',
    name: 'Moovalur Ramamirtham Pudhumai Penn Scheme',
    aliases: /pudhumai|moovalur|penn|girl.*(1000|thousand|higher education)|penkalvi/i,
    dept: 'Social Welfare & Women Empowerment Dept, Govt of Tamil Nadu',
    benefit: '₹1,000 / month (₹12,000/year)',
    portalName: 'tn.gov.in/scheme/data_view/68538',
    directUrl: 'https://www.tn.gov.in/scheme/data_view/68538',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    howType: 'College Nodal Officer EMIS Authentication & State Scheme Portal',
    steps: [
      'Important Reality: Students do not fill out an unauthenticated web form at home. Registration is submitted through your College Nodal Officer.',
      'Submit your 10-digit School EMIS ID (verifying Class 6–12 in Tamil Nadu Govt schools) to your college scholarship officer.',
      'The college nodal officer validates your profile on the official state Penkalvi / Social Welfare portal.',
      'Once verified, complete Aadhaar e-KYC. The ₹1,000/month stipend is credited directly via DBT into your Aadhaar-linked bank account.'
    ],
    docs: ['Govt School 6th–12th EMIS Number', 'Aadhaar Card', 'College Admission Bonafide / ID', 'Active Bank Account linked to NPCI/DBT']
  },
  {
    id: 'tamil-pudhalvan',
    name: 'Tamil Pudhalvan Scheme',
    aliases: /tamil pudhalvan|pudhalvan|boy.*(1000|thousand|higher education)/i,
    dept: 'Directorate of Technical Education (DOTE) / Higher Education Dept, TN',
    benefit: '₹1,000 / month (₹12,000/year)',
    portalName: 'dte.tn.gov.in/schemes-engineering-students',
    directUrl: 'https://dte.tn.gov.in/schemes-engineering-students',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    howType: 'College Nodal Officer EMIS Verification (Higher Education Dept)',
    steps: [
      'For male students admitted to UG degrees / diplomas after studying Classes 6 to 12 in Tamil Nadu Government schools.',
      'Like Pudhumai Penn, registration is verified through your college coordinator using your School EMIS ID.',
      'Department of Higher Education authenticates records through the DOTE educational network.',
      '₹1,000/month is deposited directly to your bank account via Aadhaar DBT.'
    ],
    docs: ['Class 6th–12th Govt School Study Proof / EMIS', 'Aadhaar Card', 'Active Bank Account linked to Aadhaar', 'College ID Card']
  },
  {
    id: 'tn-7point5-govt-school',
    name: 'TN 7.5% Government School Quota Fee Exemption (Engineering & Medical)',
    aliases: /7\.5|govt school reservation|govt school quota|7\.5%|dote.*7\.5|medical.*7\.5/i,
    dept: 'Directorate of Technical Education (DOTE) / DME, TN',
    benefit: '100% Tuition, Hostel & Counseling Fee Waived (~₹50,000–₹1,50,000/yr)',
    portalName: 'tneaonline.org/user/register (Engineering Registration Form)',
    directUrl: 'https://www.tneaonline.org/user/register',
    certUrl: 'https://tnmedicalselection.net',
    howType: 'TNEA / Medical Single Window Counseling (Automatic Waiver)',
    steps: [
      'Crucial Fact: There is NO separate scholarship application form. The fee waiver is availed directly during Admission Counseling!',
      'Engineering Candidates: Direct online registration on TNEA (tneaonline.org/user/register). Medical Candidates: Register on tnmedicalselection.net.',
      'Obtain the official 7.5% Bonafide Certificate from your School Headmaster (confirming Class 6–12 in TN Govt schools) countersigned by the CEO.',
      'Upload this certificate during counseling. Upon seat allotment, 100% Tuition fee, hostel fee, and development charges are paid by the Government directly to the college!'
    ],
    docs: ['Class 6–12 Govt School Bonafide Certificate (signed by HM & CEO)', 'TNEA / Medical Counseling Allotment Order', 'Aadhaar Card', '10th & 12th Marksheets']
  },
  {
    id: 'tn-first-graduate',
    name: 'TN First Generation Graduate Scholarship',
    aliases: /first grad|first gen|first generation/i,
    dept: 'Directorate of Technical Education (DOTE), TN',
    benefit: 'Full Tuition Fee Waiver (₹25,000/yr for Govt Quota Seats)',
    portalName: 'tneaonline.org/user/register & tnesevai.tn.gov.in/Citizen/Registration.aspx',
    directUrl: 'https://www.tneaonline.org/user/register',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    howType: 'TNEA Registration Form + e-Sevai First Graduate Certificate',
    steps: [
      'Step 1: Apply for the official First Graduate Certificate online via TN e-Sevai Citizen Registration (tnesevai.tn.gov.in/Citizen/Registration.aspx).',
      'Step 2: Register on the TNEA candidate registration form (tneaonline.org/user/register).',
      'Step 3: Select "First Generation Graduate: YES" and upload the digital e-Sevai certificate issued by the Tahsildar.',
      'Step 4: The tuition fee (₹25,000/yr in engineering) is deducted directly from your college admission fee!'
    ],
    docs: ['First Graduate Certificate from e-Sevai (Tahsildar signed)', 'Joint Declaration by Parent & Candidate', 'TNEA Allotment Letter', 'Family Ration Card']
  },
  {
    id: 'tn-adw-postmatric',
    name: 'TN Post-Matric Scholarship (SC/ST)',
    aliases: /tn.*adw|adi dravidar|tribal.*post.?matric|sc.*post.?matric.*tn|tn.*post.?matric.*sc|post.?matric.*\(sc\/st\)/i,
    dept: 'Adi Dravidar and Tribal Welfare Dept, Govt of Tamil Nadu',
    benefit: 'Full Tuition Fee + Exam Fee + ₹230–₹1,200/mo Hostel Allowance',
    portalName: 'tnadw.tn.gov.in & tnesevai.tn.gov.in/Citizen/Registration.aspx',
    directUrl: 'https://tnadw.tn.gov.in',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    howType: 'Institutional Module via College Scholarship Desk',
    steps: [
      'Step 1: Obtain digital Community Certificate (SC/ST) and Income Certificate (≤ ₹2.5L) from TN e-Sevai (tnesevai.tn.gov.in/Citizen/Registration.aspx).',
      'Step 2: Submit certificates along with college admission receipt to your College Scholarship Nodal Officer.',
      'Step 3: The institution uploads and verifies your record on the Tamil Nadu ADW Institutional Scholarship system.',
      'Step 4: Tuition fee is credited directly to the college; maintenance/hostel grant is paid into your bank account via DBT.'
    ],
    docs: ['e-Sevai Community Certificate (SC/ST)', 'e-Sevai Income Certificate (≤ ₹2.5L for current FY)', 'College Bonafide & Fee Receipt', 'Aadhaar-seeded Bank Passbook']
  },
  {
    id: 'tn-bcmbc-postmatric',
    name: 'TN Post-Matric Scholarship (BC/MBC/DNC)',
    aliases: /bc.?mbc|backward.*post.?matric|dnc.*post.?matric|bcw.*postmatric|post.?matric.*\(bc\/mbc\/dnc\)/i,
    dept: 'BC, MBC & Minorities Welfare Dept, Govt of Tamil Nadu',
    benefit: 'Tuition Fee Waiver + Exam Fees + Maintenance Allowance',
    portalName: 'bcw.tn.gov.in & tnesevai.tn.gov.in/Citizen/Registration.aspx',
    directUrl: 'https://bcw.tn.gov.in',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    howType: 'BC/MBC Welfare Department Portal',
    steps: [
      'Click the button below to visit the official BC, MBC & Minorities Welfare Department portal (bcw.tn.gov.in).',
      'Eligibility: BC candidates require family income ≤ ₹2.5 Lakhs; MBC/DNC candidates have no income ceiling for first graduate UG degrees.',
      'Submit application via your college scholarship section with digitized e-Sevai community and income certificates.',
      'District BC/MBC Welfare Officer approves sanction online.'
    ],
    docs: ['BC/MBC/DNC Community Certificate', 'Income Certificate (for BC candidates)', 'College Admission Receipt', 'Bank Passbook']
  },
  {
    id: 'nsp-portal',
    name: 'National Scholarship Portal (Central Sector, Pragati, Saksham, Post-Matric)',
    aliases: /\bnsp\b|national scholarship.*portal|central sector|pragati|saksham|begum hazrat/i,
    dept: 'Ministry of Education / AICTE / Ministry of Social Justice, Govt of India',
    benefit: '₹12,000 to ₹50,000 / year (by scheme)',
    portalName: 'scholarships.gov.in/otrapplication/#/registration-page',
    directUrl: 'https://scholarships.gov.in/otrapplication/#/registration-page',
    certUrl: 'https://scholarships.gov.in/otrapplication/#/login-page',
    howType: 'NSP One-Time Registration (OTR) Form',
    steps: [
      'Click below to open the direct One-Time Registration form on NSP (scholarships.gov.in/otrapplication/#/registration-page).',
      'Complete One Time Registration (OTR) using your Aadhaar-linked mobile number to get an OTR Reference ID.',
      'Log in with OTR credentials and select your specific scheme (e.g. AICTE Pragati for Girls, Central Sector CSSS, or Post-Matric).',
      'Upload income certificate, marksheet, and college enrollment verification.',
      'Institute Nodal Officer (INO) verifies application online → DBT disbursement to bank.'
    ],
    docs: ['Aadhaar Card (linked to mobile & NPCI bank account)', 'Income Certificate for Current FY', 'Class 10 & 12 Marksheets', 'College Bonafide Certificate']
  },
  {
    id: 'inspire-dst',
    name: 'INSPIRE Scholarship for Higher Education (SHE)',
    aliases: /inspire|dst.*inspire|basic science.*scholarship/i,
    dept: 'Department of Science and Technology (DST), Govt of India',
    benefit: '₹80,000 / year (₹60,000 cash + ₹20,000 mentorship project)',
    portalName: 'online-inspire.gov.in/Account/Register',
    directUrl: 'https://online-inspire.gov.in/Account/Register',
    certUrl: 'https://online-inspire.gov.in/Account/LogOn',
    howType: 'DST INSPIRE Direct Student Registration Form',
    steps: [
      'Click below to open the direct DST INSPIRE Student Registration Form (online-inspire.gov.in/Account/Register).',
      'Fill in applicant account registration details and verify your email.',
      'Enter your Class 12 board roll number (must fall within the top 1% cut-off of your state/central board).',
      'Upload Endorsement Certificate from the Head of your BSc / BS / Int. MSc institution.',
      'DST reviews applications nationally and sanctions scholarship directly to student bank account.'
    ],
    docs: ['Class 12 Marksheet & State Board 1% Cut-off certificate', 'Head of Institution Endorsement Form', 'Aadhaar Card', 'SBI Bank Passbook']
  },
  {
    id: 'pmrf',
    name: 'Prime Minister’s Research Fellowship (PMRF)',
    aliases: /pmrf|prime minister.*research fellowship/i,
    dept: 'Ministry of Education, Govt of India',
    benefit: '₹70,000 – ₹80,000 / month + ₹2 Lakh/yr Contingency',
    portalName: 'pmrf.in',
    directUrl: 'https://pmrf.in',
    howType: 'PMRF National Portal & Host IIT/IISc Coordinator',
    steps: [
      'Click the button below to launch the official PMRF Portal (pmrf.in).',
      'Direct Entry: Completed B.Tech/integrated M.Tech from Centrally Funded Tech Institutes (CFTIs) with CGPA ≥ 8.0.',
      'Lateral Entry: Enrolled in PhD at IIT/IISc/NIT with minimum 4 courses completed with CGPA ≥ 8.5.',
      'Application is forwarded and recommended by the host IIT/IISc PMRF coordinator.'
    ],
    docs: ['Undergraduate / PG Degree Transcripts', 'PhD Admission Offer Letter', 'Research Proposal Summary', 'Nodal Institute Recommendation']
  },
  {
    id: 'csir-net-jrf',
    name: 'CSIR-UGC NET Junior Research Fellowship (JRF)',
    aliases: /csir|ugc.*net|jrf/i,
    dept: 'National Testing Agency (NTA) & CSIR / UGC',
    benefit: '₹37,000 / month + HRA',
    portalName: 'csirnet.nta.nic.in',
    directUrl: 'https://csirnet.nta.nic.in',
    howType: 'NTA Exam Registration Portal',
    steps: [
      'Click below to open the official CSIR NET portal on NTA (csirnet.nta.nic.in).',
      'Apply online on the active registration link during the twice-yearly exam window (June & December sessions).',
      'Candidates with M.Sc. / equivalent degree with minimum 55% marks (50% for SC/ST/PwD) are eligible.',
      'Qualifying candidates receive award letters to join PhD programmes with monthly fellowship.'
    ],
    docs: ['Master’s Degree Certificate / Marksheets', 'Category / EWS / Disability Certificate', 'Passport Photo & Signature', 'Aadhaar Card']
  },
  {
    id: 'tn-construction-workers',
    name: 'TN Construction Workers Welfare Board Educational Grant',
    aliases: /construction worker|tnuwwb|unorganised worker.*welfare/i,
    dept: 'TN Unorganised Workers Welfare Board, Govt of Tamil Nadu',
    benefit: 'Up to ₹50,000 / year',
    portalName: 'tnuwwb.tn.gov.in/users/login',
    directUrl: 'https://tnuwwb.tn.gov.in/users/login',
    howType: 'TNUWWB Member Claim Login Page',
    steps: [
      'Click below to open the official Member Login page for TN Construction Workers Welfare Board (tnuwwb.tn.gov.in/users/login).',
      'Parent logs in with their active Registration Identity Card Number and registered credentials.',
      'Navigate to "Claim Educational Assistance" under active benefits.',
      'Assistance amount (scaling from school up to ₹50,000 for professional courses) is credited to bank account.'
    ],
    docs: ['Parent Construction Worker Welfare Board ID Card / Book', 'College Admission & Fee Receipt', 'Student Aadhaar & Bank Passbook', 'Ration Card / Relationship Proof']
  },
  {
    id: 'tn-differently-abled',
    name: 'Scholarship for Wards of Differently-Abled Persons',
    aliases: /differently.?abled|disab.*ward|son.*daughter.*differently/i,
    dept: 'State Commissionerate for the Welfare of the Differently Abled, TN',
    benefit: '₹4,000 – ₹12,500 / year',
    portalName: 'scd.tn.gov.in & tnesevai.tn.gov.in/Citizen/Registration.aspx',
    directUrl: 'https://scd.tn.gov.in',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    howType: 'District Differently Abled Welfare Office (DDAWO)',
    steps: [
      'Click below to visit the official State Commissionerate for the Differently Abled (scd.tn.gov.in).',
      'For children of parents holding a certified National Disability Identity Card (UDID) with ≥40% disability.',
      'Submit application form at the District Differently Abled Welfare Office (DDAWO) or your local e-Sevai centre.',
      'Sanctioned grant is transferred directly to the student.'
    ],
    docs: ['Parent UDID / National Disability Identity Card', 'College Bonafide Certificate', 'Ration Card / Family Card', 'Student Aadhaar & Bank Details']
  },
  {
    id: 'tn-esevai',
    name: 'Tamil Nadu e-Sevai / e-District Citizen Registration Form',
    aliases: /esevai|e-sevai|edistrict|income cert|caste cert|community cert|nativity/i,
    dept: 'Tamil Nadu e-Governance Agency (TNeGA), Govt of Tamil Nadu',
    benefit: 'Digital Certificates for Scholarship Eligibility',
    portalName: 'tnesevai.tn.gov.in/Citizen/Registration.aspx',
    directUrl: 'https://www.tnesevai.tn.gov.in/Citizen/Registration.aspx',
    certUrl: 'https://www.tnesevai.tn.gov.in/Citizen/PortalLogin.aspx',
    howType: 'Direct Citizen Registration Form',
    steps: [
      'Click below to open the direct Citizen Registration Form on Tamil Nadu e-Sevai (tnesevai.tn.gov.in/Citizen/Registration.aspx).',
      'Fill in Full Name, District, Taluk, Mobile Number, Email, and Aadhaar to create your citizen login.',
      'Log in and apply online for: 1. Community Certificate, 2. Income Certificate, 3. First Graduate Certificate.',
      'Certificates are digitally signed by the Revenue Tahsildar with QR-code verification (valid for DigiLocker and admission counseling).'
    ],
    docs: ['Aadhaar Card', 'Ration / Smart Family Card', 'Parent Salary / Income Proof', 'School TC (for Community Proof)']
  },
  {
    id: 'tn-cmfp',
    name: 'Tamil Nadu Chief Minister’s Fellowship Programme (TNCMFP)',
    aliases: /cmfp|chief minister.*fellowship|tncmfp/i,
    dept: 'Special Programme Implementation Dept, Govt of Tamil Nadu & BIM Trichy',
    benefit: '₹75,000 / month (₹65k stipend + ₹10k allowance) for 2 years',
    portalName: 'bim.edu/index/tncmfp',
    directUrl: 'https://bim.edu/index/tncmfp/',
    howType: 'State Academic Partner (BIM Trichy) Official Application Portal',
    steps: [
      'Click below to open the official TNCMFP portal managed by academic partner Bharathidasan Institute of Management (BIM Trichy).',
      'Check current cohort notification and register using your email and mobile number.',
      'Complete three-stage selection: Computer-based test, Comprehensive written examination, and Personal Interview in Chennai.',
      'Appointed Fellows work directly with Government departments monitoring state flagship schemes.'
    ],
    docs: ['Postgraduate Degree / Professional Degree Certificate', 'Age Proof (22–30 yrs, relaxed to 35 for SC/ST, 33 for BC/MBC)', 'TN Nativity / Residence Proof', 'First Class / Distinction Academic Transcripts']
  }
];

// ══ GUIDED STEP-BY-STEP APPLICATION ASSISTANT ══
// Walks a student through one required document at a time for a specific
// scheme: what it is, whether they already have it, how to get it if not,
// then a final checklist. Deterministic only, per spec — every document
// name, step, and portal URL comes from DIRECT_REGISTRATION_DIRECTORY
// above (hand-curated per scheme, same source renderSchemeRegistrationCard
// uses), and "how to obtain" text is a small fixed lookup table keyed by
// doc-name substrings, not model-generated. Nothing here calls the LLM or
// invents a document/deadline/eligibility rule/procedure not already in
// that data — if a scheme's docs[] is wrong, fix it there, not here.
let GUIDED_APP = null; // { sch, docIndex, docStatus: { [docName]: 'have'|'missing' } }

// Reuses guidance already given elsewhere in this file (income cert / NPCI
// / community cert flows) rather than inventing new procedures per document.
const DOC_HOWTO = [
  { match: /aadhaar/i, text: 'Enroll/update at your nearest Aadhaar Seva Kendra or via uidai.gov.in — usually ready same day.' },
  { match: /income cert/i, text: 'Apply online via your state e-District/e-Sevai portal — issued by the Revenue Dept/Tahsildar. Ask this chat "How to get income certificate" for the full steps.' },
  { match: /community cert|caste cert/i, text: 'Apply online via your state e-District/e-Sevai portal — issued by the Revenue Dept/Tahsildar, same portal as the income certificate.' },
  { match: /bank passbook|bank account|npci/i, text: 'Confirm the named programme’s bank-account and DBT requirements in its official guidelines. A zero balance alone does not make an account ineligible.' },
  { match: /bonafide|admission receipt|allotment/i, text: 'Request this from your college/school admin office or registrar — usually issued same-day on request.' },
  { match: /emis/i, text: 'Ask your school/college administration for your EMIS ID — it\'s on your student records.' },
  { match: /marksheet|marks card|transcript/i, text: 'Use your original latest marksheet/transcript issued by your board or university.' },
  { match: /photo|signature/i, text: 'A recent passport-size photo and scanned signature, sized per the portal\'s upload requirements.' },
];
function docHowTo(doc){
  const hit = DOC_HOWTO.find(d => d.match.test(doc));
  return hit ? hit.text : 'Check the official portal\'s document checklist, or your college scholarship desk, for how to obtain this.';
}

function startGuidedApplication(schId){
  if(typeof SchemeCatalog !== 'undefined')return startCatalogueGuidance(schId);
  const sch = DIRECT_REGISTRATION_DIRECTORY.find(s => s.id === schId);
  if(!sch || !Array.isArray(sch.docs) || !sch.docs.length){
    return `I don't have a verified document checklist for that scheme yet — use <strong>How to apply</strong> instead for what's confirmed.`;
  }
  GUIDED_APP = { sch, docIndex: 0, docStatus: {} };
  return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Guided Application — ${esc(sch.name)}</strong>
  <div style="font-size:12px;color:var(--t2);margin:4px 0 10px;line-height:1.6">I'll walk you through each required document one at a time — tell me what you already have, and I'll explain how to get anything missing. At the end you'll get a full checklist.</div>
  ${renderGuidedStep()}`;
}
window.startGuidedApplication = startGuidedApplication;

function renderGuidedStep(){
  const { sch, docIndex } = GUIDED_APP;
  const doc = sch.docs[docIndex];
  return `<div class="csc">
    <div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Document ${docIndex+1} of ${sch.docs.length}</div>
    <div class="csc-name">${esc(doc)}</div>
    <div style="font-size:12.5px;color:var(--t2);margin-top:4px">Do you already have this?</div>
  </div>
  <div class="cqr" style="margin-top:8px">
    <div class="cqb" onclick="sendQ('yes')">Yes, I have it</div>
    <div class="cqb" onclick="sendQ('no')">No, I don't</div>
  </div>`;
}

function answerGuidedStep(hasIt){
  if(GUIDED_APP?.catalogue)return answerCatalogueGuidance(hasIt);
  const { sch, docIndex } = GUIDED_APP;
  const doc = sch.docs[docIndex];
  GUIDED_APP.docStatus[doc] = hasIt ? 'have' : 'missing';
  const feedback = hasIt
    ? `<div style="color:var(--gn);font-size:13px">&#10003; Noted — you have <strong>${esc(doc)}</strong>.</div>`
    : `<div style="color:var(--gd);font-size:13px">&#9888; You don't have <strong>${esc(doc)}</strong> yet.</div><div style="font-size:12.5px;color:var(--t2);margin-top:4px">${docHowTo(doc)}</div>`;
  GUIDED_APP.docIndex++;
  const next = GUIDED_APP.docIndex >= sch.docs.length ? finishGuidedApplication() : renderGuidedStep();
  return feedback + `<div style="margin-top:12px">${next}</div>`;
}
window.answerGuidedStep = answerGuidedStep;

function finishGuidedApplication(){
  const { sch, docStatus } = GUIDED_APP;
  const have = Object.keys(docStatus).filter(d => docStatus[d] === 'have');
  const missing = Object.keys(docStatus).filter(d => docStatus[d] === 'missing');
  const html = `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Final Checklist — ${esc(sch.name)}</strong>
  <div class="csc" style="margin-top:8px">
    ${have.length ? `<div style="font-size:12px;font-weight:700;color:var(--gn);margin-bottom:4px">Ready (${have.length})</div>${have.map(d => `<div style="color:var(--gn);font-size:12px">&#10003; ${esc(d)}</div>`).join('')}` : ''}
    ${missing.length ? `<div style="font-size:12px;font-weight:700;color:var(--gd);margin:${have.length ? 10 : 0}px 0 4px">Still Needed (${missing.length})</div>${missing.map(d => `<div style="color:var(--gd);font-size:12px;margin-bottom:3px">&#9888; <strong>${esc(d)}</strong> — ${docHowTo(d)}</div>`).join('')}` : ''}
  </div>
  <div style="font-size:12px;color:var(--t2);margin-top:10px">${missing.length ? 'Once everything above is ready, apply' : 'You have everything — apply'} directly:</div>
  <a href="${sch.directUrl}" target="_blank" rel="noopener noreferrer" class="csc-launch">Launch Official Portal &rarr;</a>
  <div class="cqr" style="margin-top:10px">
    <div class="cqb" onclick="sendQ('find my schemes')">Find my schemes</div>
    <div class="cqb" onclick="goPanel('tracker')">Track this application</div>
  </div>`;
  GUIDED_APP = null;
  return html;
}

// ══ MATCH SCORE EXPLANATION ══
// Populated by handleFindMySchemesFlow() with the cards it just showed, so a
// follow-up like "why is this 80% match?" (which names no scheme) still
// resolves to the right one's actual reasons/blocks instead of guessing.
let LAST_SHOWN_SCHEMES = [];

function findSchemeByName(query){
  const q = (query || '').toLowerCase();
  const allSchemesList = [
    ...(typeof SCHEMES !== 'undefined' ? SCHEMES : []),
    ...(typeof TN_SCHEMES !== 'undefined' ? TN_SCHEMES : [])
  ];
  for(const s of allSchemesList){
    if(q.includes(s.name.toLowerCase())) return s;
  }
  const stop = ['scholarship', 'scheme', 'central', 'sector', 'the', 'for'];
  for(const s of allSchemesList){
    const words = s.name.toLowerCase().replace(/[()–—/]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stop.includes(w));
    if(words.length && words.filter(w => q.includes(w)).length >= Math.min(2, words.length)) return s;
  }
  return null;
}

function explainMatchReply(t){
  const pctMatch = t.match(/(\d{1,3})\s*%/);
  let target = null;

  const named = findSchemeByName(t);
  if(named && profileSet){
    const r = typeof scoreScheme === 'function' ? scoreScheme(named, U) : (named.eligFn ? named.eligFn(U) : null);
    if(r) target = { name: named.name, score: r.score, reasons: r.reasons, blocks: r.blocks };
  }
  if(!target && pctMatch && LAST_SHOWN_SCHEMES.length){
    target = LAST_SHOWN_SCHEMES.find(s => String(s.score) === pctMatch[1]);
  }
  if(!target && LAST_SHOWN_SCHEMES.length){
    target = LAST_SHOWN_SCHEMES[0];
  }
  if(!target){
    return `I don't have a specific scheme in view to explain yet. Ask <strong>"find my schemes"</strong> first, then ask "why is this X% match?" about one of the results and I'll break down the score.
    <div class="cqr"><div class="cqb" onclick="sendQ('find my schemes')">Find my schemes</div></div>`;
  }

  const reasons = target.reasons || [];
  const positives = reasons.filter(r => r.startsWith('✓'));
  const warnings = reasons.filter(r => r.startsWith('⚠'));
  const info = reasons.filter(r => r.startsWith('ℹ'));
  const blocks = target.blocks || [];

  return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Why "${target.name}" shows ${target.score}% match</strong>
  <div style="margin:6px 0 8px;color:var(--t2);font-size:12.5px;line-height:1.6">
    The score adds points for each criterion your profile confirms, and holds points back wherever something's unverified, borderline, or missing — it's an estimate of fit, not a guarantee of selection.
  </div>
  <div class="csc" style="font-size:12px;line-height:1.6">
    ${positives.length ? `<div style="color:var(--gn);margin-bottom:6px">${positives.map(r => `<div>${r}</div>`).join('')}</div>` : ''}
    ${warnings.length ? `<div style="color:var(--gd);margin-bottom:6px">${warnings.map(r => `<div>${r}</div>`).join('')}</div>` : ''}
    ${info.length ? `<div style="color:var(--t2);margin-bottom:6px">${info.map(r => `<div>${r}</div>`).join('')}</div>` : ''}
    ${blocks.length ? `<div style="color:var(--rd)">${blocks.map(b => `<div>&#10007; ${b}</div>`).join('')}</div>` : ''}
    ${!reasons.length && !blocks.length ? `<div style="color:var(--t3)">No specific criteria recorded for this scheme yet — fill in your Eligibility Form for a precise breakdown.</div>` : ''}
  </div>
  <div class="cqr" style="margin-top:8px">
    <div class="cqb" onclick="goPanel('eligibility')">Edit my details</div>
    <div class="cqb" onclick="sendQ('How to apply for ${esc(target.name)}?')">How to apply</div>
  </div>`;
}

function findRegistrationForScheme(query){
  if(typeof SchemeCatalog !== 'undefined') {
    const q=String(query || '').toLowerCase();
    const record=SCHEMES.find(s=>s.id===query || q.includes(s.name.toLowerCase()));
    return record ? {...record,dept:record.by,benefit:record.amt,directUrl:SourcePolicy.registrationUrl(record),howType:'Official information — rules pending',docs:[],steps:[]} : null;
  }
  if(!query) return null;
  const q = query.toLowerCase();
  for(const item of DIRECT_REGISTRATION_DIRECTORY){
    if(item.aliases.test(q)) return item;
  }
  // Word overlap matching
  for(const item of DIRECT_REGISTRATION_DIRECTORY){
    const words = item.name.toLowerCase()
      .replace(/[()—–/]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['scholarship', 'scheme', 'dept', 'govt', 'tamil', 'nadu'].includes(w));
    if(words.length >= 2 && words.filter(w => q.includes(w)).length >= 2){
      return item;
    }
  }
  return null;
}
window.findRegistrationForScheme = findRegistrationForScheme;

function renderSchemeRegistrationCard(sch){
  if(typeof SchemeCatalog !== 'undefined') return chatProgrammeCard(sch,{steps:true});
  return `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;line-height:1.4">${sch.name}</div>
  <div style="font-size:11.5px;color:var(--t3);margin:2px 0 6px">${sch.dept}</div>
  <div class="csc-portal-pill">${sch.howType}</div>
  <div style="margin:4px 0 8px;font-size:12.5px"><strong>Benefit:</strong> <span style="color:var(--gn);font-weight:700">${sch.benefit}</span></div>

  <a href="${sch.directUrl}" target="_blank" rel="noopener noreferrer" class="csc-launch">
    <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    Launch Official Portal &rarr;
  </a>
  ${sch.certUrl ? `
  <a href="${sch.certUrl}" target="_blank" rel="noopener noreferrer" class="csc-launch" style="background:rgba(255,255,255,0.06);color:#fff !important;border:1px solid var(--bdr);margin-top:0">
    <svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    ${sch.id==='tn-7point5-govt-school'?'Medical Selection Portal (tnmedicalselection.net) &rarr;':sch.id==='pudhumai-penn'?'TN.gov.in Scheme Portal &rarr;':'Digital Certificate Portal (tnesevai.tn.gov.in) &rarr;'}
  </a>` : ''}
  <div class="csc-launch-sub">Official domain: <strong>${sch.portalName}</strong>. Opens directly in a new tab.</div>

  <div class="csc">
    <div class="csc-h"><div class="csc-name">Step-by-Step Registration Guide</div></div>
    <div class="csc-steps">
      ${sch.steps.map((st, i) => `<div class="csc-step"><div class="csc-sn">${i+1}</div><div class="csc-st">${st}</div></div>`).join('')}
    </div>
    <div style="margin-top:10px;font-size:12px;font-weight:700">Documents Required at Registration:</div>
    <div style="margin-top:4px">
      ${sch.docs.map(d => `<span class="csc-doc-chip">${d}</span>`).join('')}
    </div>
    <div class="csc-btns" style="margin-top:10px">
      <button class="csc-bp" onclick="addAI(startGuidedApplication('${sch.id}'))">Start Guided Application &rarr;</button>
      <button class="csc-bs" onclick="sendQ('How to get income certificate')">Get Income Cert</button>
      <button class="csc-bs" onclick="sendQ('How to register for other schemes?')">Other Scheme Links</button>
    </div>
  </div>`;
}

function renderRegistrationHub(){
  if(typeof SchemeCatalog !== 'undefined') return catalogueReply('official scholarship application portals');
  let matchedHtml = '';
  if(LAST_MATCH && LAST_MATCH.eligible && LAST_MATCH.eligible.length > 0){
    const topElig = LAST_MATCH.eligible.slice(0, 3);
    matchedHtml = `
    <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:2px;padding:8px 10px;margin:8px 0 12px">
      <div style="font-size:11px;font-weight:700;color:var(--gn);text-transform:uppercase;letter-spacing:0.5px">Recommended For Your Profile</div>
      <div style="font-size:12px;color:var(--t2);margin-top:3px">Direct registration links for your matched schemes:</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        ${topElig.map(s => {
          const reg = findRegistrationForScheme(s.name) || { directUrl: SourcePolicy.registrationUrl(s) || '#', portalName: s.by, name: s.name };
          return `<a href="${reg.directUrl}" target="_blank" rel="noopener noreferrer" class="csc-launch" style="padding:8px 12px;margin:0;font-size:12px">
            Launch ${s.name} Registration &rarr;
          </a>`;
        }).join('')}
      </div>
    </div>`;
  }

  return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Official Scheme Registration Hub</strong>
  <div style="font-size:12px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
    Tamil Nadu and Central welfare schemes are hosted on <strong>different official government portals</strong> (there is no single form for all schemes).
    Click any scheme below to go <strong>directly</strong> to its official registration page without manual searching:
  </div>
  ${matchedHtml}
  <div class="csc">
    <div class="csc-h"><div class="csc-name">Tamil Nadu Flagship Schemes</div></div>
    <div class="cqr" style="margin-top:4px">
      <div class="cqb" onclick="sendQ('How to register for Pudhumai Penn Scheme')">Pudhumai Penn (Girls ₹1K/mo)</div>
      <div class="cqb" onclick="sendQ('How to register for Tamil Pudhalvan Scheme')">Tamil Pudhalvan (Boys ₹1K/mo)</div>
      <div class="cqb" onclick="sendQ('How to register for 7.5% Govt School Quota Fee Waiver')">7.5% Govt School Fee Waiver</div>
      <div class="cqb" onclick="sendQ('How to register for TN First Graduate Scholarship')">First Graduate Scholarship</div>
      <div class="cqb" onclick="sendQ('How to register for TN Post-Matric Scholarship SC/ST')">TN SC/ST Post-Matric</div>
      <div class="cqb" onclick="sendQ('How to register for TN BC/MBC Post-Matric Scholarship')">TN BC/MBC Post-Matric</div>
    </div>
    <div class="csc-h" style="margin-top:12px"><div class="csc-name">National & Central Schemes</div></div>
    <div class="cqr" style="margin-top:4px">
      <div class="cqb" onclick="sendQ('How to register for AICTE Pragati Scholarship')">AICTE Pragati (₹50,000/yr)</div>
      <div class="cqb" onclick="sendQ('How to register for NSP Central Sector Scholarship')">NSP Central Sector (₹20K/yr)</div>
      <div class="cqb" onclick="sendQ('How to register for NSP Post-Matric Scholarship')">NSP National Post-Matric</div>
      <div class="cqb" onclick="sendQ('How to register for INSPIRE Scholarship DST')">INSPIRE Science (₹80K/yr)</div>
      <div class="cqb" onclick="sendQ('How to register for PMRF Research Fellowship')">PMRF Fellowship (₹80K/mo)</div>
    </div>
  </div>
  <div style="font-size:11.5px;color:var(--t3);margin-top:8px">
    Tip: You can also ask <em>"How to register for [any scheme name]"</em> to get its direct link and step-by-step guidance immediately!
  </div>`;
}

function reply(t){
  const verified=catalogueReply(t); if(verified) return verified;
  const l=t.toLowerCase();
  if(typeof SchemeCatalog!=='undefined')return `<strong>SchemeMatch Assistant</strong><p>I can help with your saved profile, scheme details, official application links, preparation steps and exam notices.</p><div class="cqr"><button class="cqb" onclick="sendQ('find my schemes')">Find my schemes</button><button class="cqb" onclick="sendQ('Official registration links for schemes')">Registration links</button><button class="cqb" onclick="goPanel('exams')">Exam Calendar</button></div>`;

  if(/income.*(cert|proof|document)|certificate.*income|how.*(get|make|apply).*income/i.test(t)){
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">How to Get Income Certificate for Scholarships (NSP & State Portals)</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">Issued by Revenue Department / Tehsildar · Valid for Current Financial Year</div>
    <div class="csc">
      <div class="csc-h"><div class="csc-name">Fastest Ways to Apply</div></div>
      <div class="csc-steps">
        <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st"><strong>Online Portal (Fastest):</strong> Apply via state e-District portal — e.g. TN e-Seva, UP eSathi, MahaOnline, Karnataka Seva Sindhu, or national e-District.nic.in.</div></div>
        <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st"><strong>Offline Center:</strong> Visit your nearest <strong>CSC (Jan Seva Kendra / MeeSeva)</strong> or local Taluk/Tehsildar office.</div></div>
        <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st"><strong>Documents Required:</strong> Parent/Guardian's Aadhaar card, Ration card / Family card, Salary slip or ITR / Self-declaration affidavit, and Passport photo.</div></div>
        <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st"><strong>Processing & Download:</strong> Takes <strong>7–15 days</strong>. Once approved, download digitally or pull it directly into <strong>DigiLocker</strong>.</div></div>
      </div>
      <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.25);border-radius:2px;padding:8px 12px;font-size:12px;color:var(--sf);margin-top:8px">
        <strong>Important for NSP:</strong> Certificate must be in the <strong>Parent/Guardian's name</strong>, issued on or after April 1 of current year. Apply now before the October 31 deadline!
      </div>
      <div class="csc-btns" style="margin-top:10px">
        <button class="csc-bp" onclick="sendQ('NSP scholarship documents required')">All NSP Documents</button>
        <button class="csc-bs" onclick="sendQ('NSP Post-Matric Scholarship details')">NSP Scheme Details</button>
      </div>
    </div>`;
  }

  const stateInfo = stateScholarshipInfo(t);
  if (stateInfo) return stateInfo;

  // "What if...?" simulator — same priority reasoning as getReply() above.
  if(/what if\b/i.test(l)){
    return handleWhatIfQuery(t);
  }

  // Architectural Flow 3 (checked FIRST, mirrors getReply() above): a named
  // scheme + fit question ("how is X 100% applicable for me") must resolve
  // to that scheme's own reasons, not get swallowed by Flow 1's broad
  // "scholarship...for me" match below.
  const namedSchemeForExplain = findSchemeByName(t);
  const asksAboutFit = /(why|how|is|am i|applicable|eligible|qualify)\b/i.test(l) && /(match|matching|score|percent|\%|applicable|eligible|qualify)/i.test(l);
  if(namedSchemeForExplain && asksAboutFit){
    return explainMatchReply(t);
  }
  if(/(why|how).{0,25}(match|matching|score|percent|%)|explain.{0,25}(match|score|this)/i.test(l)){
    return explainMatchReply(t);
  }
  if(/why.*(is|are)?.*matching.*(80|score|\%)|why.*80\%|why.*match.*80|how.*match.*(score|percent)|why.*not.*100|why.*score.*80|what.*does.*(80|score).*mean|how.*matching.*work|scoring.*criteria/i.test(l)){
    return handleScoreExplanationQuestion(t);
  }

  const informationOnly = /\b(?:tell me about|details?|information|what is)\b/i.test(t) && !/\b(?:eligible|qualify|for me|my schemes|my scholarships)\b/i.test(t);
  if (informationOnly) {
    const entry = findRegistrationForScheme(t);
    if (entry) return renderSchemeRegistrationCard(entry);
  }

  // Architectural Flow 1: find my schemes & any query asking about eligible schemes / scholarships
  if(/find.*(my)?.*(scheme|scholarship)|what.*(scheme|scholarship).*(eligible|for me|can i (apply|get))|am i eligible|check.*(my)?.*(scheme|scholarship|eligib)|my.*eligible.*(scheme|scholarship)|eligible.*(scheme|scholarship)|which.*(scheme|scholarship).*(can i|eligible|for me)|tell me.*(my)?.*(scheme|scholarship|eligible)|show.*(my)?.*(scheme|scholarship|eligible)|give.*(my)?.*(scheme|scholarship|eligible)|scholarship.*for me|scheme.*for me|am i eligible/i.test(l)){
    return handleFindMySchemesFlow();
  }
  // Architectural Flow 2: JEE mains Best Books
  if(/jee.*(main)?.*(best)?.*book|book.*jee|jee.*module|jee.*weightage|jee.*pattern|pyq.*jee|jee.*pyq/i.test(l)){
    return handleJeeMainsBestBooksFlow();
  }

  // Dual / Multiple scholarships
  if(/two.*scholarship|multiple.*scholarship|dual.*scholarship|can i apply (for )?(two|multiple|both)|more than one scholarship|second scholarship|concurrent scholarship|take two/i.test(l)){
    return handleMultipleScholarshipsQuery();
  }

  // Income limits / ceilings
  if(/income.*(limit|ceiling|slab|criteria|threshold)|how much income|income.*(2\.5|4\.5|8|lakh)|above.*(2\.5|8).*lakh|income.*range/i.test(l)){
    return handleIncomeCeilingsQuery();
  }

  // Domicile / other states
  if(/other.*state|domicile|outside.*tamil nadu|native.*cert|can.*other.*state.*apply|state.*vs.*central|migrant student/i.test(l)){
    return handleDomicileRulesQuery();
  }

  // Scholarship vs Fellowship vs Grant
  if(/difference.*(between)?.*(scholarship|fellowship|grant)|what.*is.*(fellowship|grant)|fellowship.*vs.*scholarship|types of financial aid/i.test(l)){
    return handleScholarshipVsFellowshipQuery();
  }

  // Attendance and Backlogs / Arrears
  if(/attendance|arrear|backlog|failed.*exam|minimum.*attendance|marks.*criteria.*renewal/i.test(l)){
    return handleAttendanceArrearsQuery();
  }

  // Bank Account & NPCI / Aadhaar DBT
  if(/npci|aadhaar.*seed|bank.*reject|dbt.*issue|bank.*account.*scholarship|pfms/i.test(l)){
    return handleBankDbtQuery();
  }

  // Guided step-by-step application — explicit "walk me through" phrasing
  // starts the document-by-document assistant instead of the one-shot info
  // card, checked before the generic isRegQuery match below.
  if(/guide me|walk me through|step.?by.?step|help me apply/i.test(t)){
    const guidedMatch = findRegistrationForScheme(t);
    if(guidedMatch) return startGuidedApplication(guidedMatch.id);
  }

  // ── SCHEME REGISTRATION & DIRECT APPLICATION INTENTS ──
  const isRegQuery = /regis|apply|portal|enroll|avail|link.*(to|for)?.*(apply|register)|where.*(apply|register)|how.*(apply|register|fill form)/i.test(t);
  if(isRegQuery){
    const matchedScheme = findRegistrationForScheme(t);
    if(matchedScheme){
      return renderSchemeRegistrationCard(matchedScheme);
    }
    return renderRegistrationHub();
  }

  // Check if scheme name is directly referenced with informational intent
  const directMatch = findRegistrationForScheme(t);
  if(directMatch && /how|apply|register|portal|detail|link|website|page|form/i.test(t)){
    return renderSchemeRegistrationCard(directMatch);
  }
  // Self-description → live match
  const selfMatch = l.match(/(i.?m|i am|my name|iam).{0,60}\b(obc|sc|st|general|ews|minority)\b/i)
    || (/\bincome\b/i.test(l) && /\b(obc|sc|st|general|ews)\b/i.test(l));
  if(selfMatch||/tell me.*(my|eligible|scheme.*for me|what.*i.*get)/i.test(t)){
    // parse inline
    const tempU = {...U};
    if(/obc/i.test(t)) tempU.cat='OBC';
    else if(/\bsc\b/i.test(t)) tempU.cat='SC';
    else if(/\bst\b/i.test(t)) tempU.cat='ST';
    else if(/ews/i.test(t)) tempU.cat='EWS';
    else if(/minority|muslim|christian|sikh|buddhist|jain/i.test(t)) tempU.cat='Minority (Muslim)';
    else if(/general/i.test(t)) tempU.cat='General';
    const mInc = t.match(/(\d+\.?\d*)\s*(l|lakh|lac)/i);
    if(mInc){const v=parseFloat(mInc[1]);if(v<1) tempU.inc='under1';else if(v<=2.5) tempU.inc='1to2.5';else if(v<=4.5) tempU.inc='2.5to4.5';else if(v<=8) tempU.inc='4.5to8';else tempU.inc='above8';}
    if(/btech|be\b|engineering/i.test(t)) tempU.edu='ug-tech';
    else if(/\bphd\b/i.test(t)) tempU.edu='phd';
    else if(/pg|postgrad|msc|mtech|ma\b/i.test(t)) tempU.edu='pg';
    else if(/\bba\b|\bbsc\b|undergrad|degree/i.test(t)) tempU.edu='ug-arts';
    else if(/class\s*11|class\s*12|12th|11th/i.test(t)) tempU.edu='11-12';
    if(/female|girl|woman|she\b/i.test(t)) tempU.gender='Female';
    else if(/male|boy|man\b|he\b/i.test(t)) tempU.gender='Male';
    const eligible=getEligibleSchemes(tempU);
    if(eligible.length===0){
      return `Based on what you've told me, I didn't find direct matches. This might be because:<br>
      ${!tempU.cat?'• <strong>Category not clear</strong> — mention OBC/SC/ST/General<br>':''}
      ${!tempU.edu?'• <strong>Education level not clear</strong> — mention class, BTech, etc.<br>':''}
      ${!tempU.inc?'• <strong>Income not mentioned</strong> — add annual family income<br>':''}
      <div class="cqr">
        <div class="cqb" onclick="goPanel('eligibility')">Use Eligibility Checker</div>
        <div class="cqb" onclick="sendQ('What if I am General category student?')">General category</div>
      </div>`;
    }
    const top=eligible.slice(0,3);
    return `I found <strong>${eligible.length} eligible schemes</strong> for you! Top matches:
    ${top.map(s=>`
    <div class="csc">
      <div class="csc-h"><div class="csc-name">${s.name}</div><span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:8px;background:${bgMap[s.col]};color:${scoreColor(s.score)}">${s.score}%</span></div>
      <div class="csc-amt">${s.amt}</div>
      <div class="cebar"><div class="ceb"><div class="cebf" style="width:${s.score}%;background:${scoreColor(s.score)}"></div></div><div class="cepc" style="color:${scoreColor(s.score)}">${s.score}% match</div></div>
      <div style="font-size:11.5px;color:var(--gn);margin-bottom:7px">${s.reasons.slice(0,2).join(' · ')}</div>
      <div class="csc-btns">
        <button class="csc-bp" onclick="sendQ('How to apply for ${s.name}?')">How to Apply</button>
        <button class="csc-bs" onclick="sendQ('${s.name} documents required')">Documents</button>
      </div>
    </div>`).join('')}
    <div class="cqr"><div class="cqb" onclick="goPanel('eligibility')">Full analysis</div></div>`;
  }
  if(/^(hi|hello|hey|namaste|namaskar|hii+)/i.test(t)){
    const n=U.name?`, ${U.name.split(' ')[0]}`:'';
    return `Hey${n}! How can I help today?
    <div class="cqr">
      <div class="cqb" onclick="sendQ('What scholarships can I apply for?')">Find scholarships</div>
      <div class="cqb" onclick="sendQ('NSP scholarship details')">NSP</div>
      <div class="cqb" onclick="sendQ('JEE 2026 preparation tips')">JEE tips</div>
      <div class="cqb" onclick="sendQ('How to get income certificate?')">Income cert</div>
    </div>`;
  }
  if(/thank/i.test(t)) return `You're most welcome! Best of luck with your applications! Remember — NSP deadline is <strong>October 31</strong>!`;

  // ── SPECIFIC INTENTS (Must precede generic scheme keywords) ──
  // Checked BEFORE scheme-name matches below — otherwise a query that names
  // a scheme just for context (e.g. "income certificate for NSP how to get")
  // matched the scheme's own block first and returned an unrelated generic
  // scheme card instead of answering the actual document question asked.

  if(/renewal|renew/i.test(t)){
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Scholarship Renewal Guide (NSP & State Portals)</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">For students continuing in the 2nd, 3rd, or 4th year of their degree</div>
    <div class="csc">
      <div class="csc-h"><div class="csc-name">Steps to Apply for Renewal</div></div>
      <div class="csc-steps">
        <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st">Visit <strong>scholarships.gov.in</strong> → Click <strong>"Apply for Renewal"</strong> (Do NOT click New Registration!).</div></div>
        <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st">Log in using your previous year <strong>Application ID and Password</strong>.</div></div>
        <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st">Update details: current semester/year, attendance percentage, and college fees paid.</div></div>
        <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st">Upload previous year passing marksheet and updated income certificate (if required).</div></div>
        <div class="csc-step"><div class="csc-sn">5</div><div class="csc-st">Submit online and provide the printed copy to your college nodal officer for verification.</div></div>
      </div>
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:2px;padding:8px 12px;font-size:12px;color:var(--gn);margin-top:8px">
        <strong>Tip:</strong> Renewal applications are verified faster and require fewer fresh document uploads than new registrations.
      </div>
      <div class="cqr" style="margin-top:10px">
        <div class="cqb" onclick="sendQ('Income certificate for NSP how to get')">Income Cert Help</div>
        <div class="cqb" onclick="sendQ('NSP Post-Matric Scholarship details')">NSP Scheme Details</div>
      </div>
    </div>`;
  }

  if(/caste.*cert|obc.*cert|sc.*cert|st.*cert|category.*cert/i.test(t)){
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">How to Get Caste / Category Certificate</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">Issued by Tehsildar / SDM office · Required for all reserved-category scholarships</div>
    <div class="csc"><div class="csc-steps">
      <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st"><strong>Online:</strong> eDistrict.nic.in → select your state → Apply for Caste/Community Certificate</div></div>
      <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st"><strong>Offline:</strong> Tehsildar office / CSC center → Submit Community Certificate form + nominal ₹10–50 fee</div></div>
      <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st"><strong>Documents:</strong> Aadhaar card, Ration card, Father/Mother's community proof/TC, Self affidavit</div></div>
      <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st"><strong>Validity:</strong> Usually permanent (or valid 1-3 years for OBC-NCL). Available on DigiLocker once issued.</div></div>
    </div></div>`;
  }

  if(/doc(ument)?s?|certificate|proof|upload/i.test(t) && !/ai|explain|why/i.test(t)){
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Documents Required for Scholarships</strong>
    <div style="font-size:11.5px;color:var(--t3);margin:3px 0 10px">Keep scanned copies in PDF/JPEG format (&lt; 200 KB each)</div>
    <div class="csc"><div class="csc-steps">
      <div class="csc-step"><div class="csc-sn">1</div><div class="csc-st"><strong>Aadhaar Card:</strong> Must be linked with your mobile number and active bank account (DBT/NPCI seeded).</div></div>
      <div class="csc-step"><div class="csc-sn">2</div><div class="csc-st"><strong>Income Certificate:</strong> Competent authority issued in parent's name for current financial year.</div></div>
      <div class="csc-step"><div class="csc-sn">3</div><div class="csc-st"><strong>Caste / Community Certificate:</strong> Required for OBC, SC, ST, EWS, or Minority applicants.</div></div>
      <div class="csc-step"><div class="csc-sn">4</div><div class="csc-st"><strong>Academic Marksheets:</strong> Class 10, Class 12, or latest semester passing grade card.</div></div>
      <div class="csc-step"><div class="csc-sn">5</div><div class="csc-st"><strong>Bonafide Certificate & Fee Receipt:</strong> From current college / school proving active enrollment.</div></div>
      <div class="csc-step"><div class="csc-sn">6</div><div class="csc-st"><strong>Bank Passbook:</strong> Showing Account number, IFSC code, and student's name clearly.</div></div>
    </div>
    <div class="cqr" style="margin-top:10px">
      <div class="cqb" onclick="sendQ('Income certificate for NSP how to get')">Get Income Cert</div>
      <div class="cqb" onclick="sendQ('How to get caste certificate')">Get Caste Cert</div>
      <div class="cqb" onclick="sendQ('NSP Post-Matric Scholarship details')">NSP Details</div>
    </div></div>`;
  }

  // ── SCHEME REGISTRATION & DETAILS FALLBACK ──
  const schemeHit = findRegistrationForScheme(t);
  if(schemeHit){
    return renderSchemeRegistrationCard(schemeHit);
  }
  if(/girl|women|female|mahila|lady student/i.test(t)){
    return `<strong>Schemes Exclusively for Girl Students</strong>
    <div class="csc"><div class="csc-h"><div class="csc-name">AICTE Pragati</div><span class="badge b-gd">₹50,000/yr</span></div><div style="font-size:12px;color:var(--t2)">BTech/BE girls · Income &lt;₹8L · Any category · AICTE colleges</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">Begum Hazrat Mahal</div><span class="badge b-gn">₹5K–₹6K/yr</span></div><div style="font-size:12px;color:var(--t2)">Minority girls only · Class 9–12 · 50%+ marks · Income ≤ ₹2L</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">NSP Post-Matric (Girls)</div><span class="badge b-sf">₹25,000/yr</span></div><div style="font-size:12px;color:var(--t2)">OBC/SC/ST/EWS/Minority girls · Class 11–PhD · Higher rates for girls</div></div>
    <div class="cqr"><div class="cqb" onclick="goPanel('eligibility')">Check my eligibility</div><div class="cqb" onclick="sendQ('AICTE Pragati application steps')">AICTE steps</div></div>`;
  }
  if(/fellowship|research|phd|ugc.*net|jrf|pmrf|csir/i.test(t)){
    return `<strong>Research Fellowships</strong>
    <div class="csc"><div class="csc-h"><div class="csc-name">PM Research Fellowship</div><span class="badge b-bl">₹70K–₹80K/mo</span></div><div style="font-size:12px;color:var(--t2)">PhD at IIT/NIT/IISc · CGPA ≥8.0 · Any category · pmrf.in</div></div>
    <div class="csc"><div class="csc-h"><div class="csc-name">CSIR-UGC NET JRF</div><span class="badge b-bl">₹31K–₹37K/mo</span></div><div style="font-size:12px;color:var(--t2)">Qualify NET/JRF exam · PG level · 5-year tenure · Any category · confirm current rate at csirnet.nta.nic.in</div></div>`;
  }
  if(/deadline|last.?date|when.*apply|expir/i.test(t)){
    const now=new Date();
    const rows=DL.map(d=>{
      if(!d.date) return `&bull; <strong>${d.name}</strong> &rarr; <span style="color:var(--t2);font-weight:600">No deadlines (${d.note || 'Open / Rolling'})</span>`;
      const days=Math.ceil((new Date(d.date+'T00:00:00')-now)/86400000);
      const label=days<0?'deadline passed':days===0?'TODAY!':`${days} days left`;
      const approx=d.confidence==='medium'?' (approx., verify on portal)':'';
      return `&bull; <strong>${d.name}</strong> &rarr; <span style="color:var(--${days<=10&&days>=0?'rd':'gn'});font-weight:700">${new Date(d.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} &middot; ${label}</span>${approx}`;
    }).join('<br>');
    return `<strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Current Scholarship Deadlines</strong><div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">Official deadlines for Central &amp; Tamil Nadu schemes:</div><div class="csc" style="font-size:12.5px;line-height:1.7">${rows}</div>
    <div class="cqr" style="margin-top:10px"><div class="cqb" onclick="goPanel('deadlines')">Full calendar</div><div class="cqb" onclick="sendQ('How to apply for NSP scholarship?')">Apply NSP</div></div>`;
  }
  if(/jee|neet|gate|cuet|cat\b|net\b.*exam|exam.*tip|preparation|study.*tip/i.test(t)){
    if(/jee/i.test(t)) return `<strong>JEE Main 2026 — Preparation Tips</strong><br><br><strong>Dates:</strong> Session 1: Jan 22–30, 2026 | Session 2: April 2026<br><strong>Register at:</strong> jeemain.nta.nic.in<br><br><strong>Key Topics to Focus:</strong><br>• <strong>Physics:</strong> Electrostatics, Modern Physics, Mechanics<br>• <strong>Maths:</strong> Calculus, Coordinate Geometry, Algebra<br>• <strong>Chemistry:</strong> Organic Chemistry (named reactions), Equilibrium<br><br><strong>Strategy:</strong><br>• NCERT first — 80% questions are NCERT-based<br>• Previous years' papers (atleast 10 years)<br>• Mock tests every Sunday
    <div class="cqr"><div class="cqb" onclick="sendQ('Best books for JEE Main preparation')">Best books</div><div class="cqb" onclick="sendQ('JEE Main syllabus important topics')">Syllabus</div></div>`;
    if(/neet/i.test(t)) return `<strong>NEET UG 2026 Tips</strong><br><strong>Focus:</strong> Biology 360 marks (most important) → Physics 180 → Chemistry 180`;
    return `<strong>Exam Preparation</strong><br><br>For JEE/NEET/GATE/NET tips, please check the <strong>Exam Calendar</strong> tab or ask specifically, e.g., "JEE Main tips" or "UGC NET preparation".
    <div class="cqr"><div class="cqb" onclick="goPanel('exams')">Exam Calendar</div></div>`;
  }
  if(/general.*category|general.*student|no.*scholarship.*general|open.*category|open.*quota/i.test(t)){
    return `
    <strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px">Government Schemes for General / Open Category Students</strong>
    <div style="font-size:12.5px;color:var(--t2);margin:4px 0 10px;line-height:1.6">
      General category students are fully eligible for high-value merit-based scholarships, girl-child technical quotas, research fellowships, and state fee concessions:
    </div>
    <div class="csc">
      <div class="csc-steps">
        <div class="csc-step">
          <div class="csc-sn">1</div>
          <div class="csc-st">
            <strong>Central Sector Scheme of Scholarship (PM-USP):</strong><br>
            ₹12,000–₹20,000/year for students in the top 20th percentile of their Class 12 state board, with annual family income &le; ₹4.5 Lakhs (All categories eligible).
          </div>
        </div>
        <div class="csc-step">
          <div class="csc-sn">2</div>
          <div class="csc-st">
            <strong>DST INSPIRE Scholarship:</strong><br>
            ₹80,000/year for students pursuing B.Sc / M.Sc basic or natural sciences who scored in the top 1% of their Class 12 board (Zero income limit, pure merit).
          </div>
        </div>
        <div class="csc-step">
          <div class="csc-sn">3</div>
          <div class="csc-st">
            <strong>AICTE Pragati Scholarship (Girls in Engineering/Diploma):</strong><br>
            ₹50,000/year for girl students in AICTE technical institutions with family income &le; ₹8 Lakhs (Open to General category girls).
          </div>
        </div>
        <div class="csc-step">
          <div class="csc-sn">4</div>
          <div class="csc-st">
            <strong>Tamil Nadu First Graduate Scholarship:</strong><br>
            100% Tuition Fee Waiver for Tamil Nadu engineering/medical admissions if you are the first graduate in your family (No category restriction, no income ceiling).
          </div>
        </div>
        <div class="csc-step">
          <div class="csc-sn">5</div>
          <div class="csc-st">
            <strong>PMRF / UGC-CSIR NET JRF Research Fellowships:</strong><br>
            ₹31,000–₹80,000/month for postgraduate and doctoral research awarded strictly on academic merit and entrance examination ranking.
          </div>
        </div>
      </div>
    </div>
    <div class="cqr" style="margin-top:10px">
      <div class="cqb" onclick="sendQ('find my schemes')">Find My Schemes</div>
      <div class="cqb" onclick="sendQ('INSPIRE scholarship details')">INSPIRE Details</div>
      <div class="cqb" onclick="goPanel('eligibility')">Eligibility Checker</div>
      <div class="cqb" onclick="goPanel('schemes')">Browse All Schemes</div>
    </div>`;
  }
  return handleGenericAdvisorResponse(t);
}

// ══ INIT ══
window.addEventListener('DOMContentLoaded',()=>{
  renderSchemes(); renderDeadlines();
  updateDashboard();
});
window.goPanel=goPanel; window.sendQ=sendQ; window.goApp=goApp; window.goLand=goLand;
window.filterSch=filterSch; window.renderCompare=renderCompare;


// ══════════════════════════════════════════════
