/* ════════════════════════════════════════════════
   Scheme Finder — App State & Constants
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══ STATE ══
const U = {name:'',age:'',gender:'',state:'',cat:'',edu:'',inc:'',marks:'',stream:'',disability:'',firstGrad:'',parentDisabled:'',parentOcc:''};
const PROFILE_FIELDS=Object.keys(U);
let mStep=1, mSels={}, chatReady=false, profileSet=false;

// ══ BACKEND MATCH API ══
// The real eligibility + conflict-aware best-fit engine now lives in
// backend/src/services/{eligibilityEngine,conflictEngine}.js, served over
// POST /api/v1/schemes/match. This calls that instead of recomputing
// locally. LAST_MATCH caches the most recent response so per-card grid
// badges (panels.js) can reuse it without a fetch per card. If the backend
// is unreachable, callers fall back to the local SCHEMES/eligFn copy so the
// app still works offline — that fallback is a safety net, not the primary
// path anymore.
// Port 5000 clashes with macOS's AirPlay Receiver (AirTunes) by default —
// using 5050 instead so this works out of the box. Keep in sync with
// backend/.env's PORT if you change either.
// Local development uses port 5050; deployed builds use the same-origin API
// unless config.js supplies a separate HTTPS backend.
const configuredApi = window.SCHEMEMATCH_CONFIG?.apiBase || '';
const PROD_API_BASE = '/api/v1';
const API_BASE = configuredApi && /^https:\/\//i.test(configuredApi) ? configuredApi.replace(/\/$/, '') : (['localhost', '127.0.0.1'].includes(location.hostname))
  ? 'http://localhost:5050/api/v1'
  : PROD_API_BASE;
let LAST_MATCH = null;

async function fetchMatch(u){
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  LAST_MATCH = null;
  try{
    const res = await fetch(API_BASE+'/schemes/match', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(u),
      signal: controller.signal,
    });
    if(!res.ok) return null;
    const json = await res.json();
    // A still-running older API must not restore unaudited awards or scores.
    if (typeof SchemeCatalog !== 'undefined') {
      const data = json.data;
      const arrays = ['eligible', 'needsVerification', 'bestCombo', 'excludedByConflict', 'relevantListings'];
      if (!data || data.catalogueVersion !== SchemeCatalog.version || arrays.some(key => !Array.isArray(data[key]))) return null;
      if (!Array.isArray(data.reviewedConditions?.candidates) || !Array.isArray(data.reviewedConditions?.questions)) return null;
      const records = new Map(SchemeCatalog.records.map(s => [s.id, s]));
      if (arrays.some(key => data[key].some(s => !s || !records.has(s.id))) || data.reviewedConditions.candidates.some(s => !s || !records.has(s.id))) return null;
      const awards = [...data.eligible, ...data.bestCombo, ...(data.bestSingle ? [data.bestSingle] : [])];
      if (awards.some(s => !s || records.get(s.id)?.matchingEnabled !== true)) return null;
      if(typeof ProgrammeRules!=='undefined'){
        if(awards.some(s=>{const expected=ProgrammeRules.score(records.get(s.id),u);return !expected.eligible || Number(s.amtNum)!==expected.amtNum;}))return null;
        if(data.bestCombo.length>1 || data.comboTotalValue!==data.bestCombo.reduce((sum,s)=>sum+(Number(s.amtNum)||0),0))return null;
      }
      if (!awards.length && data.comboTotalValue !== 0) return null;
    }
    LAST_MATCH = json.data;
    return LAST_MATCH;
  } catch(e){
    LAST_MATCH = null;
    console.warn('Backend match API unreachable — falling back to local eligibility engine:', e.message);
    return null;
  } finally { clearTimeout(timeout); }
}

// Optional catalogue read. Production cards use the reviewed shared bundle;
// ingestion proposals cannot replace it automatically.
async function fetchSchemesCatalog(){
  try{
    const res = await fetch(API_BASE+'/schemes');
    if(!res.ok) return null;
    const json = await res.json();
    if (typeof SchemeCatalog !== 'undefined' && json.catalogueVersion !== SchemeCatalog.version) return null;
    return json.data || null;
  } catch(e){
    console.warn('Backend schemes catalog unreachable — using bundled static data:', e.message);
    return null;
  }
}

// Look up a scheme's live score from the cached backend result (for grid
// badges). Returns null if not present, so callers know to fall back.
function matchFromCache(schemeId){
  if(!LAST_MATCH) return null;
  const hit = LAST_MATCH.eligible.find(s=>s.id===schemeId) || LAST_MATCH.needsVerification.find(s=>s.id===schemeId);
  if(!hit) return {score:0, reasons:[], blocks:['Not eligible based on backend result'], eligible:false};
  return {score:hit.score, reasons:hit.reasons, blocks:hit.blocks, eligible:LAST_MATCH.eligible.some(s=>s.id===schemeId)};
}

// ══ PROFILE PERSISTENCE ══
// Two layers, so the onboarding modal never has to re-ask on every visit:
//  1. localStorage — always on, no account needed. Fixes the modal
//     reappearing on every reload for guests.
//  2. Backend account (register/login, already built in
//     backend/src/{controllers,routes}/{auth,user}.*) — optional upgrade so
//     the profile follows the user across browsers/devices, not just this
//     one machine's localStorage.
const PROFILE_KEY = 'sf_profile';
const PROFILE_PENDING_KEY = 'sf_profile_pending';
const TOKEN_KEY = 'sf_token';
let AUTH_USER = null; // sanitized user object from backend, null = guest/not logged in
let profileSyncTimer=null,profileSyncPromise=null,profileSyncPending=false;
function scheduleProfileSync(){
  if(!getToken())return;
  clearTimeout(profileSyncTimer);
  profileSyncTimer=setTimeout(()=>pushProfileToBackend(),700);
}

function saveProfileLocal(){
  try{const value=JSON.stringify(U),changed=localStorage.getItem(PROFILE_KEY)!==value;localStorage.setItem(PROFILE_KEY,value);if(changed && getToken()){localStorage.setItem(PROFILE_PENDING_KEY,'true');scheduleProfileSync();}} catch(e){}
}
function loadProfileLocal(){
  try{
    const raw = localStorage.getItem(PROFILE_KEY);
    if(!raw) return false;
    Object.assign(U, JSON.parse(raw));
    return true;
  } catch(e){ return false; }
}

function getToken(){ try{ return localStorage.getItem(TOKEN_KEY); } catch(e){ return null; } }
function setToken(t){ try{ localStorage.setItem(TOKEN_KEY, t); } catch(e){} }
function clearToken(){ try{ localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(PROFILE_PENDING_KEY); } catch(e){} }

async function apiPost(path, body){
  const res = await fetch(API_BASE+path, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body),
  });
  const json = await res.json().catch(()=>({}));
  if(!res.ok) {const error=new Error(json.error || 'Request failed');error.status=res.status;throw error;}
  return json;
}
async function authedFetch(path, opts={}){
  const token = getToken();
  const headers = Object.assign({'Content-Type':'application/json'}, opts.headers||{}, token?{Authorization:'Bearer '+token}:{});
  const res = await fetch(API_BASE+path, {...opts, headers});
  const json = await res.json().catch(()=>({}));
  if(!res.ok) {const error=new Error(json.error || 'Request failed');error.status=res.status;throw error;}
  return json;
}

async function registerAccount(name, email, password){
  const json = await apiPost('/auth/register', {name, email, password});
  setToken(json.token); AUTH_USER = json.data;
  return json.data;
}
async function loginAccount(email, password){
  const json = await apiPost('/auth/login', {email, password});
  setToken(json.token); AUTH_USER = json.data;
  return json.data;
}
function logoutAccount(){ clearToken(); AUTH_USER = null; }
function replaceAccountProfile(user){
  PROFILE_FIELDS.forEach(key=>{U[key]=key==='name'?(user.name || ''):(user.profile?.[key] ?? '');});
  U.eligibilityDetails=typeof ReviewedConditions!=='undefined'?ReviewedConditions.sanitizeDetails(user.profile?.eligibilityDetails):{};
}

// Pull the account's saved profile (if logged in) and merge it into U.
// Returns the sanitized user object, or null if not logged in / token bad.
async function pullProfileFromBackend(){
  if(!getToken()) return null;
  const before=JSON.stringify(U);
  try{
    const json = await authedFetch('/user/profile');
    AUTH_USER = json.data;
    const pending=localStorage.getItem(PROFILE_PENDING_KEY)==='true';
    if(JSON.stringify(U)===before && !pending){
      if(AUTH_USER.profile)replaceAccountProfile(AUTH_USER);
      else if(AUTH_USER.name)U.name=AUTH_USER.name;
    }
    if(pending)scheduleProfileSync();
    return AUTH_USER;
  } catch(e){
    if(e.status===401){clearToken();AUTH_USER=null;}
    return null;
  }
}
// Push the current in-memory profile up to the account, if logged in.
async function pushProfileToBackend(){
  if(!getToken()) return null;
  clearTimeout(profileSyncTimer);
  profileSyncPending=true;
  if(profileSyncPromise)return profileSyncPromise;
  profileSyncPromise=(async()=>{
   while(profileSyncPending && getToken()){
    profileSyncPending=false;
    const snapshot=JSON.stringify(U);
  const profile = {age:U.age, gender:U.gender, state:U.state, cat:U.cat, inc:U.inc, edu:U.edu, marks:U.marks, stream:U.stream, disability:U.disability, firstGrad:U.firstGrad, parentDisabled:U.parentDisabled, parentOcc:U.parentOcc,
    eligibilityDetails: typeof ReviewedConditions !== 'undefined' ? ReviewedConditions.sanitizeDetails(U.eligibilityDetails) : {}};
  try{
    const json = await authedFetch('/user/profile', {method:'PUT', body: JSON.stringify({name:U.name, profile})});
    AUTH_USER = json.data;
    if(typeof handleProposalEmailResult==='function' && json.proposalEmail)handleProposalEmailResult(json.proposalEmail);
    if(JSON.stringify(U)===snapshot)localStorage.removeItem(PROFILE_PENDING_KEY);
  } catch(e){
    console.warn('Could not sync profile to account:', e.message);
  }
   }
   return AUTH_USER;
  })().finally(()=>{profileSyncPromise=null;});
  return profileSyncPromise;
}
window.addEventListener('online',()=>{if(localStorage.getItem(PROFILE_PENDING_KEY)==='true')scheduleProfileSync();});

// ══ APPLICATION CHECKLIST ══
// Steps 1-2 (open app, complete profile) are derived from state the app
// already tracks. Steps 3-5 used to be hardcoded "Pending" in the HTML with
// no id to update them, so they could never move — this is the actual
// tracked state for those, persisted so it survives reloads. "Collect
// documents" and "Submit on NSP portal" happen outside the app (on paper /
// on the NSP site), so the app can't detect them automatically — they're
// self-reported via a click, same pattern as the rest of the checklist.
const CHECKLIST_KEY = 'sf_checklist';
let CHECKLIST = { elig:false, docs:false, submitted:false };
function loadChecklist(){
  try{ const raw=localStorage.getItem(CHECKLIST_KEY); if(raw) Object.assign(CHECKLIST, JSON.parse(raw)); }catch(e){}
}
function saveChecklist(){ try{ localStorage.setItem(CHECKLIST_KEY, JSON.stringify(CHECKLIST)); }catch(e){} }
function markChecklist(key){ if(CHECKLIST[key]) return; CHECKLIST[key]=true; saveChecklist(); updateChecklistUI(); }
function toggleChecklist(key){ CHECKLIST[key]=!CHECKLIST[key]; saveChecklist(); updateChecklistUI(); }

const colMap={sf:'b-sf',gn:'b-gn',bl:'b-bl',gd:'b-gd',pu:'b-pu',pk:'b-pk',rd:'b-rd'};
const bgMap={sf:'var(--sfl)',gn:'var(--gnl)',bl:'var(--bll)',gd:'var(--gdl)',pu:'var(--pul)',pk:'var(--pkl)',rd:'var(--rdl)'};

// Compute match score and return object
function scoreScheme(scheme, u){
  if(!u.cat&&!u.edu&&!u.inc) return {score:0,reasons:[],blocks:['Complete your profile to see match'],eligible:false};
  if(scheme.reviewedConditions && typeof ProgrammeRules!=='undefined')return ProgrammeRules.score(scheme,u);
  if(typeof scheme.eligFn!=='function' || scheme.matchingEnabled === false) return {score:0,reasons:[],blocks:['Eligibility rules need review — check the official source'],eligible:false};
  const result = scheme.eligFn(u);
  if (typeof ReviewedConditions !== 'undefined') return ReviewedConditions.finishScore(result);
  return {...result, eligible: result.blocks.length===0 && result.score>=30};
}

// Get eligible schemes sorted by score
function getEligibleSchemes(u){
  return SCHEMES.map(s=>({...s,...scoreScheme(s,u)}))
    .filter(s=>s.eligible)
    .sort((a,b)=>b.score-a.score);
}

// Bar color based on score
function scoreColor(s){
  if(s>=75) return 'var(--gn2)';
  if(s>=50) return 'var(--gd)';
  return 'var(--sf)';
}

// Universal vector icon renderer (replacing emojis)
function getSchemeIcon(s){
  const str = (typeof s === 'string' ? s : (s?.name || '') + ' ' + (s?.type || '') + ' ' + (s?.ico || '')).toLowerCase();
  if(/book|read|matric|post-matric|pm-usp|central sector/i.test(str)){
    return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
  }
  if(/science|research|inspire|csir|lab|stem/i.test(str)){
    return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>`;
  }
  if(/aicte|tech|pragati|saksham|polytechnic|engineering/i.test(str)){
    return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
  }
  if(/girl|women|pragati|begum|hazrat|pudhumai|kalloori/i.test(str)){
    return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
  }
  if(/gov|state|ministry|central|national|tamil nadu/i.test(str)){
    return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="20" x2="22" y2="20"/><path d="M4 12v8M8 12v8M12 12v8M16 12v8M20 12v8"/><polygon points="12 2 2 7 22 7 12 2"/></svg>`;
  }
  if(/yasasvi|award|grant|prize|star/i.test(str)){
    return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
  }
  return `<svg class="v-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
}


