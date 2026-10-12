const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadWindow } = require('../testHelpers');

// Steps 3-5 of the "Application Checklist" dashboard widget used to be
// hardcoded "Pending" in index.html with no id to ever update them — this
// verifies the actual fix (state.js's CHECKLIST + ui.js's updateChecklistUI)
// against the real markup shape (ids chk3-ico/chk3-stat etc, matching
// frontend/src/index.html).

const CHECKLIST_HTML = `
<div class="cbox">
  <div class="prog-item"><div class="pstep">1</div><div class="pname">Open Scheme Finder</div><div class="pstat">Done</div></div>
  <div class="prog-item" id="chk2"><div class="pstep" id="chk2-ico">2</div><div class="pname">Complete your profile</div><div class="pstat" id="chk2-stat">Set up &rarr;</div></div>
  <div class="prog-item"><div class="pstep" id="chk3-ico">3</div><div class="pname">Run eligibility check</div><div class="pstat" id="chk3-stat">Pending</div></div>
  <div class="prog-item"><div class="pstep" id="chk4-ico">4</div><div class="pname">Collect documents</div><div class="pstat" id="chk4-stat" onclick="toggleChecklist('docs')">Pending</div></div>
  <div class="prog-item"><div class="pstep" id="chk5-ico">5</div><div class="pname">Submit on NSP portal</div><div class="pstat" id="chk5-stat" onclick="toggleChecklist('submitted')">Pending</div></div>
</div>`;

function freshWindow() {
  const dom = loadWindow(['frontend/src/js/state.js', 'frontend/src/js/ui.js'], { bodyHtml: CHECKLIST_HTML });
  try { dom.window.localStorage.clear(); } catch (e) {}
  return dom;
}
const text = (w, id) => w.document.getElementById(id).textContent.trim();

test('checklist step 3 starts Pending before any eligibility check has run', () => {
  const { window: w } = freshWindow();
  w.loadChecklist();
  w.updateChecklistUI();
  assert.equal(text(w, 'chk3-stat'), 'Pending');
});

test('markChecklist("elig") — what eligibility.js calls after runElig() — flips step 3 to Done', () => {
  const { window: w } = freshWindow();
  w.loadChecklist();
  w.markChecklist('elig');
  assert.equal(text(w, 'chk3-stat'), 'Done');
});

test('step 4/5 "Mark done" toggles both ways (self-reported, since the app can\'t observe them)', () => {
  const { window: w } = freshWindow();
  w.loadChecklist();
  w.updateChecklistUI();
  assert.equal(text(w, 'chk4-stat'), 'Mark done →');
  w.toggleChecklist('docs');
  assert.equal(text(w, 'chk4-stat'), 'Done');
  w.toggleChecklist('docs');
  assert.equal(text(w, 'chk4-stat'), 'Mark done →');
});

test('checklist state persists across a simulated reload via localStorage', () => {
  const w1 = freshWindow().window;
  w1.loadChecklist();
  w1.markChecklist('elig');
  const savedRaw = w1.localStorage.getItem('sf_checklist');
  assert.ok(savedRaw);

  // Simulate a fresh page load — a NEW window, localStorage seeded with what
  // the first window wrote — the exact thing init.js's loadChecklist() call
  // depends on to survive a real browser reload.
  const dom2 = loadWindow(['frontend/src/js/state.js', 'frontend/src/js/ui.js'], { bodyHtml: CHECKLIST_HTML });
  dom2.window.localStorage.setItem('sf_checklist', savedRaw);
  dom2.window.loadChecklist();
  dom2.window.updateChecklistUI();
  assert.equal(text(dom2.window, 'chk3-stat'), 'Done');
});
