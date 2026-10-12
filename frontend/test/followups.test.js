const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWindow } = require('../testHelpers');
const engine = require('../src/js/reviewed-conditions');
const records = require('../src/data/state-scholarships.json');
const base={state:'Haryana',cat:'SC',edu:'ug-arts',inc:'under1',stream:'arts'};

function setup(t,profile=base) {
  const dom=loadWindow(['frontend/src/js/reviewed-conditions.js','frontend/src/js/eligibility-engine.js','frontend/src/js/state.js','frontend/src/js/eligibility.js','frontend/src/js/eligibility-followups.js'],{
    bodyHtml:fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8'),
    postEval:`SCHEMES.splice(0,SCHEMES.length,...${JSON.stringify(records)}); Object.assign(U,${JSON.stringify(profile)}); window.testProfile=U; window.testSchemes=SCHEMES; window.fillBaseForTest=()=>{Object.entries(EF_FIELD_MAP).forEach(([id,key])=>{document.getElementById(id).value=U[key]||'';});};`,
  });
  t.after(()=>dom.window.close());
  const w=dom.window;
  w.fillBaseForTest();
  w.runElig=async()=>{w.testReruns=(w.testReruns||0)+1; w.renderEligibilityFollowups(w.testProfile);};
  w.renderEligibilityFollowups(w.testProfile);
  return w;
}
const inputs = w => [...w.document.querySelectorAll('#elig-followups form > .fg [data-detail-key]')].map(el=>el.dataset.detailKey);

test('conditional UI starts with one relevant question, shows why and a primary source, and accepts unknown', async t=>{
  const w=setup(t);
  assert.deepEqual(inputs(w),['domicileState']);
  assert.match(w.document.getElementById('elig-followups').textContent,/Haryana domicile/);
  assert.ok([...w.document.querySelectorAll('#elig-followups a')].every(a=>a.href.startsWith('https://harchhatravratti.highereduhry.ac.in/')));
  await w.applyEligibilityFollowups(w.document.querySelector('#elig-followups form'));
  assert.equal(w.testProfile.eligibilityDetails.domicileState,undefined);
  assert.deepEqual(inputs(w),['domicileState']);
  assert.match(w.document.getElementById('elig-followups').textContent,/More information needed/);
});

test('answering progressive questions persists facts without repeatedly asking them', async t=>{
  const w=setup(t);
  for (const [key,value,next] of [['domicileState','Haryana','institutionType'],['institutionType','aided','attendancePercent'],['attendancePercent','75',null]]) {
    w.document.getElementById('elig-detail-'+key).value=value;
    await w.applyEligibilityFollowups(w.document.querySelector('#elig-followups form'));
    assert.deepEqual(inputs(w),next?[next]:[]);
    assert.equal(w.testProfile.eligibilityDetails[key],value);
  }
  assert.match(w.document.getElementById('elig-followups').textContent,/Listed conditions met/);
  assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).eligibilityDetails.attendancePercent,'75');
  const saved=JSON.parse(w.localStorage.getItem('sf_profile'));
  const w2=setup(t,saved);
  assert.deepEqual(inputs(w2),[]);
});

test('known exclusion and an unrelated state do not request any additional facts', t=>{
  const w=setup(t,{...base,inc:'above8'});
  assert.deepEqual(inputs(w),[]);
  assert.match(w.document.getElementById('elig-followups').textContent,/Does not meet a reviewed condition/);
  const other=setup(t,{...base,state:'Assam'});
  assert.equal(other.document.getElementById('elig-followups').classList.contains('hidden'),true);
});

test('invalid attendance is refused without saving or running a match', async t=>{
  const w=setup(t,{...base,eligibilityDetails:{domicileState:'Haryana',institutionType:'aided'}});
  w.document.getElementById('elig-detail-attendancePercent').value='101';
  assert.equal(await w.applyEligibilityFollowups(w.document.querySelector('#elig-followups form')),false);
  assert.equal(w.testProfile.eligibilityDetails.attendancePercent,undefined);
  assert.equal(w.testReruns,undefined);
});

test('editing or clearing an answer recomputes the check; confirmed answers remain editable after relevance changes', async t=>{
  const w=setup(t,{...base,eligibilityDetails:{domicileState:'Haryana',institutionType:'aided',attendancePercent:'90'}});
  w.document.getElementById('elig-detail-attendancePercent').value='50';
  await w.applyEligibilityFollowups(w.document.querySelector('#elig-followups form'));
  assert.match(w.document.getElementById('elig-followups').textContent,/Does not meet a reviewed condition/);
  w.document.getElementById('elig-detail-domicileState').value='Assam';
  await w.applyEligibilityFollowups(w.document.querySelector('#elig-followups form'));
  assert.ok(w.document.getElementById('elig-detail-domicileState'));
  w.document.getElementById('elig-detail-domicileState').value='';
  await w.applyEligibilityFollowups(w.document.querySelector('#elig-followups form'));
  assert.equal(w.testProfile.eligibilityDetails.domicileState,undefined);
});

test('changing education, state or income invalidates affected facts and hides outdated results', t=>{
  const w=setup(t,{...base,inc:'2.5to4.5',eligibilityDetails:{domicileState:'Haryana',annualIncomeRupees:'250000',institutionType:'aided',attendancePercent:'90'}});
  w.document.getElementById('ef-inc').value='above8';
  w.saveFormData();
  assert.equal(w.testProfile.eligibilityDetails.annualIncomeRupees,undefined);
  assert.equal(w.testProfile.eligibilityDetails.attendancePercent,'90');
  assert.equal(w.document.getElementById('elig-followups').classList.contains('hidden'),true);
  w.document.getElementById('ef-edu').value='pg'; w.saveFormData();
  assert.equal(w.testProfile.eligibilityDetails.attendancePercent,undefined);
  assert.equal(w.testProfile.eligibilityDetails.institutionType,undefined);
  w.document.getElementById('ef-state').value='Maharashtra'; w.saveFormData();
  assert.equal(w.testProfile.eligibilityDetails.domicileState,undefined);
});

test('browser and backend share the same rule evaluator, and catalogue text cannot execute markup', t=>{
  const w=setup(t);
  assert.deepEqual(JSON.parse(JSON.stringify(w.ReviewedConditions.review(w.testSchemes,w.testProfile))),engine.review(records,{...base,name:'',age:'',gender:'',marks:'',disability:'',firstGrad:'',parentDisabled:'',parentOcc:''}));
  const s=w.testSchemes.find(s=>s.id==='hr-sc-bc-postmatric');
  s.name='<img src=x onerror="window.injected=true">';
  s.reviewedConditions.source='javascript:alert(1)';
  w.renderEligibilityFollowups(w.testProfile);
  assert.equal(w.document.querySelector('#elig-followups img'),null);
  assert.equal(w.document.querySelector('#elig-followups a'),null);
  assert.equal(w.injected,undefined);
});

test('a stalled matching API is aborted so the local rules remain usable', async t=>{
  const w=setup(t);
  let timeout;
  let cleared=false;
  w.setTimeout=fn=>{timeout=fn;return 42;};
  w.clearTimeout=id=>{if(id===42)cleared=true;};
  w.fetch=async(url,options)=>new Promise((resolve,reject)=>{
    options.signal.addEventListener('abort',()=>reject(new Error('aborted')));
  });
  const pending=w.fetchMatch(base);
  timeout();
  assert.equal(await pending,null);
  assert.equal(cleared,true);
  assert.deepEqual(inputs(w),['domicileState']);
});
