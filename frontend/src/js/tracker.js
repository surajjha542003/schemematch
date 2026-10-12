/* ════════════════════════════════════════════════
   Scheme Finder — Application Lifecycle Tracker
   Kanban board + .ics calendar export + application-ID vault.

   Local-only (localStorage), same pattern as CHECKLIST/PROFILE in state.js —
   no backend model for this yet. One entry per scheme a student has started
   tracking, independent of the global 3-step CHECKLIST (elig/docs/submitted)
   which stays as the coarse dashboard progress indicator.
   ════════════════════════════════════════════════ */

const TRACKER_KEY = 'sf_applications';
let APPLICATIONS = [];

const STAGES = ['discovered', 'docs_ready', 'applied', 'verified', 'disbursed'];
const STAGE_LABELS = {
  discovered: 'Discovered',
  docs_ready: 'Documents Ready',
  applied: 'Applied on Portal',
  verified: 'College Verified',
  disbursed: 'Disbursed (DBT)',
};

function loadApplications() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    if (raw) { const parsed=JSON.parse(raw); APPLICATIONS=Array.isArray(parsed) ? parsed.filter(a=>a && typeof a.id==='string' && /^[a-z0-9-]+$/i.test(a.id) && STAGES.includes(a.stage)) : []; }
  } catch (e) { APPLICATIONS = []; }
  updateTrackerBadge();
}
function saveApplications() {
  try { localStorage.setItem(TRACKER_KEY, JSON.stringify(APPLICATIONS)); } catch (e) {}
  updateTrackerBadge();
}
function updateTrackerBadge() {
  const badge = document.getElementById('trackerBadge');
  if (!badge) return;
  const active = APPLICATIONS.filter(a => a.stage !== 'disbursed').length;
  badge.textContent = active;
  badge.hidden = active === 0;
}

// Called from "+ Track" buttons on eligibility results, best-fit cards, and
// chat scheme cards — all pass plain strings (not the scheme object itself)
// so this works the same regardless of which renderer built the button.
function addToTracker(schemeId, name, by, amt, portalUrl, deadline) {
  const existing = APPLICATIONS.find(a => a.schemeId === schemeId);
  if (existing) { goPanel('tracker'); return; }
  APPLICATIONS.push({
    id: 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
    schemeId,
    name: name || schemeId,
    by: by || '',
    amt: amt || '',
    portalUrl: portalUrl || '',
    deadline: deadline || null, // 'YYYY-MM-DD' or null
    applicationId: '',
    stage: 'discovered',
    addedAt: new Date().toISOString(),
  });
  saveApplications();
  goPanel('tracker');
}
window.addToTracker = addToTracker;

function moveStage(appId, direction) {
  const app = APPLICATIONS.find(a => a.id === appId);
  if (!app) return;
  const idx = STAGES.indexOf(app.stage);
  const next = idx + direction;
  if (next < 0 || next >= STAGES.length) return;
  app.stage = STAGES[next];
  saveApplications();
  renderTracker();
}
window.moveStage = moveStage;

function updateAppField(appId, field, value) {
  const app = APPLICATIONS.find(a => a.id === appId);
  if (!app) return;
  if (!['deadline','applicationId'].includes(field)) return;
  if (field==='deadline' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  app[field] = String(value).slice(0,200);
  saveApplications();
}
window.updateAppField = updateAppField;

function removeFromTracker(appId) {
  APPLICATIONS = APPLICATIONS.filter(a => a.id !== appId);
  saveApplications();
  renderTracker();
}
window.removeFromTracker = removeFromTracker;

// Minimal escaping for scheme names dropped into a single-quoted onclick
// attribute (e.g. "Prime Minister's Research Fellowship (PMRF)").
function escJs(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
window.escJs = escJs;

function kcardHtml(a) {
  const idx = STAGES.indexOf(a.stage);
  return `<div class="kcard">
    <div class="kcard-name">${escapeSchemeText(a.name)}</div>
    ${a.by ? `<div class="kcard-by">${escapeSchemeText(a.by)}</div>` : ''}
    ${a.amt ? `<div class="kcard-amt">${escapeSchemeText(a.amt)}</div>` : ''}
    <div class="kcard-field">
      <label>Deadline</label>
      <input type="date" value="${escapeSchemeText(a.deadline || '')}" onchange="updateAppField('${a.id}','deadline',this.value)"/>
    </div>
    <div class="kcard-field">
      <label>Application ID / Token</label>
      <input type="text" placeholder="NSP OTR / e-Sevai ID" value="${escapeSchemeText(a.applicationId || '')}" onchange="updateAppField('${a.id}','applicationId',this.value)"/>
    </div>
    ${trackerApplicationActions(a).links.map(link=>`<a href="${escapeSchemeText(link.url)}" target="_blank" rel="noopener noreferrer" class="kcard-link">${escapeSchemeText(link.label)} &rarr;</a>`).join('')}
    ${trackerApplicationActions(a).search?`<a data-application-search href="${escapeSchemeText(trackerApplicationActions(a).search.url)}" target="_blank" rel="noopener noreferrer" class="kcard-link">${escapeSchemeText(trackerApplicationActions(a).search.label)} &rarr;</a>`:''}
    ${trackerApplicationActions(a).note?`<p class="application-note">${escapeSchemeText(trackerApplicationActions(a).note)}</p>`:''}
    <div class="kcard-actions">
      <button ${idx === 0 ? 'disabled' : ''} onclick="moveStage('${a.id}',-1)" title="Move back">&larr;</button>
      <button ${idx === STAGES.length - 1 ? 'disabled' : ''} onclick="moveStage('${a.id}',1)" title="Move forward">&rarr;</button>
      <button class="kcard-del" onclick="removeFromTracker('${a.id}')">Remove</button>
    </div>
  </div>`;
}

// Resolve saved cards by stable scheme ID so catalogue corrections also fix
// applications tracked before this update, without losing their progress.
function trackerPortalUrl(a) {
  return trackerApplicationActions(a).links[0]?.url || null;
}
function trackerApplicationActions(a) {
  if (typeof SourcePolicy === 'undefined') return {links:[],note:''};
  const scheme=typeof SchemeCatalog !== 'undefined' ? SchemeCatalog.records.find(s=>s.id===a.schemeId) : null;
  return scheme ? SourcePolicy.applicationActions(scheme) : {links:[],note:'Choose the current programme in All Schemes to find its application form.'};
}

function renderTracker() {
  const el = document.getElementById('trackerBoard');
  if (!el) return;
  if (!APPLICATIONS.length) {
    el.innerHTML = `<div class="eno-results"><div class="eno-t">Nothing tracked yet</div><div class="eno-s">Click "+ Track" on any scheme in your eligibility results, best-fit recommendation, or chat replies to add it here.</div></div>`;
    return;
  }
  el.innerHTML = `<div class="kanban">${STAGES.map(stage => {
    const apps = APPLICATIONS.filter(a => a.stage === stage);
    return `<div class="kcol">
      <div class="kcol-h">${STAGE_LABELS[stage]} <span class="kcol-count">${apps.length}</span></div>
      <div class="kcol-body">${apps.length ? apps.map(kcardHtml).join('') : '<div class="kcol-empty">—</div>'}</div>
    </div>`;
  }).join('')}</div>`;
}
window.renderTracker = renderTracker;

// ══ .ics EXPORT ══
// One VEVENT per tracked application that has a deadline set — all-day
// events so there's no timezone ambiguity for a date-only government
// deadline. Exported as a single file covering every tracked deadline at
// once rather than one download per scheme.
function icsEscape(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
}
function toIcsDate(d) { return d.replace(/-/g, ''); }

function exportIcs() {
  const withDeadline = APPLICATIONS.filter(a => a.deadline);
  if (!withDeadline.length) {
    alert('No tracked applications have a deadline set yet — add one in the Deadline field on a card first.');
    return;
  }
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SchemeMatch//Application Tracker//EN', 'CALSCALE:GREGORIAN'];
  withDeadline.forEach(a => {
    const desc = ['Stage: ' + (STAGE_LABELS[a.stage] || a.stage)];
    const portal=trackerPortalUrl(a);
    if (portal) desc.push('Portal: ' + portal);
    if (a.applicationId) desc.push('Application ID: ' + a.applicationId);
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + a.id + '@schemefinder',
      'DTSTAMP:' + dtstamp,
      'DTSTART;VALUE=DATE:' + toIcsDate(a.deadline),
      'DTEND;VALUE=DATE:' + toIcsDate(a.deadline),
      'SUMMARY:' + icsEscape(a.name + ' — application deadline'),
      'DESCRIPTION:' + icsEscape(desc.join(' | ')),
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'scheme-finder-deadlines.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
window.exportIcs = exportIcs;
