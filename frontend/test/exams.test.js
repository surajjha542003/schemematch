const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const Calendar=require('../src/js/exam-calendar');
const Catalog=require('../src/js/scheme-catalog');
const {loadWindow}=require('../testHelpers');
test('exam bundle matches JSON, covers each approved state and has no scholarship deadlines',()=>{
 execFileSync(process.execPath,[path.resolve(__dirname,'../../scripts/build-exams.cjs'),'--check']);
 assert.deepEqual(Calendar.records,require('../src/data/exam-calendar.json'));
 for(const state of new Set(Catalog.records.map(s=>s.state).filter(Boolean)))assert.ok(Calendar.filter({state}).length,state);
 assert.ok(Calendar.records.filter(e=>e.state==='Telangana').length>=4);
 assert.ok(Calendar.records.some(e=>!e.state && e.datesVerified));
 assert.ok(Calendar.records.every(e=>!e.id.includes('scholarship') && Calendar.officialUrl(e.source)));
});
test('exam countdowns use the next published day, distinguish past dates and respect Indian midnight',()=>{
 const gate=Calendar.records.find(e=>e.id==='gate-2027');
 assert.deepEqual(Calendar.schedule(gate,'2027-02-08'),{status:'upcoming',date:'2027-02-13',days:5});
 assert.equal(Calendar.schedule(gate,'2027-02-21').days,0);
 assert.equal(Calendar.schedule(gate,'2027-02-22').status,'past');
 assert.equal(Calendar.today(new Date('2026-10-09T18:31:00Z')),'2026-10-10');
 const undated=Calendar.records.find(e=>e.id==='tg-edcet');
 assert.deepEqual(Calendar.schedule(undated),{status:'unconfirmed',date:null,days:null});
 assert.ok(Calendar.filter({status:'upcoming',date:'2026-10-09'}).every(e=>e.datesVerified));
 assert.ok(Calendar.filter({status:'past',date:'2026-10-09'}).every(e=>e.state==='Tamil Nadu'));
});
test('academic organiser exceptions are exact hosts and do not broaden scheme link trust',()=>{
 const {officialUrl}=require('../src/js/source-policy');
 for(const url of ['javascript:alert(1)','https://gate2027.iitm.ac.in.evil.test/','https://unknown.ac.in/','http://www.upsc.gov.in/','https://user:secret@www.upsc.gov.in/'])assert.equal(Calendar.officialUrl(url),null);
 assert.ok(Calendar.officialUrl('https://gate2027.iitm.ac.in/important_dates'));
 assert.equal(officialUrl('https://gate2027.iitm.ac.in/important_dates'),null);
});
test('active exam UI filters Telangana, labels unknown dates and exposes past Tamil Nadu dates',t=>{
 const dom=loadWindow(['frontend/src/js/source-policy.js','frontend/src/js/scheme-catalog.js','frontend/src/js/exam-calendar.js','frontend/src/js/exams.js'],{bodyHtml:fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8'),postEval:"function escapeSchemeText(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}"});
 t.after(()=>dom.window.close());const w=dom.window;w.renderExamCalendar();
 assert.equal(w.document.getElementById('exam-status-filter').value,'upcoming');assert.ok(w.document.querySelectorAll('.exam-card').length>0);
 w.document.getElementById('exam-status-filter').value='current';w.document.getElementById('exam-state-filter').value='Telangana';w.renderExamCalendar();
 assert.equal(w.document.querySelectorAll('.exam-card').length,4);
 assert.match(w.document.getElementById('examGrid').textContent,/Next exam date unconfirmed/);
 assert.doesNotMatch(w.document.getElementById('examGrid').textContent,/days to next exam/);
 w.document.getElementById('exam-state-filter').value='Tamil Nadu';w.document.getElementById('exam-status-filter').value='past';w.renderExamCalendar();
 assert.equal(w.document.querySelectorAll('.exam-card').length,2);
 assert.ok([...w.document.querySelectorAll('.exam-card a')].every(a=>a.href.startsWith('https://')));
});
