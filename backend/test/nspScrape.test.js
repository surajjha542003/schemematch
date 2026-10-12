const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parsePage,iso}=require('../../scripts/scrape-nsp.cjs');
test('NSP flat state cards ignore academic-year headers and separate student from officer deadlines',()=>{
 const html='<div class="announcementText">Academic Year 2026-27</div><h6>Academic Year 2026-27</h6><div class="row"><div class="col-md-10"><h6>Example scholarship (Merit Based Scheme)</h6><span>Student Application Closed on : 30-09-2026</span><span>Institute Verification Open till: 15-11-2026</span><a href="/public/scheme.pdf">Specifications</a></div></div>';
 const p=parsePage(html,{state:'Assam',classification:'state',checkedOn:'2026-10-09'});
 assert.equal(p.records.length,1);assert.equal(p.records[0].deadline,'2026-09-30');assert.equal(p.records[0].status,'closed');
 assert.equal(p.records[0].verificationWindows[0].date,'2026-11-15');assert.equal(p.records[0].matchingEnabled,false);
});
test('NSP renewal-only and undated listings remain distinct; missing dates are not guessed',()=>{
 const row=(name,span)=>`<div class="row"><div class="col-md-10"><h6>${name}</h6>${span}<a href="/public/scheme.pdf">Specifications</a><a href="javascript:alert(1)">FAQ</a></div></div>`;
 const html='<div class="accordion-item"><button class="accordion-button">Ministry of Education</button>'+row('Renewal scholarship','<span>Student Application Open till (for Renewal): 31-10-2026</span>')+row('Undated scholarship','<span>Institute Verification Open till: 30-11-2026</span>')+'</div>';
 const records=parsePage(html,{classification:'central'}).records;
 assert.equal(records[0].applicationRoute,'renewal');assert.equal(records[1].deadline,null);assert.equal(records[1].status,'unknown');
 assert.equal(records[0].faqUrl,null);
 for(const value of ['31-02-2026','30-99-2026','no date'])assert.equal(iso(value),null);
});
