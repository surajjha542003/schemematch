/* ════════════════════════════════════════════════
   Scheme Finder — Schemes · Deadlines · Calculator · Compare
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// Routes come from the record ID, never from fuzzy name aliases or a default NSP URL.
function getSchemeRegistrationUrl(s){ return SourcePolicy.registrationUrl(s); }
window.getSchemeRegistrationUrl = getSchemeRegistrationUrl;
function schemeApplicationActions(s, className='scheme-primary') {
  const actions=SourcePolicy.applicationActions(s);
  return `${actions.note?`<p class="application-note">${escapeSchemeText(actions.note)}</p>`:''}${actions.links.map((link,i)=>`<a class="${className}${i?' application-extra':''}" data-application-link href="${escapeSchemeText(link.url)}" target="_blank" rel="noopener noreferrer">${escapeSchemeText(link.label)} ↗</a>`).join('')}${actions.search?`<a class="scheme-secondary application-search" data-application-search href="${escapeSchemeText(actions.search.url)}" target="_blank" rel="noopener noreferrer">${escapeSchemeText(actions.search.label)} ↗</a>`:''}`;
}
let currentSchFilter='all';
function escapeSchemeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function officialSchemeUrl(value) {
  return typeof SourcePolicy !== 'undefined' ? SourcePolicy.officialUrl(value) || '#' : '#';
}
function schemeWindowText(s, today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})){
  const ended=s.status==='closed' || (s.deadlineVerified && s.deadline && s.deadline<today);
  if(ended)return `Published window ended${s.deadlineVerified && s.deadline ? ' '+s.deadline : ''}; extension unconfirmed`;
  const route=s.applicationRoute==='renewal' ? 'Renewal only; fresh window unconfirmed' : 'Published student window';
  return s.deadlineVerified && s.deadline ? `${route}: ${s.deadline} (${s.academicYear || 'see notice'})` : 'Current application window unconfirmed';
}
function renderSchemes(filter='all'){
  currentSchFilter=filter;
  const grid=document.getElementById('schGrid'); if(!grid) return;
  const state=document.getElementById('sch-state-filter')?.value || 'all';
  const sector=document.getElementById('sch-sector-filter')?.value || 'students';
  const q=(document.getElementById('schSearchInput')?.value || '').trim().toLowerCase();
  const includeOutside=document.getElementById('sch-include-outside')?.checked;
  const selectedState=U.eligibilityDetails?.domicileState || U.state;
  let data=SCHEMES.filter(s=> {
    const ownState=s.state || null;
    if(state==='relevant' && !includeOutside && typeof SchemeCatalog !== 'undefined' && !SchemeCatalog.audienceRelevant(s,U)) return false;
    if(state==='relevant' && selectedState && ownState && ownState!==selectedState) return false;
    if(state==='central' && ownState) return false;
    if(!['all','central','relevant'].includes(state) && ownState!==state) return false;
    const student=(s.sector || 'students')==='students';
    if(sector==='students' && !student || sector==='other' && student) return false;
    const tags=(s.tags || []).join(' ').toLowerCase();
    if(['scholarship','grant','fellowship'].includes(filter) && s.type!==filter) return false;
    const tagFilters={girls:/girl/,minority:/minority/,technical:/technical/,research:/research|fellowship/,northeast:/north.east/,disabled:/disab/};
    if(tagFilters[filter] && !tagFilters[filter].test(tags+' '+s.name.toLowerCase())) return false;
    return !q || [s.name,s.by,s.state,...(s.tags || [])].filter(Boolean).some(t=>t.toLowerCase().includes(q));
  });
  if(typeof SchemeCatalog !== 'undefined') data=profileSet && !includeOutside?ProgrammeRules.rank(data,U,{excludeFailed:true}).map(row=>row.s):SchemeCatalog.balanced(data);
  document.getElementById('sch-count').textContent=data.length;
  const note=document.getElementById('state-catalog-note');
  if(note) note.textContent=(state==='relevant' && !selectedState ? 'Select your state in your profile for state-specific results. ' : '')+(profileSet && !includeOutside?'Showing matches for your saved profile, highest match first. ':'')+'15 states and central programmes · requirements and evidence are available in each card.';
  if(!data.length){grid.innerHTML='<div class="no-schm">No listings in this filter. Try another sector or state.</div>';return;}
  grid.innerHTML=data.map(s=>{
    const source=officialSchemeUrl(s.source);
    const windowText=schemeWindowText(s);
    const references=[['Programme guideline',s.guidelineUrl],['Programme FAQ',s.faqUrl]].filter(([,url])=>officialSchemeUrl(url)!=='#').map(([label,url])=>`<a href="${escapeSchemeText(officialSchemeUrl(url))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join(' · ');
    return `<div class="fsc"><div class="fsc-top"><div class="fsc-ico" style="color:var(--${s.col})">${getSchemeIcon(s)}</div><div class="badge ${colMap[s.col] || ''}">${escapeSchemeText(s.type.toUpperCase())}</div></div>
      <div class="fsc-name">${escapeSchemeText(s.name)}</div><div class="fsc-by">${escapeSchemeText(s.by)}</div>
      <div class="fsc-amt">${escapeSchemeText(ProgrammeRules.rate(s,U).label)}</div><div class="fsc-tags">${(s.tags || []).map(t=>`<div class="fsc-tag">${escapeSchemeText(t)}</div>`).join('')}</div>
      <div class="fsc-status">${escapeSchemeText(ProgrammeRules.matchText(s,U))} · ${escapeSchemeText(programmeStatusText(s,U))}</div><div class="fsc-window">${escapeSchemeText(windowText)}</div>
      <div class="fsc-actions">${schemeApplicationActions(s)}<button class="scheme-secondary" data-guide-id="${escapeSchemeText(s.id)}">Guide me</button><button class="scheme-secondary" data-track-id="${escapeSchemeText(s.id)}">+ Track</button></div>
      <details class="fsc-details"><summary>Requirements &amp; official sources</summary><p>${escapeSchemeText(s.verificationScope)}</p><p>${escapeSchemeText(s.ruleSourceVersion || '')}</p><p>Reference checked ${escapeSchemeText(s.sourceChecked || 'date unavailable')}</p><p>${escapeSchemeText(s.accessNote || 'Portal submission not tested')}</p>${source!=='#'?`<a href="${escapeSchemeText(source)}" target="_blank" rel="noopener noreferrer">Official source ↗</a>`:''}${references?`<div>${references}</div>`:''}<p>Published rates describe programme benefits; selection and payment follow official verification.</p></details>
    </div>`;
  }).join('');
  grid.onclick=event=>{
    const guide=event.target.closest('[data-guide-id]');if(guide){const s=SCHEMES.find(s=>s.id===guide.dataset.guideId);if(s){goPanel('chat');addAI(startGuidedApplication(s.id));}return;}
    const button=event.target.closest('[data-track-id]');if(!button)return;const s=SCHEMES.find(s=>s.id===button.dataset.trackId);if(s && typeof addToTracker==='function'){addToTracker(s.id,s.name,s.by,s.amt,officialSchemeUrl(getSchemeRegistrationUrl(s)),s.deadlineVerified?s.deadline:null);button.textContent='Tracked ✓';}
  };
}
function filterSch(el,f){
  document.querySelectorAll('.fp').forEach(p=>p.classList.remove('active'));
  el.classList.add('active'); renderSchemes(f);
}
function programmeStatusText(s,profile=U){
  const r=ReviewedConditions.evaluate(s,profile);
  if(r?.eligible)return 'Published conditions met';
  if(r?.status==='fails-reviewed-condition')return 'Condition not met';
  if(r?.questions.length)return 'Answer a few details';
  if(r?.status==='meets-reviewed-conditions')return 'Listed checks met';
  return 'View requirements';
}
function renderDeadlines(){
  const el=document.getElementById('dlList');if(!el)return;
  const today=ExamCalendar.today(),data=ProgrammeRules.rank(SchemeCatalog.forProfile(U),U,{excludeFailed:true}).map(row=>row.s);
  const upcoming=data.filter(s=>s.deadlineVerified && s.deadline>=today && s.status!=='closed').sort((a,b)=>a.deadline.localeCompare(b.deadline)||a.name.localeCompare(b.name));
  const other=data.filter(s=>!upcoming.includes(s));
  const exam=ExamCalendar.registrationDeadlines({state:U.eligibilityDetails?.domicileState || U.state,date:today})[0];
  const scholarship=upcoming[0];
  const nearest=exam && (!scholarship || exam.registrationDeadline<=scholarship.deadline)?{name:exam.name,date:exam.registrationDeadline,note:exam.registrationNote,url:ExamCalendar.officialUrl(exam.source),exam:true}:scholarship?{name:scholarship.name,date:scholarship.deadline,note:scholarship.applicationRoute==='renewal'?'Renewal applications':'Scholarship applications',url:officialSchemeUrl(scholarship.deadlineSource || scholarship.source)}:null;
  const alert=document.getElementById('deadlineAlert');
  if(alert){
    alert.classList.toggle('hidden',!nearest);
    if(nearest){const days=Math.round((Date.parse(nearest.date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);alert.classList.toggle('urgent',days<=7);alert.innerHTML=`<span class="deadline-clock" aria-hidden="true">◷</span><div><strong>${escapeSchemeText(nearest.name)} · ${days===0?'Closes today':days+' days left'}</strong><div class="deadline-alert-note">${escapeSchemeText(nearest.date)}${nearest.note?' · '+escapeSchemeText(nearest.note):''}</div></div><a class="scheme-secondary" href="${escapeSchemeText(nearest.url)}" target="_blank" rel="noopener noreferrer">View notice ↗</a>`;}
  }
  const card=s=>{
    const d=s.deadlineVerified && s.deadline?new Date(s.deadline+'T00:00:00Z'):null;
    const days=d?Math.round((d-Date.parse(today+'T00:00:00Z'))/86400000):null;
    const color=days!==null && days>=0 && days<=7?'rd':days!==null && days>=0?'gn':'t3';
    const pill=days===null?'See notice':days<0?'Closed':days===0?'Today':days+' days left';
    return `<article class="dlfc"><div class="dlfc-date"><div class="dlfc-day" style="color:var(--${color})">${d?d.getUTCDate():'—'}</div><div class="dlfc-mon">${d?d.toLocaleDateString('en-IN',{month:'short',timeZone:'UTC'}):'TBA'}</div></div><div class="dlfc-main"><div class="dlfc-name">${escapeSchemeText(s.name)}</div><div class="dlfc-by">${escapeSchemeText(s.state || 'Central / All India')} · ${escapeSchemeText(s.applicationRoute==='renewal'?'Renewal only':s.academicYear || 'See current notice')}</div><div class="dlfc-amt">${escapeSchemeText(ProgrammeRules.rate(s,U).label)}</div><details class="fsc-details"><summary>Window details</summary><p>${escapeSchemeText(schemeWindowText(s))}</p></details></div><span class="dlfc-pill" style="color:var(--${color})">${pill}</span><a class="scheme-primary" href="${escapeSchemeText(officialSchemeUrl(s.deadlineSource || s.source))}" target="_blank" rel="noopener noreferrer">View notice ↗</a></article>`;
  };
  el.innerHTML=(upcoming.map(card).join('') || '<p class="no-schm">No published upcoming closing date in your selected profile. Check the notices below.</p>')+`<details class="deadline-secondary"><summary>Closed windows &amp; dates to be announced (${other.length})</summary>${other.map(card).join('')}</details>`;
}
function renderEducationNews(){
  const grid=document.getElementById('newsGrid');if(!grid)return;
  const select=document.getElementById('news-state-filter');
  if(!select.dataset.ready){[...new Set(SCHEMES.map(s=>s.state).filter(Boolean))].sort().forEach(state=>select.add(new Option(state,state)));select.dataset.ready='true';}
  const q=(document.getElementById('newsSearch').value || '').trim().toLowerCase(),state=select.value;
  const announcements=OFFICIAL_ANNOUNCEMENTS.concat(SCHEMES.filter(s=>s.deadlineVerified).map(s=>({id:s.id,title:s.name+' — application window',body:schemeWindowText(s),state:s.state,source:s.deadlineSource || s.source,checkedOn:s.deadlineChecked || s.sourceChecked,publishedOn:null,deadline:s.deadline})));
  const news=announcements.filter(n=>(state==='all' || (state==='central'?!n.state:n.state===state)) && (!q || (n.title+' '+n.body+' '+(n.state || 'Central')).toLowerCase().includes(q)));
  grid.innerHTML=news.map(n=>`<article class="news-card"><div class="news-ico">${getSchemeIcon({ico:'book'})}</div><div class="news-main"><div class="news-tag" style="color:var(--gn)">${escapeSchemeText(n.state || 'Central / All India')} · Official announcement</div><h4 class="news-title">${escapeSchemeText(n.title)}</h4><p class="news-sub">${escapeSchemeText(n.body)}</p><div class="news-meta">${n.publishedOn?'Published '+escapeSchemeText(n.publishedOn):'Publication date not stated'} · Source checked ${escapeSchemeText(n.checkedOn)}</div><a class="scheme-primary" href="${escapeSchemeText(officialSchemeUrl(n.source))}" target="_blank" rel="noopener noreferrer">Read announcement ↗</a></div></article>`).join('') || '<p class="no-schm">No verified announcement in this filter. Try another state or search.</p>';
}
const OFFICIAL_ANNOUNCEMENTS=[
  {id:'nsp-cycle',title:'NSP opens the 2026–27 academic-year portal',body:'The official portal announces availability from 1 June 2026. Choose the named programme for its own closing date.',source:'https://scholarships.gov.in/home',publishedOn:null,checkedOn:'2026-10-09'},
  {id:'nsp-udid',title:'UDID consent before disability-scholarship submission',body:'NSP asks disabled applicants to provide consent through the UDID portal before submitting their application.',source:'https://scholarships.gov.in/iver/student-announcements',publishedOn:null,checkedOn:'2026-10-09'},
  {id:'nsp-otr',title:'One Time Registration for NSP applications',body:'NSP requires OTR for applications from 2024–25 onwards. Complete registration using the permitted Aadhaar / enrolment route.',source:'https://scholarships.gov.in/home',publishedOn:null,checkedOn:'2026-10-09'},
  {id:'tg-registration',title:'Telangana ePASS 2026–27 registration steps',body:'Fresh SC applicants must match Aadhaar and SSC names and complete MeeSeva biometric authentication before completing the application. ST applicants have a separate OTR route.',state:'Telangana',source:'https://telanganaepass.cgg.gov.in/epassonlinelinks.jsp',publishedOn:null,checkedOn:'2026-10-09'},
  {id:'tg-corporate',title:'Corporate Admissions registration is closed',body:'The official Telangana page reports phase-four allotments and closed student registration. Use the portal for the current allotment notice.',state:'Telangana',source:'https://telanganaepass.cgg.gov.in/CorporateApplicationForm.do',publishedOn:null,checkedOn:'2026-10-09'}
];
function calcBenefit(){
  const s=SCHEMES.find(s=>s.id===document.getElementById('cc-scheme').value);
  const education=document.getElementById('cc-edu').value,edu=education==='ug'?'ug-arts':education;
  const profile={edu,eligibilityDetails:{courseYear:document.getElementById('cc-year').value,csssCourse:edu==='ug-tech'?'technical':edu==='ug-medical'?'professional-5':edu==='pg'?'pg':'general'}};
  const rate=ProgrammeRules.rate(s,profile),validCourse=s.reviewedConditions.education.includes(edu),year=Number(profile.eligibilityDetails.courseYear),duration=Number(document.getElementById('cc-dur').value);
  const valid=validCourse && year<=duration && (s.id.endsWith('diploma')?year<=3:!s.id.startsWith('aicte-') || year<=4);
  document.getElementById('calc-annual').textContent=valid && rate.amount?'₹'+rate.amount.toLocaleString('en-IN'):'Choose a supported course/year';
  document.getElementById('calc-total').textContent=valid && rate.amount?'Published rate if selected · renewals have separate conditions':'This course/year does not establish an annual rate for the selected programme.';
  document.getElementById('calc-breakdown').innerHTML=`<p class="chat-programme-note">${escapeSchemeText(s.name)}. Category, gender and income alone do not establish eligibility. Future years depend on renewal and programme duration.</p><a class="scheme-primary" href="${escapeSchemeText(officialSchemeUrl(s.benefit.source))}" target="_blank" rel="noopener noreferrer">Rate source ↗</a><button class="cqb" id="calc-check">Check my eligibility →</button>`;
  document.getElementById('calc-check').onclick=()=>{goPanel('chat');addAI(renderCatalogueConditionExplanation(s.id));};
  document.getElementById('calc-result').classList.remove('hidden');
}
function calcLoan(){
  const fee=Number(document.getElementById('lc-fee').value);
  const scholarship=Number(document.getElementById('lc-sch').value);
  const cards=document.getElementById('loan-cards');
  if(!Number.isFinite(fee) || fee<0 || !Number.isFinite(scholarship) || scholarship<0){cards.textContent='Enter valid non-negative amounts.';}
  else { cards.textContent=`Using your entered figures, remaining annual fees are ₹${Math.max(0,fee-scholarship).toLocaleString('en-IN')}. This does not confirm a scholarship or estimate loan interest. Use only your confirmed award amount.`; }
  document.getElementById('loan-result').classList.remove('hidden');
}

// ══ COLLEGE COMPARE ══
const COLLEGES={
  iit:{headers:['Parameter','IIT Bombay','IIT Delhi'],rows:[
    ['NIRF Rank (2024)','3','2'],['BTech Avg Fees','₹2.2L/yr','₹2.0L/yr'],['Avg Package','₹21 LPA','₹20 LPA'],['Highest Package','₹3.67 Cr','₹2.5 Cr'],['Scholarships Avail.','SC/ST Free, PMRF','SC/ST Free, PMRF'],['Seats (BTech)','900+','850+'],['NIRF Innovation Rank','1','2'],
  ]},
  nit:{headers:['Parameter','NIT Trichy','NIT Warangal'],rows:[
    ['NIRF Rank (2024)','11','18'],['BTech Avg Fees','₹1.4L/yr','₹1.2L/yr'],['Avg Package','₹12 LPA','₹11 LPA'],['Highest Package','₹1.2 Cr','₹1.0 Cr'],['Scholarships Avail.','NSP, Central Sector','NSP, Central Sector'],['JEE Cutoff (General)','~1200','~2500'],
  ]},
  central:{headers:['Parameter','JNU Delhi','BHU Varanasi'],rows:[
    ['NIRF Rank (2024)','2 (Univ.)','5 (Univ.)'],['Avg Fees','₹400/sem','₹3,000/sem'],['Scholarship Avail.','NSP, JRF, PMRF','NSP, JRF, PMRF'],['Research Outlets','High','Very High'],['CUET Required','Yes','Yes'],['Hostel Facility','Yes','Yes'],
  ]},
  medical:{headers:['Parameter','AIIMS Delhi','JIPMER Pondicherry'],rows:[
    ['NIRF Rank (2024)','1 (Medical)','3 (Medical)'],['MBBS Fees','₹1,390/yr','₹5,000/yr'],['NEET Cutoff 2024','~50 rank','~200 rank'],['Stipend (Intern)','₹23,500/mo','₹18,000/mo'],['Scholarship Avail.','NSP, State Schemes','NSP, State Schemes'],
  ]},
  iim:{headers:['Parameter','IIM Ahmedabad','IIM Bangalore'],rows:[
    ['NIRF Rank (2024)','1 (Mgmt)','2 (Mgmt)'],['MBA Fees','₹34L total','₹32L total'],['Avg Package','₹33 LPA','₹32 LPA'],['Scholarship Avail.','Need-based grants','Need-based grants'],['CAT Cutoff','99.5%ile+','99%ile+'],
  ]},
};
function renderCompare(){
  if(typeof SchemeCatalog !== 'undefined') { document.getElementById('comp-table').innerHTML='College ranks, placements and fees have not been reviewed in this source catalogue. <a href="https://www.nirfindia.org/" target="_blank" rel="noopener noreferrer">Consult official NIRF information</a> and the institution’s current prospectus.'; return; }

  const type=document.getElementById('comp-type')?.value||'iit';
  const data=COLLEGES[type];
  if(!data){document.getElementById('comp-table').innerHTML='';return;}
  let html=`<div class="ctable-h">${data.headers.map(h=>`<div class="cth">${h}</div>`).join('')}</div>`;
  html+=data.rows.map(r=>`<div class="ctr">${r.map((c,i)=>`<div class="ctd ${i===0?'attr':'val'}">${c}</div>`).join('')}</div>`).join('');
  document.getElementById('comp-table').innerHTML=html;
}

