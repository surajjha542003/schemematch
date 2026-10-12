const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const Catalog=require('../../frontend/src/js/scheme-catalog');
const Review=require('../../frontend/src/js/reviewed-conditions');
const {officialUrl}=require('../../frontend/src/js/source-policy');
const {officialFetch}=require('../src/services/ingestion/officialFetch');
const {requireSchemeReviewer}=require('../src/middleware/auth.middleware');
const app=require('../src/app');

test('generated catalogue is current, unique and identical to the three source datasets',()=>{
  execFileSync(process.execPath,[path.resolve(__dirname,'../../scripts/build-catalog.cjs'),'--check']);
  const json=['state-scholarships','central-scholarships','other-schemes'].flatMap(f=>require('../../frontend/src/data/'+f+'.json'));
  assert.deepEqual(Catalog.records,json);
  assert.equal(Catalog.records.length,json.length);
  assert.equal(Catalog.records.filter(s=>s.sector && s.sector!=='students').length,12);
});

test('every approved state receives central and own-state listings, never a different state',()=>{
  const states=new Set(Catalog.records.map(s=>s.state).filter(Boolean));
  for(const state of states){const found=Catalog.forProfile({state});assert.ok(found.some(s=>s.state===state),state);assert.ok(found.some(s=>!s.state));assert.ok(found.every(s=>!s.state || s.state===state));}
  assert.equal(states.size,15);
  for(const state of states)assert.ok(Catalog.records.filter(s=>s.state===state && (s.sector || 'students')==='students').length>=4,state);
  assert.ok(Catalog.records.filter(s=>s.state==='Telangana').length>=7);
  assert.ok(Catalog.forProfile({state:'Maharashtra',eligibilityDetails:{domicileState:'Assam'}}).every(s=>!s.state || s.state==='Assam'));
});

test('balanced browsing does not allow any state to dominate the first row of every group',()=>{
  const stateRecords=Catalog.records.filter(s=>s.state);
  const first=Catalog.balanced(stateRecords).slice(0,15);
  assert.equal(new Set(first.map(s=>s.state)).size,15);
});

test('official URL policy rejects scripts, credentials, deceptive domains, plain HTTP and unreviewed operators',()=>{
  for(const url of ['javascript:alert(1)','http://scholarships.gov.in/','https://scholarships.gov.in.evil.test/','https://gov.in.evil.test/','https://user:secret@scholarships.gov.in/','https://127.0.0.1/','https://example.org/','https://scholarships.gov.in:8080/']) assert.equal(officialUrl(url),null,url);
  assert.ok(officialUrl('https://harchhatravratti.highereduhry.ac.in/Eligibility'));
  for(const s of Catalog.records){assert.ok(officialUrl(s.source),s.id);if(s.applicationUrl)assert.ok(officialUrl(s.applicationUrl),s.id);}
});

test('fetch validates every redirect before requesting an unapproved destination',async t=>{
  const original=global.fetch;t.after(()=>{global.fetch=original;});let calls=0;
  global.fetch=async()=>{calls++;return {status:302,headers:new Headers({location:'https://evil.test/'}),body:{cancel:async()=>{}}};};
  await assert.rejects(officialFetch('https://scholarships.gov.in/'),/redirected outside/);assert.equal(calls,1);
  await assert.rejects(officialFetch('https://evil.test/'),/outside/);assert.equal(calls,1);
});

test('reviewer access requires a database-granted role as well as an operator allowlist',t=>{
  const prior=process.env.SCHEME_REVIEWER_EMAILS;t.after(()=>{if(prior===undefined)delete process.env.SCHEME_REVIEWER_EMAILS;else process.env.SCHEME_REVIEWER_EMAILS=prior;});
  process.env.SCHEME_REVIEWER_EMAILS='reviewer@example.test';
  for(const user of [null,{email:'reviewer@example.test',role:'student'},{email:'other@example.test',role:'scheme-reviewer'}]){
    let status,called=false;requireSchemeReviewer({user},{status:s=>{status=s;return {json:()=>{}};}},()=>{called=true;});assert.equal(status,403);assert.equal(called,false);
  }
  let passed=false;requireSchemeReviewer({user:{email:'reviewer@example.test',role:'scheme-reviewer'}},{},()=>{passed=true;});assert.equal(passed,true);
});

test('public ingestion cannot run, list or approve; disconnected accounts fail promptly',async t=>{
  const server=app.listen(0,'127.0.0.1');t.after(()=>new Promise(r=>server.close(r)));await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api/v1`;
  for(const [method,url] of [['POST','/ingestion/run'],['GET','/ingestion/proposals'],['PATCH','/ingestion/proposals/123']]){const r=await fetch(base+url,{method});assert.equal(r.status,401);}
  for(const url of ['/auth/register','/auth/login']){const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'someone@example.test',password:'long-password',name:'Student',role:'scheme-reviewer'})});assert.equal(r.status,503);}
});

const csss=Catalog.records.find(s=>s.id==='central-sector');
const base={cat:'General',edu:'ug-tech',inc:'under1',state:'Maharashtra',marks:'99',eligibilityDetails:{applicationRoute:'fresh',regularDegree:'Yes',recognisedInstitution:'Yes',otherScholarship:'No'}};
test('CSSS never substitutes percentage marks for the board percentile condition',()=>{
  const result=Review.evaluate(csss,base);assert.equal(result.status,'more-information-needed');assert.equal(result.questions[0].key,'boardAbove80Percentile');
  const failed=Review.evaluate(csss,{...base,eligibilityDetails:{...base.eligibilityDetails,boardAbove80Percentile:'No'}});assert.equal(failed.status,'fails-reviewed-condition');assert.equal(failed.eligible,false);
});
test('CSSS renewal uses annual examination and attendance facts without a fresh board-percentile question',()=>{
  const profile={...base,eligibilityDetails:{...base.eligibilityDetails,applicationRoute:'renewal',attendancePercent:'75',annualExamPercent:'50'}};
  const result=Review.evaluate(csss,profile);assert.equal(result.status,'more-information-needed');assert.equal(result.questions[0].key,'csssCourse');assert.equal(result.eligible,false);
  assert.ok(!result.usedFields.includes('boardAbove80Percentile'));
  for(const [key,value] of [['attendancePercent','74.9'],['annualExamPercent','49.9']])assert.equal(Review.evaluate(csss,{...profile,eligibilityDetails:{...profile.eligibilityDetails,[key]:value}}).status,'fails-reviewed-condition');
});
test('CSSS does not allow income above the reviewed ceiling or another fee reimbursement to pass',()=>{
  for(const details of [{annualIncomeRupees:'450001'},{otherScholarship:'Yes'}]){
    const result=Review.evaluate(csss,{...base,eligibilityDetails:{...base.eligibilityDetails,...details}});assert.equal(result.status,'fails-reviewed-condition');assert.deepEqual(result.questions,[]);
  }
  assert.equal(csss.applicationRoute,'renewal');assert.equal(csss.deadlineSource,'https://scholarships.gov.in/All-Scholarships');
});

test('ingestion registry covers the catalogue rather than only Tamil Nadu',()=>{
  const {SOURCES}=require('../src/services/ingestion/sources');assert.equal(SOURCES.length,Catalog.records.length);assert.equal(new Set(SOURCES.map(s=>s.state).filter(Boolean)).size,15);
});

test('high-confidence AI extraction stays pending and does not write a live scheme',async t=>{
  const mongoose=require('../node_modules/mongoose');
  const Proposal=require('../src/models/SchemeChangeProposal.model');
  const Scheme=require('../src/models/Scheme.model');
  const structure=require('../src/services/ingestion/structureViaLLM');
  const filename=require.resolve('../src/services/ingestion/runIngestion');
  const cached=require.cache[filename], originalFetch=global.fetch, originalCreate=Proposal.create, originalUpdate=Scheme.findOneAndUpdate, originalStructure=structure.structureSourceText;
  const descriptor=Object.getOwnPropertyDescriptor(mongoose.connection,'readyState');
  t.after(()=>{global.fetch=originalFetch;Proposal.create=originalCreate;Scheme.findOneAndUpdate=originalUpdate;structure.structureSourceText=originalStructure;require.cache[filename]=cached;if(descriptor)Object.defineProperty(mongoose.connection,'readyState',descriptor);else delete mongoose.connection.readyState;});
  Object.defineProperty(mongoose.connection,'readyState',{configurable:true,value:1});
  global.fetch=async()=>new Response('<html><body><main>Official scholarship test text with enough content to extract.</main></body></html>',{status:200});
  structure.structureSourceText=async()=>({ok:true,data:{schemeNameFound:'Test programme',confidence:'high',deadline:'2026-10-31'}});
  let saved,liveWrites=0;Proposal.create=async record=>{saved=record;return record;};Scheme.findOneAndUpdate=()=>{liveWrites++;throw new Error('Live publication must not occur');};
  delete require.cache[filename];const {ingestOne}=require(filename);
  await ingestOne({schemeId:'test',url:'https://scholarships.gov.in/',type:'html',label:'Test programme'});
  assert.equal(saved.status,'pending');assert.equal(saved.extracted.confidence,'high');assert.equal(saved.sourceHash.length,64);assert.match(saved.sourceExcerpt,/Official scholarship/);assert.equal(liveWrites,0);assert.equal(saved.reviewedBy,undefined);
});

test('proposal review ignores a spoofed reviewer identity and prevents repeat decisions',async t=>{
  const mongoose=require('../node_modules/mongoose'),Proposal=require('../src/models/SchemeChangeProposal.model');
  const descriptor=Object.getOwnPropertyDescriptor(mongoose.connection,'readyState'),originalFind=Proposal.findOne,originalUpdate=Proposal.findOneAndUpdate;
  t.after(()=>{Proposal.findOne=originalFind;Proposal.findOneAndUpdate=originalUpdate;if(descriptor)Object.defineProperty(mongoose.connection,'readyState',descriptor);else delete mongoose.connection.readyState;});
  Object.defineProperty(mongoose.connection,'readyState',{configurable:true,value:1});
  const id='507f1f77bcf86cd799439011';let update;
  Proposal.findOne=()=>({lean:async()=>({fetchOk:true,extractionOk:true,sourceHash:'a'.repeat(64),sourceUrl:'https://scholarships.gov.in/',finalUrl:'https://scholarships.gov.in/'})});
  Proposal.findOneAndUpdate=async(query,value)=>{assert.equal(query.status,'pending');update=value.$set;return update;};
  const controller=require('../src/controllers/ingestion.controller');let response;
  await controller.reviewProposal({params:{id},user:{_id:'real-operator'},body:{decision:'approved',reviewedBy:'spoofed',reviewNote:'Manually checked exact programme section.'}},{json:v=>{response=v;}},e=>{throw e;});
  assert.equal(update.reviewedBy,'real-operator');assert.equal(response.published,false);
  Proposal.findOne=()=>({lean:async()=>null});let status;
  await controller.reviewProposal({params:{id},user:{_id:'real-operator'},body:{decision:'rejected',reviewNote:'Try changing a reviewed decision.'}},{status:s=>{status=s;return {json:()=>{}};}},e=>{throw e;});
  assert.equal(status,409);
});
