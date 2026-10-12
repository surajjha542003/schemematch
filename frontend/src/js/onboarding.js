/* ════════════════════════════════════════════════
   SchemeMatch — Onboarding Modal
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══ ONBOARDING ══
const mMeta=[
  {
    svg:'<svg class="v-ico" style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    h:'Welcome to SchemeMatch',
    sub:'A few details so we can find your exact eligible schemes.'
  },
  {
    svg:'<svg class="v-ico" style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>',
    h:'Where are you from?',
    sub:'Helps find state-specific + Central schemes.'
  },
  {
    svg:'<svg class="v-ico" style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    h:'Your education?',
    sub:'Different levels have different eligible schemes.'
  },
  {
    svg:'<svg class="v-ico" style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    h:'Family income?',
    sub:'Many schemes are income-based. Your data stays private.'
  },
  {
    svg:'<svg class="v-ico" style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    h:'A few more details',
    sub:'Disability, first-generation-graduate, and parent-disability status unlock extra welfare schemes.'
  },
];
function updModal(){
  const m=mMeta[mStep-1];
  document.getElementById('m-ico').innerHTML=m.svg;
  document.getElementById('m-h').textContent=m.h;
  document.getElementById('m-sub').textContent=m.sub;
  document.querySelectorAll('.md-step').forEach((s,i)=>s.classList.toggle('active',i+1===mStep));
  document.querySelectorAll('.md-dot').forEach((d,i)=>d.classList.toggle('active',i+1===mStep));
  document.getElementById('m-next').innerHTML=mStep===5?'Find My Schemes &rarr;':'Continue &rarr;';
}
function selOpt(el,key,val){
  el.parentElement.querySelectorAll('.md-opt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel'); mSels[key]=val;
}
function mNext(){
  if(mStep===1){
    const n=document.getElementById('m-name').value.trim();
    if(!n){document.getElementById('m-name').focus();return;}
    U.name=n; U.age=document.getElementById('m-age').value.trim();
    U.gender=document.getElementById('m-gender').value;
  }
  if(mStep===2){U.state=document.getElementById('m-state').value;U.cat=mSels.cat||'';}
  if(mStep===3){U.edu=mSels.edu||'';}
  if(mStep===4){U.inc=mSels.inc||'';}
  if(mStep===5){
    U.disability=mSels.disability||''; U.firstGrad=mSels.firstGrad||''; U.parentDisabled=mSels.parentDisabled||'';
    finishOnboard();
    return;
  }
  mStep++;updModal();
}
function finishOnboard(){
  document.getElementById('modal').classList.add('hidden');
  if(U.name){
    profileSet=true;refreshProfileViews();
    // Persist so this doesn't get asked again: localStorage always (works
    // for guests), plus the account if logged in (cross-device).
    saveProfileLocal();
    pushProfileToBackend();
    if(typeof restoreSavedEligibilityForm === 'function') restoreSavedEligibilityForm();
    // Warm the backend match cache so schemes-grid badges (panels.js) show
    // real scores immediately instead of "Set profile to see match".
    fetchMatch(U).then(()=>renderSchemes());
  }
}

