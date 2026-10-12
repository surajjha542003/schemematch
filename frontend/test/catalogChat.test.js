const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loadWindow}=require('../testHelpers');
const base={name:'Student',state:'Telangana',cat:'OBC',edu:'ug-tech',inc:'under1',stream:'engineering',gender:'Male',eligibilityDetails:{annualIncomeRupees:'80000',domicileState:'Telangana'}};
function setup(t,profile=base){
 const files=['state','eligibility-engine','tn-schemes','source-policy','scheme-catalog','catalog-bootstrap','reviewed-conditions','programme-rules','exam-calendar','navigation','ui','panels','eligibility','eligibility-followups','catalog-chat','chat','init'];
 const dom=loadWindow(files.map(f=>'frontend/src/js/'+f+'.js'),{
  bodyHtml:fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8'),
  transform:s=>s.slice(0,s.lastIndexOf('window.goPanel=goPanel')).replace(/window.addEventListener\('DOMContentLoaded',[\s\S]*?\n\}\);/g,''),
  postEval:`Object.assign(U,${JSON.stringify(profile)});profileSet=true;Object.entries(EF_FIELD_MAP).forEach(([id,key])=>{document.getElementById(id).value=U[key]||'';});window.testProfile=U;window.getGuidance=()=>GUIDED_APP;window.testSchemes=SCHEMES;window.getWhatIf=()=>LAST_WHATIF_CHANGES;window.sendQ=q=>window.lastQuery=q;window.goPanel=p=>window.lastPanel=p;`,
 });
 t.after(()=>dom.window.close());return dom.window;
}
test('find-my-schemes keeps rich interactive cards, the form prerequisite and own-state relevance',t=>{
 const w=setup(t);const html=w.reply('find my schemes');
 assert.match(html,/data-chat-action="guide"/);assert.match(html,/data-chat-action="conditions"/);assert.match(html,/data-chat-action="track"/);
 assert.match(html,/Telangana/);assert.doesNotMatch(html,/Tamil Nadu|92%|eligible schemes/);
 w.document.getElementById('ef-cat').value='';w.testProfile.cat='';w.localStorage.clear();
 assert.match(w.reply('find my schemes'),/Eligibility Form Required/);
});
test('certificate questions and named preparation guidance use distinct interactive paths',t=>{
 const w=setup(t);assert.match(w.reply('How to get income certificate for my scholarship?'),/Telangana official citizen services/);
 const id='tg-postmatric';
 assert.match(w.startGuidedApplication(id),/Document 1 of/);
 assert.match(w.reply('no'),/marked this as still needed/);assert.equal(w.getGuidance().stepIndex,0);
 assert.match(w.reply('yes'),/Document 2 of/);
 while(w.getGuidance() && w.getGuidance().stepIndex<w.getGuidance().documents.length-1)w.reply('yes');
 const final=w.reply('yes');assert.match(final,/ready · 0 still needed/);assert.match(final,/Open application form/);assert.match(final,/href="https:\/\/tgepass.cgg.gov.in\/homeServicePMSPreReg"/);assert.equal(w.getGuidance(),null);
 w.startGuidedApplication(id);assert.match(w.reply('cancel'),/cancelled/);assert.equal(w.getGuidance(),null);
});
test('every state and central card uses its own application route in browsing and Assistant',t=>{
 const w=setup(t),box=w.document.createElement('div');
 w.document.getElementById('sch-state-filter').value='all';w.document.getElementById('sch-include-outside').checked=true;w.renderSchemes();
 const cards=[...w.document.querySelectorAll('#schGrid .fsc')];
 for(const s of w.testSchemes.filter(s=>(s.sector || 'students')==='students')){
   const card=cards.find(c=>c.querySelector('.fsc-name').textContent===s.name);
   assert.deepEqual([...card.querySelectorAll('[data-application-link]')].map(a=>a.href),Array.from(w.SourcePolicy.applicationActions(s).links,link=>link.url),s.id);
   box.innerHTML=w.chatProgrammeCard(s);
   assert.deepEqual([...box.querySelectorAll('[data-application-link]')].map(a=>a.href),Array.from(w.SourcePolicy.applicationActions(s).links,link=>link.url),s.id);
   if(s.source!==s.applicationUrl)assert.ok([...box.querySelectorAll('a')].some(a=>a.href===w.SourcePolicy.officialUrl(s.source)),s.id+' source');
 }
});
test('what-if previews do not mutate facts; applying invalidates exact income and syncs the form',t=>{
 const w=setup(t);assert.match(w.reply('What if my annual family income is 3 lakh?'),/Simulation only/);
 assert.equal(w.testProfile.inc,'under1');assert.equal(w.testProfile.eligibilityDetails.annualIncomeRupees,'80000');
 w.applyWhatIfToProfile();assert.equal(w.testProfile.inc,'2.5to4.5');assert.equal(w.testProfile.eligibilityDetails.annualIncomeRupees,undefined);
 assert.equal(w.document.getElementById('ef-inc').value,'2.5to4.5');assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).inc,'2.5to4.5');assert.equal(w.lastQuery,'find my schemes');
});
test('a self-description updates existing form values before the next find-my-schemes query',t=>{
 const w=setup(t);assert.match(w.reply('I am a female SC student studying B.Tech in Telangana. My annual family income is 1.8 lakh. Find my scholarships.'),/Your profile details/);
 assert.equal(w.document.getElementById('ef-inc').value,'1to2.5');assert.equal(w.document.getElementById('ef-cat').value,'SC');assert.equal(w.document.getElementById('ef-gender').value,'Female');
 assert.equal(w.testProfile.eligibilityDetails.annualIncomeRupees,undefined);assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).cat,'SC');
 assert.match(w.reply('find my schemes'),/Telangana/);
});
test('dashboard preserves date tiles, clickable match rows and compact statistics without inferred awards',t=>{
 const w=setup(t);w.updateDashboard();
 assert.equal(w.document.querySelectorAll('#dash-deadlines .dldate').length,3);
 assert.equal(w.document.querySelectorAll('#dash-top-matches .qsi-ico').length,3);
 assert.equal(w.document.getElementById('sc-pot').textContent,'₹50K');assert.match(w.document.getElementById('sc-pot-note').textContent,/Published rate/);
 assert.ok(Number(w.document.getElementById('sc-exams').textContent)>0);
 w.document.querySelector('#dash-top-matches .qsi').click();assert.match(w.lastQuery,/Tell me about/);
});
test('interactive cards escape programme text and reject executable source links',t=>{
 const w=setup(t);const html=w.chatProgrammeCard({...w.testSchemes[0],name:'<img src=x onerror=alert(1)>',source:'javascript:alert(1)',applicationUrl:'javascript:alert(1)'});
 const div=w.document.createElement('div');div.innerHTML=html;
 assert.equal(div.querySelector('img'),null);assert.ok([...div.querySelectorAll('a')].every(a=>a.getAttribute('href')==='#' || a.href.startsWith('https://')));
});
test('original Assistant shortcuts return targeted sources rather than unrelated generic lists',t=>{
 const w=setup(t);
 assert.match(w.reply('UGC NET JRF fellowship details'),/UGC NET/);
 assert.match(w.reply('How to apply for PMRF fellowship?'),/Ministry of Education reference/);
 assert.doesNotMatch(w.reply('Scholarships for girl students in engineering'),/AICTE Pragati/);
 w.testProfile.gender='Female';assert.match(w.reply('Scholarships for girl students in engineering'),/AICTE Pragati/);w.testProfile.gender='Male';
 assert.doesNotMatch(w.reply('NSP Post-Matric Scholarship application steps'),/PM-USP CSSS/);
 const deadlines=w.chatCatalogueSelection('Upcoming scholarship deadlines');assert.ok(deadlines.every(s=>s.deadlineVerified && s.deadline>=w.ExamCalendar.today()));
 assert.ok(w.chatCatalogueSelection('Telangana scholarship deadlines').every(s=>s.state==='Telangana' && s.deadlineVerified));
});

test('education announcements render source links and state/search filters without a third-party feed',t=>{
 const w=setup(t);w.renderEducationNews();
 assert.ok(w.document.querySelectorAll('#newsGrid .news-card').length>5);
 const filter=w.document.getElementById('news-state-filter');filter.value='Telangana';w.renderEducationNews();
 assert.equal(w.document.querySelectorAll('#newsGrid .news-card').length,3);
 assert.ok([...w.document.querySelectorAll('#newsGrid a')].every(a=>a.href.startsWith('https://telanganaepass.cgg.gov.in/')));
 w.document.getElementById('newsSearch').value='biometric';w.renderEducationNews();
 assert.equal(w.document.querySelectorAll('#newsGrid .news-card').length,1);
 assert.match(w.document.getElementById('newsGrid').textContent,/SSC names/);
});

test('document guidance asks unknown category before omitting certificates and defers the unreviewed medical branch',t=>{
 const w=setup(t,{...base,cat:'',eligibilityDetails:{'aicte-pragati_route':'fresh',admissionEntry:'first'}});
 assert.match(w.startGuidedApplication('aicte-pragati'),/data-chat-detail-key="cat"/);
 Object.assign(w.testProfile,{cat:'SC',eligibilityDetails:{'aicte-swanath-degree_route':'fresh',swanathFamily:'medical'}});
 assert.match(w.startGuidedApplication('aicte-swanath-degree'),/Confirm the medical \/ accident checklist/);
 assert.equal(w.getGuidance(),null);
});
test('all six assistant cards show saved-profile percentages, with the strongest match first',t=>{
 const profile={...base,gender:'Female',disability:'No',eligibilityDetails:{...base.eligibilityDetails,'aicte-pragati_route':'fresh',aicteApproved:'Yes',regularTechnical:'Yes',dualDegree:'No',otherFinancialAssistance:'No',courseYear:'1',pragatiGirls:'1',studyGapYears:'0',admissionEntry:'first'}};
 const w=setup(t,profile),box=w.document.createElement('div');box.innerHTML=w.renderCatalogueMatches(w.testProfile);
 const cards=[...box.querySelectorAll('[data-chat-scheme-id]')];
 assert.equal(cards.length,6);assert.equal(cards[0].dataset.chatSchemeId,'aicte-pragati');assert.match(cards[0].textContent,/Best match.*\d+% match/);
 const percentages=cards.map(card=>Number(card.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')));
 assert.ok(percentages.every(n=>n>=70 && n<=100));assert.deepEqual(percentages,[...percentages].sort((a,b)=>b-a));
 assert.ok(!cards.some(card=>card.dataset.chatSchemeId==='aicte-saksham'));
 w.updateDashboard();assert.match(w.document.querySelector('#dash-top-matches .qsi:first-child').textContent,new RegExp(percentages[0]+'% match'));
 delete w.testProfile.eligibilityDetails.aicteApproved;
 box.innerHTML=w.chatProgrammeCard(w.testSchemes.find(s=>s.id==='aicte-pragati'));
 const percent=Number(box.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'));assert.ok(percent>0 && percent<100);
 assert.match(box.textContent,/Profile match · saved details/);
 box.innerHTML=w.chatProgrammeCard(w.testSchemes.find(s=>s.id==='tg-postmatric'));assert.ok(box.querySelector('[role="progressbar"]'));assert.match(box.querySelector('.badge').textContent,/% match/);
});
test('Find My Schemes uses saved details and ignores unsaved form edits',t=>{
 const w=setup(t);w.saveProfileLocal();
 w.document.getElementById('ef-state').value='Tamil Nadu';w.document.getElementById('ef-cat').value='SC';
 const html=w.reply('find my schemes');assert.match(html,/Telangana/);assert.doesNotMatch(html,/Tamil Nadu/);
 assert.equal(w.testProfile.state,'Telangana');assert.equal(w.testProfile.cat,'OBC');
 assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).cat,'OBC');
});
test('guidance acknowledges each ready document with a tick before asking the next one',t=>{
 const w=setup(t);const html=w.startGuidedApplication('tg-postmatric');assert.doesNotMatch(html,/class="csc-launch"/);
 const first=w.getGuidance().documents[0].label,next=w.reply('yes');
 const box=w.document.createElement('div');box.innerHTML=next;
 assert.equal(box.querySelector('.guide-check').textContent,'✓');assert.match(box.querySelector('.guide-confirmation').textContent,/Confirmed by you/);
 assert.ok(box.querySelector('.guide-confirmation').textContent.includes(first));assert.match(next,/Document 2 of/);
 assert.equal(w.getGuidance().documentStatus[w.getGuidance().documents[0].id],true);
 assert.doesNotMatch(next,/officially verified|certificate verified/i);
});
test('score explanations describe saved-profile factors without asking for unanswered eligibility conditions',t=>{
 const w=setup(t);w.reply('find my schemes');const html=w.reply('Why is this an 80% match?');
 assert.match(html,/saved details only/);assert.match(html,/Unanswered details do not reduce/);assert.doesNotMatch(html,/data-chat-detail-key=/);
 assert.match(html,/points/);
});

test('saved profile edits immediately refresh results, dashboard, personalised browsing and Assistant cards',t=>{
 const w=setup(t,{...base,disability:'No'}),d=w.document;
 d.getElementById('sch-state-filter').value='relevant';
 w.renderEligibilityMatches();d.getElementById('chatMsgs').innerHTML=w.renderCatalogueMatches();w.initFormAutoSave();
 const ids=()=>[...d.querySelectorAll('[data-eligibility-scheme]')].map(e=>e.dataset.eligibilityScheme);
 const before=ids();assert.ok(!before.includes('st-topclass'));
 d.getElementById('ef-cat').value='ST';d.getElementById('ef-cat').dispatchEvent(new w.Event('change'));
 assert.ok(ids().includes('st-topclass'));assert.equal(w.testProfile.cat,'ST');
 assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).cat,'ST');
 assert.equal(Number(d.getElementById('sc-matched').textContent),ids().length);
 assert.equal(Number(d.getElementById('sch-count').textContent),ids().length);
 assert.ok(d.querySelector('[data-profile-matches]').textContent.includes('ST'));
 const scores=[...d.querySelectorAll('#elig-list .erc-pct')].map(e=>Number(e.textContent.split('%')[0]));
 assert.deepEqual(scores,[...scores].sort((a,b)=>b-a));
 assert.equal(d.querySelector('#elig-list [data-eligibility-scheme]').dataset.eligibilityScheme,d.querySelector('#dash-top-matches [data-dashboard-scheme]').dataset.dashboardScheme);
});

test('course, income, gender, disability and state edits remove known conflicts and use the new saved facts',t=>{
 for(const [field,value,added,removed] of [
  ['edu','9-10','tg-pre-matric','central-sector'],['inc','above8',null,'central-sector'],
  ['gender','Female','aicte-pragati',null],['disability','Yes','aicte-saksham',null],
  ['state','Tamil Nadu','tn-central-institutions','tg-postmatric']
 ]){
  const w=setup(t,{...base,disability:'No'}),d=w.document;w.renderEligibilityMatches();w.initFormAutoSave();
  const id={edu:'ef-edu',inc:'ef-inc',gender:'ef-gender',disability:'ef-disability',state:'ef-state'}[field];
  d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('change'));
  const ids=[...d.querySelectorAll('[data-eligibility-scheme]')].map(e=>e.dataset.eligibilityScheme);
  if(added)assert.ok(ids.includes(added),field+' should add '+added);
  if(removed)assert.ok(!ids.includes(removed),field+' should remove '+removed);
  assert.equal(JSON.parse(w.localStorage.getItem('sf_profile'))[field],value);
  assert.equal(Number(d.getElementById('sc-matched').textContent),ids.length);
 }
});

test('extra eligibility questions and evidence start collapsed below compact results',t=>{
 const w=setup(t);w.renderEligibilityMatches();w.renderEligibilityFollowups(w.testProfile);
 const d=w.document,details=d.querySelector('#elig-followups .elig-refine');assert.ok(details);assert.equal(details.open,false);
 assert.ok(d.getElementById('elig-results').compareDocumentPosition(d.getElementById('elig-followups')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.ok([...d.querySelectorAll('#elig-followups a')].every(a=>a.closest('details')));
 assert.match(d.getElementById('eres-count').textContent,/profile matches/);assert.doesNotMatch(d.getElementById('eres-count').textContent,/0 meet/);
 assert.ok(d.querySelector('#elig-list .erc-bf'));assert.ok([...d.querySelectorAll('#elig-list .erc-amt')].every(el=>el.textContent.length<40));
});

test('restoring the form uses the current account profile including cleared values, rather than stale form storage',t=>{
 const w=setup(t);w.document.getElementById('ef-marks').value='90';
 w.saveFormData();w.testProfile.cat='ST';w.testProfile.marks='';w.restoreSavedEligibilityForm();
 assert.equal(w.document.getElementById('ef-cat').value,'ST');assert.equal(w.document.getElementById('ef-marks').value,'');
});

test('a slow account load cannot overwrite a profile edited while it was in flight, and offline does not log out',async t=>{
 const w=setup(t);w.setToken('test-token');let resolve;
 w.fetch=()=>new Promise(r=>{resolve=r;});const pending=w.pullProfileFromBackend();
 w.document.getElementById('ef-cat').value='ST';w.saveFormData();
 resolve({ok:true,json:async()=>({data:{name:'Student',profile:{...base,cat:'OBC'}}})});await pending;
 assert.equal(w.testProfile.cat,'ST');
 w.fetch=async()=>{throw new Error('offline');};await w.pullProfileFromBackend();assert.equal(w.getToken(),'test-token');
 w.fetch=async()=>({ok:false,status:401,json:async()=>({error:'Expired session'})});await w.pullProfileFromBackend();assert.equal(w.getToken(),null);
});

test('account profile saves are serialised so the latest edits finish last',async t=>{
 const w=setup(t);w.setToken('test-token');const calls=[];
 w.fetch=(url,options)=>new Promise(resolve=>calls.push({profile:JSON.parse(options.body).profile,resolve}));
 const first=w.pushProfileToBackend();assert.equal(calls.length,1);
 w.testProfile.cat='ST';const latest=w.pushProfileToBackend();assert.equal(calls.length,1);
 calls[0].resolve({ok:true,json:async()=>({data:{profile:calls[0].profile}})});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.length,2);assert.equal(calls[1].profile.cat,'ST');
 calls[1].resolve({ok:true,json:async()=>({data:{profile:calls[1].profile}})});await Promise.all([first,latest]);
 assert.equal(w.testProfile.cat,'ST');
});

test('unsynchronised offline edits survive the next account load and clear only after saving',async t=>{
 const w=setup(t,{...base,cat:'ST'});w.setToken('test-token');w.saveProfileLocal();
 assert.equal(w.localStorage.getItem('sf_profile_pending'),'true');
 w.fetch=async(url,options)=>({ok:true,json:async()=>({data:{name:'Student',profile:options?.body?JSON.parse(options.body).profile:base}})});
 await w.pullProfileFromBackend();assert.equal(w.testProfile.cat,'ST');assert.equal(w.localStorage.getItem('sf_profile_pending'),'true');
 await w.pushProfileToBackend();assert.equal(w.localStorage.getItem('sf_profile_pending'),null);
});

test('loading a different saved account clears optional facts absent from its profile',t=>{
 const w=setup(t,{...base,firstGrad:'Yes',parentDisabled:'Yes',eligibilityDetails:{aicteApproved:'Yes'}});
 w.replaceAccountProfile({name:'New student',profile:{cat:'ST',edu:'pg',inc:'under1',state:'Telangana'}});
 w.refreshProfileViews();w.restoreSavedEligibilityForm();
 assert.equal(w.testProfile.firstGrad,'');assert.equal(w.testProfile.parentDisabled,'');assert.deepEqual(Object.keys(w.testProfile.eligibilityDetails),[]);
 assert.equal(w.document.getElementById('ef-cat').value,'ST');assert.equal(w.document.getElementById('ef-firstgrad').value,'');
});

test('deadline alert prioritises the verified nearest exam registration and expires after closing',t=>{
 const w=setup(t);w.ExamCalendar.today=()=> '2026-10-10';w.renderDeadlines();
 const alert=w.document.getElementById('deadlineAlert');assert.match(alert.textContent,/GATE.*2 days left/);assert.match(alert.textContent,/late fee/);
 assert.equal(alert.querySelector('a').href,'https://gate2027.iitm.ac.in/important_dates');
 w.ExamCalendar.today=()=> '2026-10-12';w.renderDeadlines();assert.match(alert.textContent,/Closes today/);
 w.ExamCalendar.today=()=> '2026-10-13';w.renderDeadlines();assert.doesNotMatch(alert.textContent,/GATE/);
 w.ExamCalendar.today=()=> '2099-01-01';w.renderDeadlines();assert.equal(alert.classList.contains('hidden'),true);
});

test('literal category, school class and girl-student titles prevent conflicting profile recommendations',t=>{
 const w=setup(t,{...base,state:'Tamil Nadu',cat:'ST'});w.renderEligibilityMatches();
 const ids=[...w.document.querySelectorAll('[data-eligibility-scheme]')].map(e=>e.dataset.eligibilityScheme);
 assert.ok(!ids.includes('tn-central-institutions'));assert.ok(!ids.includes('tn-school-postmatric'));
 const titled={name:'Scholarship for SC/ST Girl Students',state:null,sector:'students'};
 assert.equal(w.ProgrammeRules.profileMatch(titled,{cat:'General',gender:'Female'}).percent,0);
 assert.equal(w.ProgrammeRules.profileMatch(titled,{cat:'SC',gender:'Male'}).percent,0);
 assert.ok(w.ProgrammeRules.profileMatch(titled,{cat:'SC',gender:'Female'}).percent>0);
 const alternative={name:'Scheme for OBC EBC and DNT students',sector:'students'};
 assert.equal(w.ProgrammeRules.profileMatch(alternative,{cat:'General'}).exclusions.length,0);
});

test('deadline, Assistant, dashboard, results and default browsing exclude every zero-profile match',t=>{
 for(const profile of [
   {...base,disability:'No'},
   {...base,cat:'SC',gender:'Female',disability:'Yes'},
   {...base,cat:'ST',edu:'9-10',disability:'No'},
   {...base,cat:'General',inc:'above8',state:'Tamil Nadu',eligibilityDetails:{}}
 ]){
   const w=setup(t,profile),d=w.document,fit=s=>w.ProgrammeRules.profileMatch(s,w.testProfile).percent;
   const checkNames=selector=>{
     for(const el of d.querySelectorAll(selector)){
       const s=w.testSchemes.find(s=>s.name===el.textContent);
       assert.ok(s && fit(s)>0,el.textContent);
     }
   };
   w.renderDeadlines();checkNames('#dlList .dlfc-name');
   w.updateDashboard();checkNames('#dash-deadlines .dlname');checkNames('#dash-top-matches .qsi-name');
   w.renderEligibilityMatches();for(const el of d.querySelectorAll('[data-eligibility-scheme]'))assert.ok(fit(w.testSchemes.find(s=>s.id===el.dataset.eligibilityScheme))>0);
   d.getElementById('sch-state-filter').value='all';w.renderSchemes();checkNames('#schGrid .fsc-name');
   assert.doesNotMatch(d.getElementById('schGrid').textContent,/0% match/);
   for(const query of ['Upcoming scholarship deadlines','Central scholarship deadlines','Telangana scholarship deadlines','Scholarship application portals','Pragati deadlines']){
     assert.ok(w.chatCatalogueSelection(query).every(s=>fit(s)>0),query);
   }
   const box=d.createElement('div');box.innerHTML=w.renderCatalogueMatches(w.testProfile);
   for(const card of box.querySelectorAll('[data-chat-scheme-id]'))assert.ok(fit(w.testSchemes.find(s=>s.id===card.dataset.chatSchemeId))>0);
   d.getElementById('sch-include-outside').checked=true;w.renderSchemes();
   assert.ok([...d.querySelectorAll('#schGrid .fsc-name')].some(el=>fit(w.testSchemes.find(s=>s.name===el.textContent))===0));
   assert.doesNotMatch(d.getElementById('schGrid').textContent,/\b0% match/);
 }
});

test('changing saved gender refreshes Assistant deadline suggestions without retaining excluded schemes',t=>{
 const w=setup(t,{...base,gender:'Female',disability:'No'});
 assert.ok(w.chatCatalogueSelection('Central scholarship deadlines').some(s=>s.id==='aicte-pragati'));
 w.initFormAutoSave();const field=w.document.getElementById('ef-gender');field.value='Male';field.dispatchEvent(new w.Event('change'));
 assert.ok(!w.chatCatalogueSelection('Central scholarship deadlines').some(s=>s.id==='aicte-pragati'));
 assert.equal(w.chatCatalogueSelection('Pragati deadlines').length,0);
 assert.ok([...w.document.querySelectorAll('#dlList .dlfc-name')].every(el=>!el.textContent.includes('Pragati')));
 assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).gender,'Male');
});
