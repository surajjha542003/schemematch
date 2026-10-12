/* Run after inspecting the public scrape snapshot. Full rules remain pending. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {nspApplicationUrl,nspRegistrationUrl,nspApplicationNote}=require('../frontend/src/js/source-policy');
const nspAccess={applicationUrl:nspApplicationUrl,portal:nspApplicationUrl,registrationUrl:nspRegistrationUrl,applicationAccess:'login',applicationNote:nspApplicationNote,applicationSource:'https://scholarships.gov.in/Students',applicationChecked:'2026-10-10'};
const stateFile=path.join(root,'frontend/src/data/state-scholarships.json');
const centralFile=path.join(root,'frontend/src/data/central-scholarships.json');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/nsp-catalogue.snapshot.json')));
if(!snapshot.complete || snapshot.failures?.length || !Array.isArray(snapshot.records) || !snapshot.records.length)throw new Error('Import requires a complete public catalogue snapshot');
const states=JSON.parse(fs.readFileSync(stateFile)),central=JSON.parse(fs.readFileSync(centralFile));
const approved=new Set(states.map(s=>s.state));
const aliases={
 'central-sector':/\(CSSS\)/i,'aicte-pragati':/Pragati.*Degree/i,'aicte-pragati-diploma':/Pragati.*Diploma/i,
 'aicte-saksham':/Saksham.*Degree/i,'aicte-saksham-diploma':/Saksham.*Diploma/i,
 'aicte-swanath-degree':/Swanath.*Degree/i,'aicte-swanath-diploma':/Swanath.*Diploma/i,
 'ugc-pg-national':/National Scholarship For Post Graduate Studies/i,'ishan-uday':/Ishan Uday/i,
 'pm-yasasvi-college':/YASASVI.*Top Class.*College/i,'pm-yasasvi-school':/YASASVI.*Top Class.*Schools/i,
 'nmms':/National Means Cum Merit/i,'sc-topclass':/Top Class Education For SC/i,'st-topclass':/Higher Education Of ST/i
};
const additions=[];let merged=0,duplicates=0;
for(const row of snapshot.records){
 if(row.state && !approved.has(row.state))continue;
 if(!row.department || !row.source || !row.name)throw new Error('Incomplete source record');
 // Existing state umbrella cards already include these categories. Do not inflate counts.
 if(row.state==='Haryana' && /Post Matric/i.test(row.name) || row.state==='Maharashtra' && /Post Matric.*OBC/i.test(row.name)){duplicates++;continue;}
 const alias=!row.state && Object.keys(aliases).find(id=>aliases[id].test(row.name));
 const target=alias ? central.find(s=>s.id===alias) : [...states,...central].find(s=>s.nspId===row.id || s.id===row.id);
 const metadata={nspId:row.id,publishedName:row.publishedName,nspClassification:row.classification,guidelineUrl:row.guidelineUrl,faqUrl:row.faqUrl,
  academicYear:row.academicYear,applicationRoute:row.applicationRoute,opensOn:row.opensOn,deadline:row.deadline,deadlineVerified:!!row.deadline,deadlineSource:row.source,deadlineChecked:row.sourceChecked,
  status:row.status,verificationWindows:row.verificationWindows,sourceChecked:row.sourceChecked,lastChecked:row.sourceChecked};
 if(target){Object.assign(target,metadata);if(!target.applicationAccess || target.applicationUrl?.startsWith('https://scholarships.gov.in/'))Object.assign(target,nspAccess);if(/Ishan Uday/i.test(row.name))target.audience={...target.audience,domicileStates:['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura']};merged++;continue;}
 const type=/Fellowship/i.test(row.name)?'fellowship':/Coaching/i.test(row.name)?'grant':'scholarship';
 const record={id:row.id,...(row.state?{state:row.state}:{}),name:row.name,by:row.department,department:row.department,sector:'students',type,col:'bl',ico:'🎓',amt:'See the programme-specific guideline and current notice',amtNum:0,
  tags:[row.state || 'Central','Students','Official source','Rules need review',...(/Disabil|Abled|Divyang/i.test(row.name)?['Disability']:[]),...(/Girl/i.test(row.name)?['For Girls']:[])],
  source:row.source,...nspAccess,sourceVerification:'official-reference-checked',verificationScope:'NSP listing, department, published student window and guideline/FAQ links checked. Linked full rules have not been reviewed.',
  eligibilityVerification:'pending',matchingEnabled:false,accessNote:'NSP public catalogue readable. Applicant login, submission and benefit receipt not tested.',evidenceSummary:'Programme listed in the NSP public '+row.classification+' catalogue for '+row.academicYear+'. Student and officer verification dates are stored separately.',beneficiaryVerification:'not-independently-verified',documentsNote:'Read the exact programme guideline and current-cycle notification; documents are not inferred.',...metadata};
 if(/Jammu Kashmir And Ladakh/i.test(row.name))record.audience={domicileStates:['Jammu and Kashmir','Ladakh']};
 if(/Students Of NER|Ishan Uday/i.test(row.name))record.audience={domicileStates:['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura']};
 additions.push(record);(row.state?states:central).push(record);
}
fs.writeFileSync(stateFile,JSON.stringify(states,null,2)+'\n');fs.writeFileSync(centralFile,JSON.stringify(central,null,2)+'\n');
console.log(JSON.stringify({sourceListings:snapshot.records.length,added:additions.length,updated:merged,overlappingStateListingsSkipped:duplicates,stateListings:states.length,centralListings:central.length}));
