const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadWindow}=require('../testHelpers');
const Policy=require('../src/js/source-policy');
const Catalog=require('../src/js/scheme-catalog');

test('NSP application buttons use the application login, and information links stay unchanged',()=>{
  const nsp=Catalog.records.filter(s=>s.applicationUrl?.includes('scholarships.gov.in'));
  assert.equal(nsp.length,45);
  for(const s of nsp)assert.equal(Policy.applicationUrl(s),'https://scholarships.gov.in/ApplicationForm/',s.id);
  assert.equal(Policy.officialUrl('https://scholarships.gov.in/All-Scholarships'),'https://scholarships.gov.in/All-Scholarships');
  assert.equal(Policy.registrationUrl({applicationUrl:'https://scholarships.gov.in/All-Scholarships'}),Policy.nspApplicationUrl);
  for(const s of nsp){
    assert.deepEqual(Policy.applicationActions(s).links,[{url:Policy.nspApplicationUrl,label:'Application login'},{url:Policy.nspRegistrationUrl,label:'OTR registration form'}]);
    assert.match(Policy.applicationActions(s).note,/after sign-in/);
  }
});
test('state programmes keep their own exact portal; no application URL invents an NSP fallback',()=>{
  for(const id of ['tg-postmatric','mh-sc-postmatric','jh-postmatric','rj-devnarayan','br-inter-scst-girls']){
    const s=Catalog.records.find(s=>s.id===id);
    assert.equal(Policy.registrationUrl(s),Policy.officialUrl(s.applicationUrl),id);
    assert.ok(!Policy.registrationUrl(s).includes('scholarships.gov.in'),id);
  }
  assert.equal(new URL(Policy.registrationUrl(Catalog.records.find(s=>s.id==='tg-overseas-st'))).searchParams.get('dept'),'2');
  assert.equal(new URL(Policy.registrationUrl(Catalog.records.find(s=>s.id==='tg-overseas-bcebc'))).searchParams.get('dept'),'3');
  assert.equal(Policy.registrationUrl({source:'https://bcw.tn.gov.in/sub_page/8'}),null);
  assert.equal(Policy.registrationUrl({source:'javascript:alert(1)',applicationUrl:'https://fake.example/apply'}),null);
});
test('existing tracker cards resolve corrected routes by scheme ID without resetting progress',t=>{
  const dom=loadWindow(['frontend/src/js/source-policy.js','frontend/src/js/scheme-catalog.js','frontend/src/js/tracker.js'],{postEval:'window.cardForTest=kcardHtml;window.escapeSchemeText=s=>String(s).replaceAll("&","&amp;");'});
  t.after(()=>dom.window.close());
  const a={id:'app-old',schemeId:'central-sector',name:'CSSS',stage:'docs_ready',portalUrl:'https://scholarships.gov.in/All-Scholarships'};
  assert.match(dom.window.cardForTest(a),/href="https:\/\/scholarships.gov.in\/otrapplication\/"/);
  assert.match(dom.window.cardForTest(a),/href="https:\/\/scholarships.gov.in\/ApplicationForm\/"/);
  a.schemeId='tg-overseas-bcebc';
  assert.match(dom.window.cardForTest(a),/OverseasReg.do\?dept=3&amp;/);
  assert.equal(a.stage,'docs_ready');
  a.schemeId='tg-overseas-sc';
  assert.doesNotMatch(dom.window.cardForTest(a),/kcard-link/);
  assert.match(dom.window.cardForTest(a),/registrations closed/);
});
test('all 120 records distinguish forms, authentication and unavailable applications',()=>{
  assert.equal(Catalog.records.length,120);
  for(const s of Catalog.records){
    const actions=Policy.applicationActions(s);
    if(['closed','institution','unavailable'].includes(s.applicationAccess)){
      assert.equal(actions.links.length,0,s.id);assert.ok(actions.note,s.id);
      assert.equal(Policy.registrationUrl(s),null,s.id);
    }else{
      assert.ok(actions.links.length,s.id);
      assert.ok(s.applicationChecked && s.applicationSource,s.id);
      assert.ok(actions.links.every(link=>Policy.officialUrl(link.url) && /form|login/i.test(link.label)),s.id);
    }
  }
});
test('homepage regressions and non-approved provider routes cannot become application buttons',()=>{
  for(const url of ['https://mahadbt2.maharashtra.gov.in/','https://ekalyan.cgg.gov.in/','https://scholarship.odisha.gov.in/','https://pmkisan.gov.in/'])assert.equal(Policy.registrationUrl({applicationUrl:url}),null,url);
  assert.equal(Policy.officialUrl('https://my.ebharatgas.com/unrelated'),null);
  assert.equal(Policy.officialUrl('https://myhpgas.in/myHPGas/NewConsumerRegistration.aspx?next=https://fake.example'),null);
});

test('unconfirmed forms offer a separate government-focused web search in cards and saved tracker items',t=>{
  const s=Catalog.records.find(s=>s.id==='as-combined-merit');
  const actions=Policy.applicationActions(s),u=new URL(actions.search.url);
  assert.equal(actions.links.length,0);
  assert.equal(Policy.registrationUrl(s),null);
  assert.equal(u.origin,'https://www.google.com');
  assert.ok(u.searchParams.get('q').includes(s.name));
  assert.match(u.searchParams.get('q'),/site:gov.in OR site:nic.in/);
  assert.equal(Policy.officialUrl(actions.search.url),null);
  const dom=loadWindow(['frontend/src/js/source-policy.js','frontend/src/js/scheme-catalog.js','frontend/src/js/panels.js','frontend/src/js/tracker.js'],{postEval:'window.actionsForTest=schemeApplicationActions;window.cardForTest=kcardHtml;'});
  t.after(()=>dom.window.close());
  const wrapper=dom.window.document.createElement('div');
  wrapper.innerHTML=dom.window.actionsForTest(s);
  assert.equal(wrapper.querySelector('[data-application-search]').href,actions.search.url);
  assert.equal(wrapper.querySelector('[data-application-link]'),null);
  assert.match(dom.window.cardForTest({id:'old',schemeId:s.id,name:s.name,stage:'docs_ready'}),/data-application-search/);
  for(const access of ['closed','institution','login'])assert.equal(Policy.applicationActions({...s,applicationAccess:access}).search,undefined);
});

test('newly researched forms use their published state routes and narrow provider exceptions',()=>{
  const expected={
    'tg-pre-matric':'https://tgepass.cgg.gov.in/homeServicesprematricFreshRegistration',
    'up-scholarship-fees':'https://scholarship.up.gov.in/RegistrationNew.aspx',
    'up-kanya-sumangala':'https://mksy.up.gov.in/women_welfare/citizen/guest_login.php',
    'up-sant-ravidas':'https://labour.upbocw.in/worker/scheme/sant-ravidas-shiksha',
    'cg-gyan-protsahan':'https://schoolscholarship.cg.nic.in/CMGyaanProtsaahanRegistration.aspx',
    'od-kalinga-sikhya':'https://scholarship.odisha.gov.in/student-registration?state=1',
    'tn-bcmbc-postmatric-college':'https://umisdashboard.tnega.org/auth/login',
    'pm-mudra':'https://www.mudra.org.in/Default/DownloadFile/Common_loan_Application_form.pdf',
  };
  for(const [id,url] of Object.entries(expected)){
    const s=Catalog.records.find(s=>s.id===id);
    assert.equal(Policy.registrationUrl(s),url,id);
    assert.equal(Policy.applicationActions(s).search,undefined,id);
  }
  assert.equal(Policy.officialUrl('https://umisdashboard.tnega.org/unrelated'),null);
  assert.equal(Policy.officialUrl('https://labour.upbocw.in/unrelated'),null);
  assert.equal(Policy.officialUrl(expected['up-sant-ravidas']+'?redirect=https://fake.example'),null);
  assert.equal(Policy.officialUrl('https://www.mudra.org.in/Default/DownloadFile/unrelated.pdf'),null);
  assert.equal(Policy.officialUrl(expected['pm-mudra']+'?redirect=https://fake.example'),null);
  assert.equal(Catalog.records.find(s=>s.id==='jh-marang-gomke').applicationAccess,'closed');
  assert.equal(Catalog.records.find(s=>s.id==='jh-sc-coaching').applicationAccess,'institution');
  assert.doesNotMatch(Catalog.records.find(s=>s.id==='tg-pre-matric').applicationNote,/not found/);
});
