/* ════════════════════════════════════════════════
   Scheme Finder — App Init & Landing Animations
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══ INIT ══
window.addEventListener('DOMContentLoaded',()=>{
  renderSchemes(); renderDeadlines();
  loadChecklist();
  if(typeof loadApplications==='function') loadApplications();
  bootProfile();
  updateDashboard();
  syncSchemeCount();
  initHeroWordCycler();
  updateHeroWindow();
  if(typeof initFormAutoSave === 'function') initFormAutoSave();
  if(typeof restoreSavedEligibilityForm === 'function') restoreSavedEligibilityForm();
  try {
    const savedVoice = localStorage.getItem('sf_voice_lang') || 'ta-IN';
    if(typeof setVoiceLang === 'function') setVoiceLang(savedVoice);
  } catch(e){}

  // Navigation state retention on refresh:
  // When refreshing on homepage, stay on homepage.
  // When refreshing after clicking 'check my eligibility' or proceeding inside, redirect to dashboard/app.
  let currentView = 'land';
  try { currentView = sessionStorage.getItem('sf_view') || 'land'; } catch(e){}
  if(currentView === 'app') {
    if(typeof setPage === 'function') setPage('pg-app');
    let panel = 'dashboard';
    try { panel = sessionStorage.getItem('sf_panel') || 'dashboard'; } catch(e){}
    if(typeof goPanel === 'function') goPanel(panel);
  } else {
    if(typeof setPage === 'function') setPage('pg-land');
  }
  document.documentElement.classList.remove('preload-app');


  if(!chatReady && typeof initChat === 'function'){initChat();chatReady=true;}
  refreshStateScholarships().then(() => refreshSchemesFromBackend());
});

function initHeroWordCycler(){
  const el=document.getElementById('dynamicHeroWord');
  if(!el || el.dataset.cycling || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  el.dataset.cycling='true';
  const words=['scholarship','future','path','potential'];let index=0;
  const canCycle=()=>document.getElementById('pg-land')?.classList.contains('active') && document.documentElement.lang==='en' && (!document.getElementById('langSwitch')?.value || document.getElementById('langSwitch').value==='en') && !document.hidden;
  setInterval(()=>{
    if(!canCycle())return;
    el.classList.add('word-out');
    setTimeout(()=>{if(!canCycle()){el.classList.remove('word-out');return;}index=(index+1)%words.length;el.textContent=words[index];el.classList.remove('word-out');},320);
  },2200);
}
function updateHeroWindow(){
  const scheme=SchemeCatalog.records.find(s=>s.id==='central-sector');
  if(!scheme?.deadlineVerified || !scheme.opensOn || !scheme.deadline)return;
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
  const start=Date.parse(scheme.opensOn+'T00:00:00Z'),end=Date.parse(scheme.deadline+'T00:00:00Z');
  const percent=Math.max(0,Math.min(100,(Date.parse(today+'T00:00:00Z')-start)/(end-start)*100));
  document.getElementById('hero-window-progress').style.width=percent+'%';
  document.getElementById('hero-window-date').textContent=scheme.deadline<today?'Window ended':new Date(scheme.deadline+'T00:00:00Z').toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short'});
}

// The committed catalogue remains the source of truth in both runtimes.
async function refreshStateScholarships() {
  // The committed shared bundle makes the entire directory available offline.
  renderSchemes(currentSchFilter); renderDeadlines(); syncSchemeCount(); if(typeof updateDashboard==='function') updateDashboard();
}
async function refreshSchemesFromBackend(){
  // Never let older Mongo seeds or scraped metadata replace reviewed bundle facts.
  // Rule changes are reviewed, versioned in JSON and rebuilt for both runtimes.
  return;
}

// Restores a returning user's profile BEFORE goApp() ever checks
// `profileSet`, so the onboarding modal doesn't re-ask every visit.
// Local cache first (synchronous, instant), then — if logged in — the
// account's saved profile from the backend (authoritative, cross-device;
// overrides local cache once it resolves).
function bootProfile(){
  const gotLocal = loadProfileLocal();
  if(gotLocal && U.cat && U.edu && U.inc) profileSet = true;
  updateAccountUI();

  pullProfileFromBackend().then(user=>{
    if(user){
      if(U.cat && U.edu && U.inc){
        profileSet = true;
        saveProfileLocal();
        document.getElementById('modal')?.classList.add('hidden');
        refreshProfileViews();
        restoreSavedEligibilityForm();
      }
      updateAccountUI();
    }
  });
}

// The "140+ schemes" marketing copy predates this dataset and drifted out
// of sync with reality (actual count: SCHEMES.length). Drive every display
// of that number off the real array so it can't silently go stale again.
function syncSchemeCount(){
  const n = SCHEMES.length;
  document.querySelectorAll('[data-scheme-count]').forEach(el=>{el.textContent=String(n);});
  document.querySelectorAll('.hstat-item').forEach(item=>{
    const label = item.querySelector('.hstat-l');
    const num = item.querySelector('.hstat-n');
    if(label && num && /schemes/i.test(label.textContent)) num.innerHTML = String(n);
  });
  document.querySelectorAll('.nibadge').forEach(el=>{
    if(el.closest('[data-panel="schemes"]')) el.textContent = n;
  });
  document.querySelectorAll('.fc-d').forEach(el=>{
    el.textContent = el.textContent.replace(/\d+\+?(?=\s*schemes)/i, String(n));
  });
}
window.goPanel=goPanel; window.sendQ=sendQ; window.goApp=goApp; window.goLand=goLand;
window.filterSch=filterSch; window.renderCompare=renderCompare;


// ══════════════════════════════════════════════
//  LANDING PAGE ANIMATIONS — Intersection Observer
// ══════════════════════════════════════════════

(function() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (e.target.classList.contains("anim-card")) {
          const siblings = e.target.parentElement.querySelectorAll(".anim-card");
          siblings.forEach((el, i) => {
            setTimeout(() => el.classList.add("vis"), i * 75);
          });
        } else {
          e.target.classList.add("vis");
        }
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

  function initObserver() {
    document.querySelectorAll(
      ".anim-reveal, .anim-card, .sec-lbl, .sec-h, .sec-sub, .cta-h, .cta-sub, .btnw, .trust-badge"
    ).forEach(el => el.classList.add("vis"));
  }

  // Pause marquee when tab is hidden
  document.addEventListener("visibilitychange", () => {
    const t = document.querySelector(".marquee-track");
    if (t) t.style.animationPlayState = document.hidden ? "paused" : "running";
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initObserver);
  } else {
    initObserver();
  }
})();

/*
 * ── Stage 1 Note ──────────────────────────────────────────────
 * All JS is currently inlined for zero-dependency deployment.
 * The clean, separated versions of each module already exist at:
 *
 *   frontend/src/utils/eligibility.js  ← eligibility engine
 *   frontend/src/utils/chat.js         ← AI reply logic
 *   frontend/src/utils/helpers.js      ← formatting / DOM utils
 *   frontend/src/data/schemes.js       ← scheme definitions
 *   frontend/src/data/deadlines.js     ← deadline data
 *   frontend/src/data/news.js          ← news data
 *   frontend/src/data/exams.js         ← exam calendar data
 *   frontend/src/data/colleges.js      ← college compare data
 *
 * Stage 2 will migrate this file to React components using those
 * modules, with Vite as the build tool:
 *
 *   frontend/src/pages/Dashboard.js
 *   frontend/src/pages/Chat.js
 *   frontend/src/pages/Eligibility.js
 *   frontend/src/pages/Schemes.js
 *   frontend/src/pages/Deadlines.js
 *   frontend/src/pages/News.js
 *   frontend/src/pages/ExamCalendar.js
 *   frontend/src/pages/Calculator.js
 *   frontend/src/pages/CollegeCompare.js
 *   frontend/src/pages/Profile.js
 * ────────────────────────────────────────────────────────────
 */
