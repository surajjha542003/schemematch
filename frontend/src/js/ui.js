/* ════════════════════════════════════════════════
   Scheme Finder — UI Updates & Dashboard Rendering
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

const INC_DISPLAY = {
  'under1': 'Below ₹1L',
  '1to2.5': '₹1L – ₹2.5L',
  '2.5to4.5': '₹2.5L – ₹4.5L',
  '4.5to8': '₹4.5L – ₹8L',
  'above8': 'Above ₹8L'
};

const EDU_DISPLAY = {
  '9-10': 'Class 9–10',
  '11-12': 'Class 11–12',
  'diploma': 'Diploma / ITI',
  'ug-arts': 'UG (BA / BSc / BCom / BCA)',
  'ug-tech': 'UG (BTech / BE)',
  'ug-medical': 'UG (MBBS / BDS)',
  'pg': 'Postgraduate',
  'phd': 'PhD / Research'
};

function formatInc(v){ return INC_DISPLAY[v] || v || '—'; }
function formatEdu(v){ return EDU_DISPLAY[v] || v || '—'; }

// ══ UPDATE UI ══
function updateUI(){
  const name=U.name || 'Student',init=name.charAt(0).toUpperCase();
  document.getElementById('sbAv').textContent=init;
  document.getElementById('sbName').textContent=name;
  document.getElementById('sbCls').textContent=[formatEdu(U.edu),U.state].filter(Boolean).join(' · ')||'Student';
  document.getElementById('wbName').textContent=`Hello, ${name.split(' ')[0]}!`;
  document.getElementById('profAv').textContent=init;
  document.getElementById('profName').textContent=name;
  document.getElementById('profSub').textContent=U.edu?`${formatEdu(U.edu)} Student`:'Student';
    document.getElementById('profTags').innerHTML=[U.cat,U.state,formatEdu(U.edu)].filter(Boolean).map((t,i)=>{
      const cs=['b-sf','b-bl','b-gn'];
      return `<div class="prof-tag ${cs[i]||'b-sf'}">${escapeSchemeText(t)}</div>`;
    }).join('');
  ['name','age','gender','state'].forEach(k=>{const el=document.getElementById('pi-'+k);if(el)el.textContent=U[k]||'—';});
  document.getElementById('pi-cat').textContent=U.cat||'—';
  document.getElementById('pi-edu').textContent=formatEdu(U.edu);
  document.getElementById('pi-marks').textContent=U.marks?(U.marks+'%'):'—';
  document.getElementById('pi-inc').textContent=formatInc(U.inc);
  // hide profile warning
  document.getElementById('no-prof-warn').style.display=profileSet?'none':'';
  if(profileSet){
    document.getElementById('no-prof-warn').style.display='none';
    document.getElementById('chk2-ico').innerHTML='<svg class="v-ico" style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    document.getElementById('chk2-ico').style.cssText='background:var(--gnl);color:var(--gn);display:flex;align-items:center;justify-content:center;';
    document.getElementById('chk2-stat').textContent='Done';
    document.getElementById('chk2-stat').style.cssText='background:var(--gnl);color:var(--gn)';
  }else{
    document.getElementById('chk2-ico').textContent='2';
    document.getElementById('chk2-ico').style.cssText='';
    document.getElementById('chk2-stat').textContent='Pending';
    document.getElementById('chk2-stat').style.cssText='';
  }
}

function refreshProfileViews({results=false}={}){
  profileSet=Boolean(U.cat && U.edu && U.inc);
  LAST_MATCH=null;
  CHECKLIST.elig=false;saveChecklist();
  updateUI();updateDashboard();
  renderSchemes(currentSchFilter);renderDeadlines();
  if(results && profileSet)renderEligibilityMatches(U);
  const currentMatches=[...document.querySelectorAll('[data-profile-matches]')].at(-1);
  if(currentMatches){if(profileSet)currentMatches.outerHTML=renderCatalogueMatches(U);else currentMatches.textContent='Complete your category, education and income to refresh your matches.';}
  if(typeof GUIDED_APP!=='undefined' && GUIDED_APP?.sch)GUIDED_APP=null;
}

function updateAccountUI(){
  const guestView = document.getElementById('acctGuestView');
  const loggedInView = document.getElementById('acctLoggedInView');
  if(!guestView || !loggedInView) return; // profile panel not rendered yet
  if(AUTH_USER){
    guestView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    document.getElementById('acct-email-display').textContent = AUTH_USER.email || '—';
  } else {
    guestView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
  }
  if(typeof updateEmailProposalUI==='function')updateEmailProposalUI();
}

// Paints steps 3-5 of the Application Checklist from CHECKLIST (state.js).
// Step 3 is set automatically by runElig() (eligibility.js); steps 4-5 are
// self-reported clicks since the app has no way to observe them happening.
function updateChecklistUI(){
  const doneCss='background:var(--gnl);color:var(--gn)';
  const pendingCss='background:rgba(255,255,255,0.05);color:var(--t3)';
  const doneIco=n=>`<svg class="v-ico" style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const steps=[
    {n:3, key:'elig', label:'Run eligibility check', clickable:false},
    {n:4, key:'docs', label:'Collect documents', clickable:true},
    {n:5, key:'submitted', label:'Submit on NSP portal', clickable:true},
  ];
  steps.forEach(({n,key,clickable})=>{
    const stepEl=document.getElementById('chk'+n+'-ico');
    const statEl=document.getElementById('chk'+n+'-stat');
    if(!stepEl||!statEl) return;
    const done=!!CHECKLIST[key];
    stepEl.innerHTML = done ? doneIco() : String(n);
    stepEl.style.cssText = done ? (doneCss+';display:flex;align-items:center;justify-content:center;') : pendingCss;
    statEl.textContent = done ? 'Done' : (clickable ? 'Mark done →' : 'Pending');
    statEl.style.cssText = done ? doneCss : (pendingCss+(clickable?';cursor:pointer':''));
  });
}

function updateDashboard(){
  updateChecklistUI();
  const data=typeof SchemeCatalog!=='undefined'?ProgrammeRules.rank(SchemeCatalog.forProfile(U),U,{excludeFailed:true}).map(row=>row.s):[];
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
  const deadlines=data.filter(s=>s.deadlineVerified && s.deadline && s.deadline>=today && s.status!=='closed').sort((a,b)=>a.deadline.localeCompare(b.deadline));
  const closing=deadlines.filter(s=>s.deadline.startsWith(today.slice(0,7))).length;
  for(const id of ['wb-deadlines','sc-deadlines','nav-deadlines']){const el=document.getElementById(id);if(el)el.textContent=closing;}
  for(const id of ['wb-matched','sc-matched'])document.getElementById(id).textContent=profileSet?data.length:'—';
  document.getElementById('sc-matched-chg').textContent=profileSet?data.length+' found →':'Check →';
  const potential=ProgrammeRules.potential(data,U);
  for(const id of ['wb-pot','sc-pot']){const el=document.getElementById(id);el.textContent=potential.amount?'₹'+Math.round(potential.amount/1000)+'K':'—';el.title=potential.scheme?potential.scheme.name+' · '+potential.label:'No fixed annual rate established for the selected programmes.';}
  document.getElementById('sc-pot-note').textContent=potential.label;
  const exams=document.getElementById('sc-exams');if(exams)exams.textContent=typeof ExamCalendar!=='undefined'?ExamCalendar.filter({status:'upcoming',date:today}).length:'—';
  document.getElementById('wbSub').textContent=profileSet?data.length+' scheme suggestions based on your profile. Check eligibility and prepare your application.':'Complete your profile to see personalised scheme matches.';
  document.getElementById('wb-notice').style.display=profileSet?'flex':'none';
  document.getElementById('wb-notice-txt').textContent=potential.checked?'Your answers meet published screening conditions. The authority decides selection and payment.':'Complete the scholarship checks for a personal estimate. Published rates are shown separately.';
  const deadlineBox=document.getElementById('dash-deadlines');
  if(deadlineBox)deadlineBox.innerHTML=deadlines.slice(0,3).map(s=>{
    const date=new Date(s.deadline+'T00:00:00Z'),days=Math.round((Date.parse(s.deadline+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);
    const color=days<=7?'rd':days<=30?'gd':'gn';
    return '<div class="dli"><div class="dldate"><div class="dld" style="color:var(--'+color+')">'+date.getUTCDate()+'</div><div class="dlm">'+date.toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',month:'short'})+'</div></div><div class="dash-row-main"><div class="dlname">'+escapeSchemeText(s.name)+'</div><div class="dlby">'+escapeSchemeText(s.by)+(s.applicationRoute==='renewal'?' · Renewal':'')+'</div><a class="dash-source" href="'+escapeSchemeText(officialSchemeUrl(s.deadlineSource || s.source))+'" target="_blank" rel="noopener noreferrer">Official notice ↗</a></div><div class="dlpill" style="background:var(--'+color+'l);color:var(--'+color+')">'+(days===0?'Today':days+'d left')+'</div></div>';
  }).join('') || '<div class="dlby" style="padding:16px">No upcoming deadline verified for these listings.</div>';
  const top=document.getElementById('dash-top-matches');
  const ranked=ProgrammeRules.rank(data,U,{excludeFailed:true});
  top.innerHTML=profileSet?ranked.slice(0,3).map(({s,check})=>'<div class="qsi" data-dashboard-scheme="'+escapeSchemeText(s.id)+'" tabindex="0" role="button"><div class="qsi-ico" style="color:var(--'+s.col+')">'+getSchemeIcon(s)+'</div><div class="qsi-main"><div class="qsi-name">'+escapeSchemeText(s.name)+'</div><div class="qsi-by">'+escapeSchemeText(s.by)+'</div></div><div class="qsi-r"><div class="qsi-amt" style="color:var(--'+s.col+')">'+(check.eligible && check.amtNum?'₹'+check.amtNum.toLocaleString('en-IN')+'/year':'View details →')+'</div><div class="qsi-m" style="color:var(--'+(check.eligible?'gn':'gd')+')">'+escapeSchemeText(ProgrammeRules.matchText(s,U))+'</div></div></div>').join(''):'<div style="text-align:center;padding:16px;color:var(--t3);font-size:13px">Complete your profile to see matches →</div>';
  const show=target=>{const row=target.closest('[data-dashboard-scheme]');if(!row)return;const s=SCHEMES.find(s=>s.id===row.dataset.dashboardScheme);if(s)sendQ('Tell me about '+s.name);};
  top.onclick=e=>show(e.target);top.onkeydown=e=>{if(e.key==='Enter' || e.key===' '){e.preventDefault();show(e.target);}};
}
