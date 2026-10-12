/* Deliberate source review, never invoked by scraping/import jobs. */
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../frontend/src/data');
const central=JSON.parse(fs.readFileSync(path.join(base,'central-scholarships.json')));
const states=JSON.parse(fs.readFileSync(path.join(base,'state-scholarships.json')));
const yes=(field,reason,when)=>({field,op:'oneOf',values:['Yes'],reason,...(when?{when}:{})});
const no=(field,reason,when)=>({...yes(field,reason,when),values:['No']});
const max=(field,value,reason,when)=>({field,op:'maximum',max:value,reason,...(when?{when}:{})});
const one=(field,values,reason,when)=>({field,op:'oneOf',values,reason,...(when?{when}:{})});
const doc=(id,label,help,source,when)=>({id,label,help,source,...(when?{when}:{})});
const nsp='https://scholarships.gov.in/home';
const nspDoc=doc('otr','NSP OTR and Aadhaar / permitted enrolment route','Use NSP to complete OTR authentication. Keep an active mobile number; enter identity details only on the official portal.',nsp);
for(const s of central.filter(s=>s.id.startsWith('aicte-'))){
  const diploma=s.id.endsWith('diploma'),pragati=s.id.includes('pragati'),saksham=s.id.includes('saksham'),swanath=s.id.includes('swanath');
  if(!pragati && !saksham && !swanath)continue;
  const route=s.id+'_route',fresh={[route]:['fresh']},renewal={[route]:['renewal']},source=s.guidelineUrl;
  const checks=[one(route,['fresh','renewal'],'Choose this programme’s application route.'),
    {field:'annualIncomeRupees',op:'incomeMax',max:800000,reason:'Annual family income must be at most ₹8 lakh under the guideline.'},
    yes('aicteApproved','AICTE approval of both course and institution is required.'),yes('regularTechnical','A regular technical course is required.'),
    no('dualDegree','The linked FAQ excludes dual-degree and postgraduate courses.'),
    no('otherFinancialAssistance','The scheme excludes other scholarship, salary, stipend or financial assistance.'),
    max('courseYear',diploma?3:4,'The course year exceeds this programme’s supported duration.'),
    yes(s.id+'_award','Renewal requires a previous award of this specific programme.',renewal),yes('promoted','Renewal requires passing and promotion.',renewal)];
  if(pragati)checks.push(one('gender',['Female'],'Pragati is for girl students.'),max('pragatiGirls',2,'A maximum of two girls per family can use Pragati.'));
  if(saksham)checks.push(yes('disability','Saksham requires a recognised disability.'),{field:'disabilityPercent',op:'minimum',min:40,reason:'A competent-authority disability certificate must show at least 40%.'});
  if(!swanath){
    checks.push(max('studyGapYears',2,'The qualifying-examination to admission gap must not exceed two years.'),
      one('admissionEntry',['first','lateral'],'Admission must be first-year or second-year lateral entry.'),
      max('courseYear',1,'Fresh first-year applicants must be in year one.',{...fresh,admissionEntry:['first']}),
      one('courseYear',['2'],'Fresh lateral-entry applicants must be in year two.',{...fresh,admissionEntry:['lateral']}));
  }else checks.push(one('swanathFamily',['orphan','covid','martyr','medical'],'Swanath requires a specified family circumstance.'),{field:'swanathFamily',op:'route',values:['orphan','covid','martyr'],reason:'Confirm the applicable family branch.',manualNote:'The May 2025 guideline adds medical/accident circumstances. The older FAQ has no checklist for that branch; ask the institution for its current evidence requirements.'});
  checks.push({field:'courseYear',op:'minimum',min:2,reason:'Renewal follows an award in an earlier course year.',when:renewal});
  s.reviewedConditions={categories:['*'],education:diploma?['diploma']:['ug-arts','ug-tech','ug-medical'],source,checkedOn:'2026-10-09',complete:true,
    reviewNote:'Published screening conditions on self-reported answers. Authority verifies evidence and selection. Guideline income boundary takes precedence over older FAQ wording. '+(swanath?'Medical/accident branch needs a current checklist.':'Fresh and renewal routes are checked separately.'),checks};
  s.matchingEnabled=true;s.eligibilityVerification='published-conditions-reviewed';s.benefitVerified=true;s.amt='₹50,000/year';s.benefit={kind:'annual-fixed',amount:50000,source,checkedOn:'2026-10-09'};
  s.verificationScope='Published screening rules, annual rate and linked document requirements reviewed. Selection, evidence verification and payment are decided by the authority.';
  s.ruleSourceVersion=swanath?'May 2025 guideline; older FAQ linked by current NSP':'July 2020 guideline; FAQ linked by current NSP';
  s.documentChecklist=[nspDoc,
    doc('aadhaar','Applicant Aadhaar','The linked AICTE FAQ requires Aadhaar. Use the official NSP route for authentication.',s.faqUrl),
    doc('bank','Aadhaar-seeded savings account in your own name','Ask your bank to confirm DBT seeding and account eligibility. Do not share account details here.',s.faqUrl),
    doc('ssc','Class X certificate and marksheet','Keep a clear copy matching the applicant’s name.',s.faqUrl),
    ...(!diploma?[doc('hsc','Class XII / equivalent certificate and marksheet','Use the qualifying-examination record accepted for your admission.',s.faqUrl)]:[]),
    doc('bonafide','Institution bonafide / study certificate','Request the institution’s signed, stamped programme format.',s.faqUrl),
    doc('income','Current-year family income certificate','Use a competent-authority certificate in the programme’s required format.',s.faqUrl),
    doc('category','Category certificate, if claiming reservation','Use the certificate for the category you claim.',s.faqUrl,{gender:['__unused__']})];
  // Category applicability is a profile condition, not a guessed mandatory document.
  s.documentChecklist[s.documentChecklist.length-1].when={cat:['SC','ST','OBC','BC','MBC','DNC']};
  if(!swanath)s.documentChecklist.push(doc('lateral',diploma?'ITI qualification for lateral entry':'Diploma qualification for lateral entry','Keep the qualifying certificate and marksheet.',s.faqUrl,{admissionEntry:['lateral']}));
  if(pragati)s.documentChecklist.push(doc('declaration','Parent declaration','Use the declaration format in the official FAQ.',s.faqUrl));
  if(saksham)s.documentChecklist.push(doc('disability','Competent-authority disability certificate','Keep a certificate confirming the disability percentage.',s.faqUrl),doc('udid','UDID consent on the official portal','NSP currently asks disabled applicants to consent to UDID data sharing before submission.',nsp));
  if(swanath){
    s.documentChecklist.push(doc('orphan','Orphan evidence','Use parents’ death certificates or the Tehsildar / SDM certificate allowed in the guideline.',source,{swanathFamily:['orphan']}),doc('covid','Parent death certificate stating COVID-19','Use the evidence specified in the guideline.',source,{swanathFamily:['covid']}),doc('martyr','Death and Shaheed certificates','Use the official Armed Forces / central paramilitary evidence.',source,{swanathFamily:['martyr']}));
  }
  s.documentChecklist.push(doc('promotion','Promotion certificate / previous-year passing record','Ask the head of institution for the renewal evidence.',source,renewal));
  s.checklistContext=[route,...(swanath?['swanathFamily']:['admissionEntry'])];
}
const csss=central.find(s=>s.id==='central-sector');
csss.matchingEnabled=true;csss.eligibilityVerification='published-conditions-reviewed';csss.benefit={kind:'csss',source:csss.guidelineUrl,checkedOn:'2026-10-09'};
csss.reviewedConditions.complete=true;
const csssAddedFields=new Set(['csssCourse','csssTenure','csssAishe','csssAward','csssConduct','csssFreshCohort','courseYear']);
csss.reviewedConditions.checks=csss.reviewedConditions.checks.filter(check=>!csssAddedFields.has(check.field));
csss.reviewedConditions.checks.push(one('csssCourse',['general','technical','professional-5','pg'],'Select the degree branch for the published rate.'),
  max('csssTenure',5,'CSSS support cannot exceed five years.'),yes('csssAishe','The institution/course must have a valid active AISHE route.'),
  yes('csssAward','Renewal requires a previous CSSS award.',{applicationRoute:['renewal']}),
  yes('csssConduct','Renewal can be forfeited for disqualifying conduct.',{applicationRoute:['renewal']}),
  yes('csssFreshCohort','Fresh applicants must enter year one after the last Class XII academic year without a gap.',{applicationRoute:['fresh']}),
  max('courseYear',1,'Fresh applicants must be in first-year graduation.',{applicationRoute:['fresh']}),
  max('courseYear',3,'General undergraduate rate covers the first three course years.',{csssCourse:['general']}),
  max('courseYear',4,'BTech / BEngg support ends at graduation in year four.',{csssCourse:['technical']}),
  max('courseYear',5,'Five-year professional / integrated degree rate covers up to year five.',{csssCourse:['professional-5']}),
  max('courseYear',2,'Postgraduate support is limited by the five-year total tenure.',{csssCourse:['pg']}));
csss.verificationScope='Published screening conditions, course/year rates and fresh/renewal documents reviewed. The current NSP notice establishes renewal only.';
csss.ruleSourceVersion='Guideline applicable from 2022-23; 2025-26 FAQ linked by current NSP';
csss.documentChecklist=[nspDoc,doc('bank','Aadhaar-seeded savings account in your own name','Confirm DBT seeding with the bank; enter bank details only on the official portal.',csss.faqUrl),
  doc('hsc','Class XII marksheet','Use the record matching your board and applicant details.',csss.faqUrl,{applicationRoute:['fresh']}),
  doc('income','Family income certificate','A competent-authority income certificate is required for fresh applications.',csss.guidelineUrl,{applicationRoute:['fresh']}),
  doc('category','Category / caste certificate, if claiming reservation','Use the appropriate reserved-category certificate.',csss.faqUrl,{applicationRoute:['fresh'],cat:['SC','ST','OBC','BC','MBC','DNC']}),
  doc('disability','Disability certificate, if applicable','Use your competent-authority certificate.',csss.faqUrl,{applicationRoute:['fresh'],disability:['Yes']}),
  doc('marks','Previous-year marksheet','Renewal requires the previous-year academic record.',csss.faqUrl,{applicationRoute:['renewal']})];csss.checklistContext=['applicationRoute'];
const overseas='https://telanganaepass.cgg.gov.in/OverseasLinks.do';
for(const s of states.filter(s=>s.id.startsWith('tg-overseas-'))){
  s.benefitVerified=true;s.amt='Up to ₹20 lakh · overseas grant';s.benefit={kind:'one-time-cap',cap:2000000,source:overseas,checkedOn:'2026-10-09'};
  s.tags=['Telangana',s.id.endsWith('sc')?'SC':s.id.endsWith('st')?'ST':s.id.endsWith('minority')?'Minority':'BC / EBC','Overseas study'];
  const cats=s.id.endsWith('-sc')?['SC']:s.id.endsWith('-st')?['ST']:s.id.endsWith('-minority')?['Minority','Minority (Muslim)','Minority (Christian)','Minority (Buddhist)','Minority (Jain)','Minority (Sikh)']:['BC','OBC','EBC'];
  s.audience={categories:cats,education:['pg','phd']};
  s.reviewedConditions={categories:cats,education:['pg','phd'],source:overseas,checkedOn:'2026-10-09',complete:false,
    reviewNote:'Portal headline conditions only. GOs, admission, tests, age and course details need further review. The cap is a programme grant, not annual income.',checks:[
      one('domicileState',['Telangana'],'Telangana domicile must be established.'),{field:'annualIncomeRupees',op:'incomeMax',max:499999,reason:'The portal states annual family income below ₹5 lakh.'},
      {field:'graduationPercent',op:'minimum',min:60,reason:'Graduation must have at least 60%.'},
      one('overseasCountry',['USA','UK','Australia','Canada','Singapore','Germany','New Zealand','Japan','France','South Korea'],'Admission must be in a listed country.'),
      yes('overseasSingleChild','Only one child per family can use the programme.'),
      ...(s.id.endsWith('bcebc')?[yes('overseasAdmissionVisa','BC/EBC applicants need the published COE / I-20 and visa evidence.')]:[])]};
  s.verificationScope='Portal benefit cap and headline conditions reviewed; detailed GO and selection review remains incomplete.';
  s.documentChecklist=[doc('admission','Overseas admission offer','Check the listed country, recognised course and admission evidence against the current GO.',overseas),...(s.id.endsWith('bcebc')?[doc('visa','COE / I-20 and visa','The current BC/EBC registration notice requires these documents.',overseas)]:[])];
}
const tg=states.find(s=>s.id==='tg-postmatric');tg.source='https://telanganaepass.cgg.gov.in/epassonlinelinks.jsp';tg.amt='Course-specific fees and maintenance';tg.tags=['Telangana','Post-matric','ePASS'];
tg.documentChecklist=[doc('aadhaar','Aadhaar and matching SSC details','For SC fresh registration, match Aadhaar and SSC names, then complete MeeSeva biometric authentication.',tg.source),doc('ssc','SSC / matriculation record','Keep the record needed for ePASS pre-registration.',tg.applicationUrl),doc('bank','Scanned bank passbook','Use the official ePASS bank-document upload service.',tg.source),doc('study','Seven-year study certificates, where requested','The current ePASS directory provides a study-certificate upload route; confirm applicability in your form.',tg.source)];
tg.verificationScope='2026-27 registration process and linked preparation records checked. Category/course fee sanction requires the current notification.';
const pre=states.find(s=>s.id==='tg-pre-matric');pre.audience={education:['9-10']};
const corp=states.find(s=>s.id==='tg-corporate-admissions');corp.audience={education:['9-10','11-12']};corp.tags=['Telangana','Intermediate admissions','Closed registration'];
for(const f of ['guidelineUrl','faqUrl'])for(const s of [...central,...states])if(s[f] && /\/(?:null|not_available\.pdf)$/.test(s[f]))delete s[f];
fs.writeFileSync(path.join(base,'central-scholarships.json'),JSON.stringify(central,null,2)+'\n');
fs.writeFileSync(path.join(base,'state-scholarships.json'),JSON.stringify(states,null,2)+'\n');
console.log('Reviewed seven central programmes and Telangana preparation / overseas references.');
