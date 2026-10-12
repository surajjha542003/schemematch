/* Public forms and applicant authentication only; no information-page fallback.
 * Published routes do not establish successful login or submission.
 */
const fs=require('node:fs');
const path=require('node:path');
const Policy=require('../frontend/src/js/source-policy');
const checked='2026-10-10', routes={};
function set(ids,applicationUrl,applicationAccess,applicationSource,applicationNote='',registrationUrl=null) {
  for(const id of ids.split(' '))routes[id]={applicationUrl,applicationAccess,applicationSource,applicationNote,registrationUrl,applicationChecked:checked};
}
set('tg-postmatric','https://tgepass.cgg.gov.in/homeServicePMSPreReg','form','https://telanganaepass.cgg.gov.in/epassonlinelinks.jsp','Fresh post-matric application: start with your SSC details. For renewal, use the renewal form below.');
set('tg-pre-matric','https://tgepass.cgg.gov.in/homeServicesprematricFreshRegistration','form','https://telanganaepass.cgg.gov.in/PrematricLinks.jsp','Opens the fresh pre-matric student form. Existing recipients can use the renewal form below.');
set('up-kanya-sumangala','https://mksy.up.gov.in/women_welfare/citizen/guest_login.php','registration','https://mksy.up.gov.in/women_welfare/citizen/guest_login.php','Opens citizen registration and applicant login. New applicants must read and accept the programme terms themselves before filling the registration form.');
set('up-sant-ravidas','https://labour.upbocw.in/worker/scheme/sant-ravidas-shiksha','form','https://uplabour.gov.in/','Opens the Sant Ravidas education application route. Registered construction workers must sign in and complete their worker profile before the form is available.');
set('cg-gyan-protsahan','https://schoolscholarship.cg.nic.in/CMGyaanProtsaahanRegistration.aspx','form','https://schoolscholarship.cg.nic.in/fhome.aspx','Start with the academic year and board roll number, then complete the student application.');
set('od-kalinga-sikhya','https://scholarship.odisha.gov.in/student-registration?state=1','registration','https://dhe.odisha.gov.in/sites/default/files/2023-11/51596.pdf','Register on the state scholarship portal, then choose Kalinga Sikhya Sathi for the interest subsidy after obtaining an eligible education loan. The loan itself is applied for through a scheduled bank.');
set('tn-bcmbc-postmatric-college','https://umisdashboard.tnega.org/auth/login','login','https://bcw.tn.gov.in/sub_page/62','Opens the UMIS login published by the department for fresh and renewal scholarship forms. Use your UMIS credentials; contact your college if your account or scholarship details need to be completed.');
set('tn-central-institutions','https://www.bcw.tn.gov.in/files/2026-2027-IIT-NIT-FreshApplication.pdf','download','https://bcw.tn.gov.in/sub_page/62','Download the 2026–27 fresh application; existing recipients should use the renewal form. Submit through the institution as instructed in the form.');
set('pm-mudra','https://www.mudra.org.in/Default/DownloadFile/Common_loan_Application_form.pdf','download','https://financialservices.gov.in/beta/sites/default/files/2025-04/Decade-of-Mudra-Yojana-Cover-Story-by-NIS.pdf','Download the loan application and submit it with the required documents to a participating lender. For a Shishu loan, use the separate form below.');
set('jh-marang-gomke',null,'closed','https://mgos.jharkhand.gov.in/','The official MGOS portal reports applications closed for 2026–27 and has published selection results. Check for the next application announcement.');
set('jh-sc-coaching',null,'institution','https://www.jharkhand.gov.in/PDepartment/ViewDocument?id=D030DO00616012019010943594','The published scheme accepts grant applications from coaching institutions. Students should contact the Welfare Department or a participating coaching institution for admission.');
set('up-scholarship-fees','https://scholarship.up.gov.in/RegistrationNew.aspx','registration','https://scholarship.up.gov.in/','Opens 2026–27 student registration. Choose the department for your category and your course to start the corresponding fresh form. The government service responded intermittently during this check.');
set('up-abhyudaya',null,'unavailable','https://sonbhadra.nic.in/education/','A working statewide student application form has not been confirmed. The published Abhyudaya portal could not be reached; contact your district Social Welfare Office for the current batch application.');
set('wb-hindi-scholarship',null,'unavailable','https://wbchse.wb.gov.in/student/scholarship/hindi-scholarship-scheme/','The council’s download contains an old scheme notice, not a current application form. Ask the Education Directorate’s Scholarship and Stipend Section for the current form.');
for(const [id,dept] of [['tg-overseas-st',2],['tg-overseas-bcebc',3]])set(id,`https://telanganaepass.cgg.gov.in/OverseasReg.do?dept=${dept}&stu_details(studentAction)=unspecified`,'form','https://telanganaepass.cgg.gov.in/OverseasLinks.do');
set('tg-overseas-sc tg-overseas-minority',null,'closed','https://telanganaepass.cgg.gov.in/OverseasLinks.do','The published overseas service page reports registrations closed for this category. A new form link will be needed when applications reopen.');
set('tg-corporate-admissions',null,'closed','https://telanganaepass.cgg.gov.in/CorporateApplicationForm.do','The official Corporate Admissions page reports student registrations closed.');
set('jh-postmatric','https://ekalyan.cgg.gov.in/student.do','login','https://ekalyan.cgg.gov.in/','Use Student Login / Register on this form, then choose Post-Matric Scholarship.');
set('kl-egrantz','https://egrantz.kerala.gov.in/Registration/index','login','https://egrantz.kerala.gov.in/','New applicants: complete one-time registration. Existing applicants: sign in and choose the scholarship.','https://egrantz.kerala.gov.in/Registration/onetime_reg');
set('kl-state-merit kl-suvarna-jubilee kl-ch-muhammedkoya','https://dcescholarship.kerala.gov.in/he_ma/hec_cadpge.php?st=1','login','https://dcescholarship.kerala.gov.in/he_ma/he_maindx.php','Published DCE registration and candidate-login forms. The login currently lists years only through 2024–25; a 2026–27 application window has not been confirmed.','https://dcescholarship.kerala.gov.in/he_notifn/registration.php');
set('hr-sc-bc-postmatric hr-ugpg-merit hr-ug-girls-merit hr-sc-stipend','https://harchhatravratti.highereduhry.ac.in/UserLogin','login','https://harchhatravratti.highereduhry.ac.in/HowToApply','Sign in as a student, then choose this scholarship. The published new-registration link currently returns an invalid-page message.');
set('cg-postmatric','https://postmatric-scholarship.cg.nic.in/LoginPage.aspx','login','https://postmatric-scholarship.cg.nic.in/','New students: register first. Existing students: sign in to open the post-matric form.','https://postmatric-scholarship.cg.nic.in/StudentRegistration.aspx');
set('br-bcebc-postmatric','https://pmsonline.bihar.gov.in/2026-27/pms/pms_online/CreateProfile.aspx','form','https://pmsonline.bihar.gov.in/2026-27/pms/pms_online/Default.aspx','Starts the BC/EBC post-matric profile form with OTR and CAPTCHA. Check the current application window before proceeding.');
for(const [id,cycle] of [['br-matric-incentive','Matric2627'],['br-inter-girls','Inter2627'],['br-inter-scst-girls','InterSCST2026']])set(id,`https://medhasoft.bihar.gov.in/${cycle}/Register.aspx`,'form','https://medhasoft.bihar.gov.in/','Starts this programme’s application with the required instructions and declarations.');
set('wb-svmcm','https://svmcm.wb.gov.in/page/register.php','registration','https://svmcm.wb.gov.in/','Choose your course/directorate to open the corresponding fresh registration form.');
set('wb-student-credit','https://wbscc.wb.gov.in/Applicant_Login','login','https://wbscc.wb.gov.in/','For study at an institution in India. For an institution outside India, use the foreign-course form below.','https://wbscc.wb.gov.in/Applicant_Registration');
set('rj-cm-higher-education rj-kalibai-scooty rj-devnarayan','https://sso.rajasthan.gov.in/signin?RU=scholarship','login','https://hte.rajasthan.gov.in/HTE/30992','Sign in with your Rajasthan SSO ID, then select this scholarship in the scholarship application.');
set('rj-postmatric','https://sso.rajasthan.gov.in/signin','login','https://sje.rajasthan.gov.in/scholarship_portal.aspx/Scholarship_Portal.aspx','Sign in with your Rajasthan SSO ID, open SCHOLARSHIP (SJE), then select the post-matric scheme.');
set('pm-kmy',null,'institution','https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2309204&lang=2&reg=48','Visit a Common Service Centre (CSC) for enrolment. The CSC operator completes the online registration after checking your details.');
set('pm-vishwakarma',null,'institution','https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=155216&lang=2&reg=3','Enrolment uses a Common Service Centre (CSC) and Aadhaar biometric authentication. A public self-service application form has not been confirmed.');
set('gj-sc-postmatric gj-food-bill','https://www.digitalgujarat.gov.in/loginapp/CitizenLogin.aspx','login','https://www.digitalgujarat.gov.in/loginapp/CitizenLogin.aspx','Create a citizen account or sign in, then select this programme under scholarship services.','https://www.digitalgujarat.gov.in/loginapp/CitizenRegistration.aspx');
set('od-emedhabruti od-gopabandhu od-bhasabruti','https://scholarship.odisha.gov.in/student-registration?state=1','registration','https://scholarship.odisha.gov.in/','Complete student registration, then sign in and select the Department of Higher Education and this scheme.');
const citizenLogin='https://mahadbt2.maharashtra.gov.in/home/-/login/openid_connect_request?p_p_state=maximized&_com_liferay_login_web_portlet_LoginPortlet_saveLastPath=false&_com_liferay_login_web_portlet_LoginPortlet_redirect=/&_com_liferay_login_web_portlet_LoginPortlet_OPEN_ID_CONNECT_PROVIDER_NAME=eMudhraIDAM';
set('mh-sc-postmatric mh-st-postmatric mh-obc-postmatric mh-open-merit',citizenLogin,'login','https://mahadbt2.maharashtra.gov.in/','Opens MahaDBT 2.0 citizen authentication. After signing in, select this scholarship; individual forms require an authenticated account.');
set('pm-kisan','https://pmkisan.gov.in/RegistrationFormupdated.aspx','form','https://pmkisan.gov.in/','Opens New Farmer Registration.');
set('pmfby','https://www.pmfby.gov.in/farmerRegistrationForm/','registration','https://www.pmfby.gov.in/farmerRegistrationForm/','Register as a farmer, then sign in to submit your crop-insurance application for the relevant season.');
set('pmjay','https://beneficiary.nha.gov.in/','login','https://sha.kerala.gov.in/wp-content/uploads/2025/12/BIS-2.0-Web-Usermanual_English_ver7.0.pdf','Choose Beneficiary and sign in with your mobile number to access the beneficiary identification and card process.');
set('gj-thesis','https://www.digitalgujarat.gov.in/loginapp/CitizenLogin.aspx','login','https://sje.gujarat.gov.in/dscw/schemes/1529?lang=English','Register or sign in, then select BCK-11 thesis assistance.','https://www.digitalgujarat.gov.in/loginapp/CitizenRegistration.aspx');
set('gj-medical-engineering','https://www.digitalgujarat.gov.in/loginapp/CitizenLogin.aspx','login','https://sje.gujarat.gov.in/dscw/schemes/1531?lang=English','Register or sign in, then select BCK-12 educational assistance.','https://www.digitalgujarat.gov.in/loginapp/CitizenRegistration.aspx');
set('cg-naunihal cg-noni-babu','https://shramevjayate.cg.gov.in/Public/ApplicationBOC_public.aspx','form','https://shramevjayate.cg.gov.in/Public/ApplicationBOC_public.aspx','Start the construction-worker scheme application with your district and labour registration number, then choose this programme.');
set('pmjdy','https://pmjdy.gov.in/files/forms/account-opening/English.pdf','download','https://pmjdy.gov.in/','Download and complete the account-opening form, then submit it to a participating bank.');
for(const [id,folder] of [['pmjjby','PMJJBY/English'],['pmsby','PMSBY/English'],['apy','APY/ENGLISH']])set(id,`https://jansuraksha.gov.in/Files/${folder}/ApplicationForm.pdf`,'download',`https://jansuraksha.gov.in/Forms-${id.toUpperCase()}.aspx`,'Download the enrolment form and submit it through your participating bank or post office.');
set('jh-savitribai','https://savitribaipksy.jharkhand.gov.in/login','login','https://savitribaipksy.jharkhand.gov.in/','Use Beneficiary Login to access your application, or download the published paper application form below.');
set('pmay-u2','https://pmaymis.gov.in/PMAYMIS2_2024/PMAY_SURVEY/EligiblityCheck.aspx','form','https://pmaymis.gov.in/PMAYMIS2_2024/PmayDefault.aspx','Starts the PMAY-U 2.0 application with its prerequisite eligibility questions.');
set('pm-ujjwala',null,'form','https://pmuy.gov.in/','Choose your LPG provider’s application form below.');
const options={
 'tg-pre-matric':[{label:'Renewal application form',url:'https://tgepass.cgg.gov.in/HomeServicePrematricRenewalRegistration'}],
 'tn-central-institutions':[{label:'Download renewal application form',url:'https://www.bcw.tn.gov.in/files/2026-2027-IIT-NIT-RenewalApplication.pdf'}],
 'pm-mudra':[{label:'Download Shishu application form',url:'https://www.mudra.org.in/Default/DownloadFile/Application_Form_for_Shishu.pdf'}],
 'tg-postmatric':[{label:'Renewal application form',url:'https://tgepass.cgg.gov.in/homeServicesPMSRenewalReg'}],
 'jh-savitribai':[{label:'Download application form',url:'https://savitribaipksy.jharkhand.gov.in/offlineForm_pdf'}],
 'wb-student-credit':[{label:'Foreign-course registration form',url:'https://wbscc.wb.gov.in/Scc_Foreign/Applicant_Registration'},{label:'Foreign-course application login',url:'https://wbscc.wb.gov.in/Scc_Foreign/Applicant_Login'}],
 'pm-ujjwala':[{label:'Bharatgas application form',url:'https://my.ebharatgas.com/bharatgas/LPGServices/ApplyUjjwala2Connection'},{label:'HP Gas registration form',url:'https://myhpgas.in/myHPGas/NewConsumerRegistration.aspx'},{label:'Indane application login',url:'https://cx.indianoil.in/webcenter/portal/Customer/pages_landingpage'}],
};
const institutional=new Set(['tn-pre-matric','tn-school-postmatric','tn-central-institutions','wb-kanyashree','ap-postmatric','ap-pre-matric','ap-best-schools','as-nijut-moina','as-minority-girls']);
let total=0,counts={},audit=[];
for(const file of ['state-scholarships','central-scholarships','other-schemes']){
 const target=path.join(__dirname,'../frontend/src/data',file+'.json');
 const records=JSON.parse(fs.readFileSync(target,'utf8'));
 for(const s of records){
  let route=routes[s.id];
  if(s.applicationUrl?.startsWith('https://scholarships.gov.in/'))route={applicationUrl:Policy.nspApplicationUrl,registrationUrl:Policy.nspRegistrationUrl,applicationAccess:'login',applicationSource:'https://scholarships.gov.in/Students',applicationChecked:checked,applicationNote:Policy.nspApplicationNote};
  if(!route)route={applicationUrl:null,registrationUrl:null,applicationAccess:institutional.has(s.id)?'institution':'unavailable',applicationSource:s.source,applicationChecked:null,applicationNote:institutional.has(s.id)?'Contact your school or college for the programme application. A public individual form link has not been confirmed.':'A working public application form link has not been confirmed for this programme. Check the programme source or contact its department.'};
  if(route.applicationAccess==='unavailable' && ['as-combined-merit','as-pg-research'].includes(s.id))route.applicationNote='The department’s Apply Now link currently has an expired security certificate. A working application form link has not been confirmed.';
  Object.assign(s,route,{portal:route.applicationUrl,applicationAudited:checked});
  delete s.applicationOptions;
  if(options[s.id])s.applicationOptions=options[s.id];
  counts[s.applicationAccess]=(counts[s.applicationAccess] || 0)+1;total++;
  audit.push({id:s.id,name:s.name,state:s.state || 'Central / All India',access:s.applicationAccess,source:s.applicationSource,checked:s.applicationChecked,...Policy.applicationActions(s)});
 }
 fs.writeFileSync(target,JSON.stringify(records,null,2)+'\n');
}
console.log('Audited '+total+' application routes: '+JSON.stringify(counts));
fs.writeFileSync(path.join(__dirname,'../docs/evidence/application-routes.snapshot.json'),JSON.stringify({auditedOn:checked,total,counts,scope:'Public entry routes only. No applicant login, identity verification or submission performed.',records:audit},null,2)+'\n');
