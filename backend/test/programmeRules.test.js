const {test}=require('node:test'),assert=require('node:assert/strict');
const Catalog=require('../../frontend/src/js/scheme-catalog'),Conditions=require('../../frontend/src/js/reviewed-conditions'),Rules=require('../../frontend/src/js/programme-rules');
const {computeBestFit}=require('../src/services/conflictEngine');
const s=id=>Catalog.records.find(r=>r.id===id);
const p={state:'Telangana',cat:'SC',edu:'ug-tech',inc:'under1',gender:'Female',disability:'Yes',eligibilityDetails:{'aicte-pragati_route':'fresh','aicte-saksham_route':'fresh',aicteApproved:'Yes',regularTechnical:'Yes',dualDegree:'No',otherFinancialAssistance:'No',courseYear:'1',pragatiGirls:'2',disabilityPercent:'40',studyGapYears:'2',admissionEntry:'first'}};
test('Pragati and Saksham screen published conditions and calculate a source-backed annual rate',()=>{
 for(const id of ['aicte-pragati','aicte-saksham']){const r=Rules.score(s(id),p);assert.equal(r.eligible,true,id);assert.equal(r.amtNum,50000);}
 const r=computeBestFit(p,Catalog.records);assert.equal(r.bestCombo.length,1);assert.equal(r.comboTotalValue,50000);assert.ok(r.eligible.length>=2);
});
test('AICTE boundary checks, explicit exclusions and unknown answers never become full matches',()=>{
 const changes=[{gender:'Male'},{disability:'No'},{inc:'above8'}];
 assert.equal(Rules.score(s('aicte-pragati'),{...p,...changes[0]}).eligible,false);
 assert.equal(Rules.score(s('aicte-saksham'),{...p,...changes[1]}).eligible,false);
 for(const d of [{annualIncomeRupees:'800001'},{pragatiGirls:'3'},{studyGapYears:'3'},{courseYear:'3'},{dualDegree:'Yes'},{aicteApproved:'No'},{otherFinancialAssistance:'Yes'}])assert.equal(Rules.score(s('aicte-pragati'),{...p,eligibilityDetails:{...p.eligibilityDetails,...d}}).eligible,false,JSON.stringify(d));
 assert.equal(Rules.score(s('aicte-pragati'),{...p,eligibilityDetails:{...p.eligibilityDetails,annualIncomeRupees:'800000'}}).eligible,true);
 assert.equal(Rules.score(s('aicte-saksham'),{...p,eligibilityDetails:{...p.eligibilityDetails,disabilityPercent:'39.99'}}).eligible,false);
 const d={...p.eligibilityDetails};delete d.aicteApproved;assert.equal(Rules.score(s('aicte-pragati'),{...p,eligibilityDetails:d}).eligible,false);
});
test('lateral entry, renewal and degree/diploma facts are kept separate',()=>{
 const lateral={...p,eligibilityDetails:{...p.eligibilityDetails,admissionEntry:'lateral',courseYear:'2'}};
 assert.equal(Rules.score(s('aicte-pragati'),lateral).eligible,true);
 assert.equal(Rules.score(s('aicte-pragati-diploma'),lateral).eligible,false);
 const renewal={...p,eligibilityDetails:{...p.eligibilityDetails,'aicte-pragati_route':'renewal',courseYear:'3',promoted:'Yes','aicte-pragati_award':'Yes'}};
 assert.equal(Rules.score(s('aicte-pragati'),renewal).eligible,true);
 assert.equal(Rules.score(s('aicte-saksham'),renewal).eligible,false);
 assert.equal(Rules.score(s('aicte-pragati'),{...renewal,eligibilityDetails:{...renewal.eligibilityDetails,promoted:'No'}}).eligible,false);
});
const csss={...p,eligibilityDetails:{applicationRoute:'renewal',regularDegree:'Yes',recognisedInstitution:'Yes',otherScholarship:'No',attendancePercent:'75',annualExamPercent:'50',csssCourse:'technical',courseYear:'4',csssTenure:'4',csssAward:'Yes',csssConduct:'Yes',csssAishe:'Yes'}};
test('CSSS rate follows course/year and needs the actual renewal facts',()=>{
 assert.equal(Rules.score(s('central-sector'),csss).eligible,true);assert.equal(Rules.score(s('central-sector'),csss).amtNum,20000);
 for(const [branch,edu,year,amount] of [['general','ug-arts',3,12000],['technical','ug-tech',3,12000],['professional-5','ug-medical',5,20000],['pg','pg',1,20000]])assert.equal(Rules.rate(s('central-sector'),{...csss,edu,eligibilityDetails:{...csss.eligibilityDetails,csssCourse:branch,courseYear:String(year)}}).amount,amount);
 assert.equal(Rules.score(s('central-sector'),{...csss,eligibilityDetails:{...csss.eligibilityDetails,csssAward:'No'}}).eligible,false);
 assert.equal(Rules.score(s('central-sector'),{...csss,eligibilityDetails:{...csss.eligibilityDetails,csssTenure:'6'}}).eligible,false);
 assert.equal(Rules.score(s('central-sector'),{...csss,eligibilityDetails:{...csss.eligibilityDetails,csssCourse:'general'}}).eligible,false);
 assert.equal(Rules.score(s('central-sector'),{...csss,edu:'pg',eligibilityDetails:{...csss.eligibilityDetails,csssCourse:'pg',courseYear:'2',csssTenure:'4'}}).eligible,false);
 assert.equal(Rules.score(s('central-sector'),{...csss,edu:'pg',eligibilityDetails:{...csss.eligibilityDetails,csssCourse:'pg',courseYear:'2',csssTenure:'5'}}).eligible,true);
 assert.equal(Rules.rate(s('central-sector'),{...csss,eligibilityDetails:{}}).amount,0);
});
test('documents are scoped to the programme, route and family/category circumstances',()=>{
 const fresh=Rules.documents(s('central-sector'),{...csss,eligibilityDetails:{applicationRoute:'fresh'}}).map(d=>d.id);
 const renewal=Rules.documents(s('central-sector'),csss).map(d=>d.id);
 assert.ok(fresh.includes('income') && fresh.includes('category') && !fresh.includes('marks'));
 assert.ok(renewal.includes('marks') && !renewal.includes('income') && !renewal.includes('hsc'));
 const general=Rules.documents(s('central-sector'),{...csss,cat:'General',eligibilityDetails:{applicationRoute:'fresh'}});assert.ok(!general.some(d=>d.id==='category'));
 const swanath=Rules.documents(s('aicte-swanath-degree'),{...p,eligibilityDetails:{swanathFamily:'orphan','aicte-swanath-degree_route':'fresh'}}).map(d=>d.id);assert.ok(swanath.includes('orphan') && !swanath.includes('covid') && !swanath.includes('martyr'));
});
test('Telangana caps and partially reviewed conditions are never added to annual estimates',()=>{
 const tg=s('tg-overseas-sc');assert.equal(Rules.rate(tg,p).annual,false);assert.equal(Rules.rate(tg,p).amount,0);
 const profile={...p,edu:'pg',eligibilityDetails:{domicileState:'Telangana',annualIncomeRupees:'499999',graduationPercent:'60',overseasCountry:'USA',overseasSingleChild:'Yes'}};
 assert.equal(Conditions.evaluate(tg,profile).status,'meets-reviewed-conditions');assert.equal(Conditions.evaluate(tg,profile).eligible,false);
 assert.equal(Conditions.evaluate(tg,{...profile,eligibilityDetails:{...profile.eligibilityDetails,annualIncomeRupees:'500000'}}).status,'fails-reviewed-condition');
 assert.equal(Rules.matches([tg],profile).comboTotalValue,0);
});
test('extended profile facts survive the strict account schema while sensitive identifiers are dropped',()=>{
 const User=require('../src/models/User.model'),clean=Conditions.sanitizeDetails({...p.eligibilityDetails,aadhaar:'secret',bankNumber:'secret'});
 const user=new User({name:'Test student',email:'test@example.invalid',password:'test-only-password',profile:{...p,eligibilityDetails:clean}});
 assert.equal(user.profile.eligibilityDetails.aicteApproved,'Yes');assert.equal(user.profile.eligibilityDetails['aicte-pragati_route'],'fresh');assert.equal(user.profile.eligibilityDetails.aadhaar,undefined);
});
test('match percentage measures applicable checks, unanswered facts reduce it, and an exclusion forces zero',()=>{
 const complete=Rules.score(s('aicte-pragati'),p);assert.equal(complete.matchPercent,100);
 const details={...p.eligibilityDetails};delete details.aicteApproved;delete details.regularTechnical;
 const incomplete=Rules.score(s('aicte-pragati'),{...p,eligibilityDetails:details});
 assert.equal(incomplete.checkCounts.unknown,2);
 const total=Object.values(incomplete.checkCounts).reduce((sum,n)=>sum+n,0);
 assert.equal(incomplete.matchPercent,Math.floor(100*incomplete.checkCounts.passed/total));
 assert.ok(incomplete.matchPercent>0 && incomplete.matchPercent<100);
 assert.equal(incomplete.amtNum,0);
 assert.equal(Rules.score(s('aicte-pragati'),{...p,eligibilityDetails:{...details,dualDegree:'Yes'}}).matchPercent,0);
 assert.equal(Rules.score(s('tg-overseas-sc'),{...p,edu:'pg'}).matchPercent,null);
 assert.equal(Rules.score(s('ishan-uday'),p).matchPercent,null);
});
test('recommendations rank highest match first, keep incomplete listings below reviewed matches, and omit known failures',()=>{
 const profile={...p,disability:'No'},pool=[s('tg-postmatric'),s('central-sector'),s('aicte-saksham'),s('aicte-pragati')];
 const ranked=Rules.rank(pool,profile,{excludeFailed:true});
 assert.equal(ranked[0].s.id,'aicte-pragati');assert.equal(ranked[0].check.matchPercent,100);
 assert.ok(!ranked.some(row=>row.s.id==='aicte-saksham'));
 assert.equal(ranked.at(-1).check.matchPercent,null);
 assert.equal(Rules.matches(pool,profile).eligible[0].id,'aicte-pragati');
 const conflict=Rules.score(s('central-sector'),{...csss,eligibilityDetails:{...csss.eligibilityDetails,csssTenure:'1'}});
 assert.ok(conflict.matchPercent<100);assert.ok(conflict.checkCounts.manual>0);
});
test('profile relevance ignores unanswered conditions and never changes full eligibility or award calculation',()=>{
 const basic={state:'Telangana',cat:'SC',edu:'ug-tech',inc:'under1',gender:'Female',disability:'No',eligibilityDetails:{}};
 const csss=Rules.profileMatch(s('central-sector'),basic);
 assert.ok(csss.percent>=70);assert.equal(csss.kind,'saved-profile-relevance');
 assert.ok(!csss.factors.some(f=>f.field==='regularDegree'));
 const same=Rules.profileMatch(s('central-sector'),{...basic,eligibilityDetails:{regularDegree:'',csssConduct:'',courseYear:''}});
 assert.deepEqual(same,csss);
 assert.equal(Rules.score(s('central-sector'),basic).eligible,false);assert.equal(Rules.score(s('central-sector'),basic).amtNum,0);
 assert.equal(Rules.profileMatch(s('aicte-saksham'),basic).percent,0);
 assert.equal(Rules.profileMatch(s('central-sector'),{...basic,inc:'above8'}).percent,0);
 assert.equal(Rules.profileMatch(s('tg-postmatric'),{}).percent,null);
 assert.equal(Rules.profileMatch(s('tg-postmatric'),{...basic,state:'Bihar'}).percent,0);
 assert.equal(Rules.profileMatch(s('nsp-6d6f77dc3a12ac77'),basic).percent,0);
 assert.equal(Rules.profileMatch(s('nsp-c850d66b651b747b'),basic).percent,0);
 const ranked=Rules.rank(Catalog.forProfile(basic),basic,{excludeFailed:true}).slice(0,6);
 assert.equal(ranked.length,6);assert.ok(ranked.every(row=>row.profileMatch.percent>=70));
 assert.ok(Rules.matchExplanation(s('tg-postmatric'),basic).includes('not confirmed eligibility'));
});

test('potential estimate never selects an annual benefit outside the saved profile audience',()=>{
 const outside={...s('aicte-pragati'),audience:{genders:['Male']}};
 assert.equal(Rules.profileMatch(outside,p).percent,0);
 assert.equal(Rules.potential([outside],p).amount,0);
 assert.equal(Rules.potential([outside],p).scheme,null);
});
