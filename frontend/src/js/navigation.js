/* ════════════════════════════════════════════════
   Scheme Finder — Navigation & Page Routing
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══ PAGES ══
function goLand(){
  try { sessionStorage.setItem('sf_view', 'land'); } catch(e){}
  setPage('pg-land');
}
function goApp(){
  try {
    sessionStorage.setItem('sf_view', 'app');
    if(!sessionStorage.getItem('sf_panel')) sessionStorage.setItem('sf_panel', 'dashboard');
  } catch(e){}
  setPage('pg-app');
  renderSchemes(); renderDeadlines();
  if(!chatReady){initChat();chatReady=true;}
  goPanel('dashboard');
  if(profileSet){ updateUI(); updateDashboard(); updateAccountUI(); }
  if(!profileSet) setTimeout(()=>document.getElementById('modal')?.classList.remove('hidden'),600);
}
function setPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById(id);
  if(target) target.classList.add('active');
  if(typeof placeLanguageControl==='function')placeLanguageControl();
  try {
    if(id === 'pg-land') sessionStorage.setItem('sf_view', 'land');
    else if(id === 'pg-app') sessionStorage.setItem('sf_view', 'app');
  } catch(e){}
}

const pTitles = {
  dashboard: 'Dashboard',
  chat: 'AI Assistant',
  eligibility: 'Eligibility Checker',
  schemes: 'All Schemes',
  deadlines: 'Deadlines',
  tracker: 'Application Tracker',
  profile: 'My Profile',
  news: 'Education News',
  exams: 'Exam Calendar',
  calculator: 'Scholarship Calculator',
  compare: 'College Compare'
};
function toggleMobileSidebar(force){
  const sb = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sbBackdrop');
  if(!sb) return;
  const shouldOpen = typeof force === 'boolean' ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', shouldOpen);
  if(backdrop) backdrop.classList.toggle('open', shouldOpen);
  document.body.classList.toggle('sb-open', shouldOpen);
}
window.toggleMobileSidebar = toggleMobileSidebar;

function goPanel(name){
  document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('active',n.dataset.panel===name));
  document.querySelectorAll('.mbnav-btn').forEach(n=>n.classList.toggle('active',n.dataset.bnav===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const p=document.getElementById('pn-'+name);
  if(p) p.classList.add('active');
  document.getElementById('abTitle').textContent=pTitles[name]||'';
  setPage('pg-app');
  try {
    sessionStorage.setItem('sf_view', 'app');
    sessionStorage.setItem('sf_panel', name);
  } catch(e){}
  toggleMobileSidebar(false);
  if (name === 'eligibility') {
    if (typeof restoreSavedEligibilityForm === 'function') restoreSavedEligibilityForm();
    else if (typeof fillEligibilityForm === 'function') fillEligibilityForm();
  }
  if (name === 'tracker' && typeof renderTracker === 'function') renderTracker();
  if (name === 'exams' && typeof renderExamCalendar === 'function') renderExamCalendar();
  if (name === 'news' && typeof renderEducationNews === 'function') renderEducationNews();
  if (name === 'deadlines') renderDeadlines();
  if (name === 'schemes') renderSchemes(currentSchFilter);
}

// Preserve current visible view on page reload
window.addEventListener('beforeunload', () => {
  try {
    const isLand = document.getElementById('pg-land')?.classList.contains('active');
    const isApp = document.getElementById('pg-app')?.classList.contains('active');
    if (isLand) {
      sessionStorage.setItem('sf_view', 'land');
    } else if (isApp) {
      sessionStorage.setItem('sf_view', 'app');
    }
  } catch (e) {}
});



