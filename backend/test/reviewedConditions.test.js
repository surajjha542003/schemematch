const { test } = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../frontend/src/js/reviewed-conditions');
const records = require('../../frontend/src/data/state-scholarships.json');
const User = require('../src/models/User.model');
const userController = require('../src/controllers/user.controller');
const controller = require('../src/controllers/schemes.controller');

const base = { state: 'Haryana', cat: 'SC', edu: 'ug-arts', inc: 'under1' };
const review = p => engine.review(records,p);
const candidate = p => review(p).candidates[0];

test('questions are limited to a relevant state/category/course and never infer OBC as Haryana BC', () => {
  for (const change of [{state:'Assam'},{cat:'General'},{cat:'OBC'},{edu:'9-10'},{state:''}]) {
    assert.equal(review({...base,...change}).questions.length,0);
  }
  assert.deepEqual(review(base).questions.map(q => q.key),['domicileState']);
  assert.deepEqual(review({...base,cat:'BC'}).questions.map(q => q.key),['domicileState']);
  assert.equal(candidate(base).eligible,false);
});

test('Haryana answers are reused and only the next necessary question is asked', () => {
  const profile = {...base,eligibilityDetails:{domicileState:'Haryana'}};
  assert.deepEqual(review(profile).questions.map(q => q.key),['institutionType']);
  profile.eligibilityDetails.institutionType='aided';
  assert.deepEqual(review(profile).questions.map(q => q.key),['attendancePercent']);
  profile.eligibilityDetails.attendancePercent='75';
  assert.equal(candidate(profile).status,'meets-reviewed-conditions');
  assert.equal(candidate(profile).eligible,false);
  assert.equal(review(profile).questions.length,0);
  profile.eligibilityDetails.attendancePercent='74.99';
  assert.equal(candidate(profile).status,'fails-reviewed-condition');
  assert.equal(review(profile).questions.length,0);
});

test('known exclusions suppress questions even when earlier facts are missing', () => {
  for (const profile of [
    {...base,inc:'above8'},
    {...base,eligibilityDetails:{attendancePercent:'50'}},
    {...base,eligibilityDetails:{institutionType:'other'}},
  ]) {
    assert.equal(candidate(profile).status,'fails-reviewed-condition');
    assert.equal(review(profile).questions.length,0);
  }
});

test('exact income is requested only for ambiguous brackets and inclusive limits are respected', () => {
  assert.equal(engine.incomeOutcome({inc:'under1'},250000),'pass');
  assert.equal(engine.incomeOutcome({inc:'1to2.5'},250000),'pass');
  assert.equal(engine.incomeOutcome({inc:'2.5to4.5'},250000),'unknown');
  assert.equal(engine.incomeOutcome({inc:'above8'},250000),'fail');
  assert.equal(engine.incomeOutcome({inc:'2.5to4.5',eligibilityDetails:{annualIncomeRupees:'250000'}},250000),'pass');
  assert.equal(engine.incomeOutcome({inc:'2.5to4.5',eligibilityDetails:{annualIncomeRupees:'250001'}},250000),'fail');
  const profile={...base,inc:'2.5to4.5',eligibilityDetails:{domicileState:'Haryana'}};
  assert.deepEqual(review(profile).questions.map(q=>q.key),['annualIncomeRupees']);
});

test('TN general degrees do not acquire income/first-graduate gates from professional courses', () => {
  const profile={state:'Tamil Nadu',cat:'BC',edu:'ug-arts',inc:'above8',firstGrad:'No',eligibilityDetails:{tnCourseRoute:'general-3',institutionType:'government'}};
  assert.equal(candidate(profile).status,'meets-reviewed-conditions');
  assert.equal(review(profile).questions.length,0);
  const tech={...profile,edu:'ug-tech',inc:'under1',firstGrad:'',eligibilityDetails:{tnCourseRoute:'professional-4',institutionType:'self-financed'}};
  assert.deepEqual(review(tech).questions.map(q=>q.key),['governmentQuota']);
  tech.eligibilityDetails.governmentQuota='Yes';
  assert.deepEqual(review(tech).questions.map(q=>q.key),['firstGrad']);
  tech.firstGrad='No';
  assert.equal(candidate(tech).status,'fails-reviewed-condition');
  assert.equal(review(tech).questions.length,0);
});

test('unreviewed and contradictory TN course branches request source review instead of more personal data', () => {
  const p={state:'Tamil Nadu',cat:'BC',edu:'ug-arts',inc:'under1',eligibilityDetails:{tnCourseRoute:'other'}};
  assert.equal(candidate(p).status,'needs-source-review');
  assert.equal(review(p).questions.length,0);
  p.eligibilityDetails.tnCourseRoute='polytechnic-3';
  assert.equal(candidate(p).status,'needs-source-review');
  assert.equal(review(p).questions.length,0);
});

test('verified domicile controls relevance and does not equate the browsing state to proof', () => {
  const p={...base,eligibilityDetails:{domicileState:'Gujarat'}};
  assert.equal(candidate(p).id,'gj-sc-postmatric');
  assert.equal(candidate(p).status,'meets-reviewed-conditions');
  assert.equal(candidate(p).eligible,false);
  assert.match(candidate(p).reviewNote,/2025–26/);
});

test('saved additional details reject invalid numbers, unsupported values and sensitive extra fields', async () => {
  const invalid={attendancePercent:'101',annualIncomeRupees:'Infinity',domicileState:'Haryana',institutionType:'aided',aadhaar:'not-collected',firstGrad:'Yes'};
  assert.deepEqual(engine.sanitizeDetails(invalid),{domicileState:'Haryana',institutionType:'aided'});
  const user=new User({name:'Student',email:'student@example.test',password:'example-password',profile:{...base}});
  user.save=async()=>{};
  let response;
  await userController.updateProfile({user,body:{profile:{eligibilityDetails:invalid}}},{json:r=>{response=r;}},err=>{throw err;});
  assert.deepEqual(response.data.profile.eligibilityDetails,{domicileState:'Haryana',institutionType:'aided'});
});

test('match API exposes the same pending checks as offline matching and never adds them to awards', async () => {
  delete process.env.OPEN_ROUTER;
  delete process.env.OPENROUTER_API_KEY;
  const profile={...base,eligibilityDetails:{domicileState:'Haryana',institutionType:'aided',attendancePercent:'80'}};
  let response;
  await controller.matchSchemes({body:profile},{json:r=>{response=r;}},err=>{throw err;});
  assert.deepEqual(response.data.reviewedConditions,engine.review(require('../src/data/catalog').ALL_SCHEMES,profile));
  assert.ok(!response.data.eligible.some(s=>s.id==='hr-sc-bc-postmatric'));
  assert.ok(!response.data.bestCombo.some(s=>s.id==='hr-sc-bc-postmatric'));
});

test('legacy mandatory confirmation warnings cannot produce fully eligible awards', () => {
  const { scoreScheme } = require('../src/services/eligibilityEngine');
  const { TN_SCHEMES } = require('../src/data/tnSchemes');
  for (const id of ['tn-differently-abled-wards','tn-construction-workers','tn-first-graduate']) {
    const scheme=TN_SCHEMES.find(s=>s.id===id);
    assert.ok(scheme,id);
    const result=scoreScheme(scheme,{state:'Tamil Nadu',cat:'SC',edu:'ug-tech',inc:'under1'});
    assert.equal(result.eligible,false,id);
    assert.ok(result.blocks.some(b=>/confirm/i.test(b)),id);
  }
  // Amount uncertainty by itself must not be mistaken for a missing
  // applicant fact or create a new mandatory question.
  assert.equal(engine.finishScore({score:80,reasons:['⚠ Amount is unconfirmed — verify the current rate'],blocks:[]}).eligible,true);
  for (const message of ['ℹ Top 1% required — enter marks to verify','⚠ Scheme ceiling is ₹2L — confirm exact income']) {
    assert.equal(engine.finishScore({score:80,reasons:[message],blocks:[]}).eligible,false);
  }
});
