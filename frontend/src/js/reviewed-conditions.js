/* Shared by the browser and Node. These are source-backed necessary checks,
 * not a complete eligibility decision or a prediction of scholarship selection. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ReviewedConditions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','J&K','Ladakh'];
  const fields = {
    cat: {label:'Which category will you claim in this application?',options:['General','SC','ST','OBC','BC','MBC','DNC','EBC','Minority','Minority (Muslim)','Minority (Christian)','Minority (Buddhist)','Minority (Jain)','Minority (Sikh)'].map(v=>[v,v]),profileField:true},
    gender: {label:'What is your gender?',options:[['Female','Female'],['Male','Male'],['Other','Other']],profileField:true},
    disability: {label:'Do you have a disability recognised by a competent-authority certificate?',options:[['Yes','Yes'],['No','No']],profileField:true},
    courseYear: {label:'Which year of your current course are you studying?',type:'number',min:1,max:6,integer:true},
    aicteApproved: {label:'Are both your technical course and institution AICTE approved for this academic year?',options:[['Yes','Yes, confirmed by my institution'],['No','No']]},
    regularTechnical: {label:'Is this a regular technical degree/diploma course?',options:[['Yes','Yes'],['No','No']]},
    dualDegree: {label:'Are you enrolled in a dual-degree course?',options:[['Yes','Yes'],['No','No']]},
    admissionEntry: {label:'How did you enter your current course?',options:[['first','First-year admission'],['lateral','Second-year lateral entry'],['other','Another route']]},
    studyGapYears: {label:'How many years were between your qualifying examination and admission?',type:'number',min:0,max:50,integer:true},
    otherFinancialAssistance: {label:'Are you receiving another scholarship, salary, stipend or financial assistance during this course?',options:[['Yes','Yes'],['No','No']]},
    disabilityPercent: {label:'What disability percentage is stated on your competent-authority certificate?',type:'number',min:0,max:100},
    pragatiGirls: {label:'Including you, how many girls in your family are applying for or receiving Pragati?',type:'number',min:1,max:20,integer:true},
    promoted: {label:'Have you passed and been promoted to the next year without dropping out?',options:[['Yes','Yes'],['No','No']]},
    csssCourse: {label:'Which CSSS course branch describes your degree?',options:[['general','General undergraduate degree'],['technical','BTech / BEngg'],['professional-5','Five-year professional / integrated degree'],['pg','Postgraduate degree'],['other','Another course']]},
    csssAward: {label:'Were you previously awarded CSSS (rather than only applying)?',options:[['Yes','Yes'],['No','No']]},
    csssTenure: {label:'Including this year, how many years of CSSS support would you receive?',type:'number',min:1,max:10,integer:true},
    csssConduct: {label:'Has your institution confirmed no disqualifying disciplinary, criminal or ragging complaint?',options:[['Yes','Yes'],['No','No']]},
    csssAishe: {label:'Is your current institution/course listed with a valid active AISHE code (including after any institution change)?',options:[['Yes','Yes, confirmed'],['No','No']]},
    csssFreshCohort: {label:'Did you finish Class XII last academic year and join first-year graduation without a gap?',options:[['Yes','Yes'],['No','No']]},
    swanathFamily: {label:'Which Swanath family circumstance applies to you?',options:[['orphan','Orphan'],['covid','Either/both parents died due to COVID-19'],['martyr','Ward of Armed Forces / central paramilitary personnel martyred in action'],['medical','Parent with critical illness, or death / severe disability in an accident'],['none','None of these']]},
    overseasCountry: {label:'Which country is your overseas admission in?',options:['USA','UK','Australia','Canada','Singapore','Germany','New Zealand','Japan','France','South Korea','Other'].map(v=>[v,v])},
    graduationPercent: {label:'What percentage did you obtain in graduation?',type:'number',min:0,max:100},
    overseasSingleChild: {label:'Are you the only child in your family using this overseas scholarship?',options:[['Yes','Yes'],['No','No']]},
    overseasAdmissionVisa: {label:'Do you have the required COE / I-20 and visa?',options:[['Yes','Yes'],['No','No']]},
    applicationRoute: { label: 'Is this a fresh CSSS application or renewal of an existing CSSS award?', options: [['fresh','Fresh application'],['renewal','Renewal of an existing CSSS award']] },
    regularDegree: { label: 'Are you enrolled in a regular degree course (not distance, correspondence or diploma)?', options: [['Yes','Yes'],['No','No']] },
    recognisedInstitution: { label: 'Is your course/institution recognised by the relevant regulatory body?', options: [['Yes','Yes'],['No','No']] },
    otherScholarship: { label: 'Are you receiving another merit/state scholarship, fee waiver or reimbursement?', options: [['Yes','Yes'],['No','No']] },
    boardAbove80Percentile: { label: 'Does your Class XII board/stream cutoff confirm you are above its 80th percentile? (80% marks alone does not confirm this.)', options: [['Yes','Yes, confirmed against the board cutoff'],['No','No']] },
    annualExamPercent: { label: 'What percentage did you obtain in the annual examination for renewal?', type: 'number', min: 0, max: 100 },
    domicileState: { label: 'Which state is your officially recognised domicile?', options: STATES.map(s => [s,s]) },
    annualIncomeRupees: { label: 'Annual family income from all sources (in rupees)', type: 'number', min: 0, max: 1000000000, integer: true },
    institutionType: { label: 'What type of institution are you enrolled in?', options: [['government','Government'],['aided','Government aided'],['self-financed','Self-financing / private'],['other','Other institution type']] },
    attendancePercent: { label: 'What attendance percentage does your institution report for the scholarship?', type: 'number', min: 0, max: 100 },
    tnCourseRoute: { label: 'Which published Tamil Nadu course branch describes your course?', options: [['general-3','Three-year general UG degree'],['polytechnic-3','Three-year polytechnic diploma'],['professional-4','Four-year professional UG course'],['other','Another course / duration']] },
    governmentQuota: { label: 'Were you admitted under the government quota?', options: [['Yes','Yes'],['No','No']] },
    firstDiploma: { label: 'Are you the first graduate or diploma holder in your family?', options: [['Yes','Yes'],['No','No']] },
    firstGrad: { label: 'Are you the first graduate in your family?', options: [['Yes','Yes'],['No','No']], profileField: true },
    matricPassed: { label: 'Have you passed SSC / matriculation or its recognised equivalent?', options: [['Yes','Yes'],['No','No']] },
  };
  ['aicte-pragati','aicte-pragati-diploma','aicte-saksham','aicte-saksham-diploma','aicte-swanath-degree','aicte-swanath-diploma'].forEach(id=>{
    fields[id+'_route']={label:'For '+id.replace('aicte-','').replaceAll('-',' ')+', is this a fresh application or renewal?',options:[['fresh','Fresh application'],['renewal','Renewal']]};
    fields[id+'_award']={label:'Were you awarded '+id.replace('aicte-','').replaceAll('-',' ')+' previously?',options:[['Yes','Yes'],['No','No']]};
  });
  function validValue(key, value) {
    const field = fields[key];
    if (!field || value === undefined || value === null || value === '') return false;
    if (field.options) return field.options.some(([v]) => v === value);
    const clean = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(clean)) return false;
    const n = Number(clean);
    return Number.isFinite(n) && n >= field.min && n <= field.max && (!field.integer || Number.isInteger(n));
  }
  function sanitizeDetails(details) {
    if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
    return Object.fromEntries(Object.keys(fields).filter(k => !fields[k].profileField && validValue(k, details[k])).map(k => [k, String(details[k])]));
  }
  function read(profile, key) {
    return fields[key]?.profileField ? profile[key] : profile.eligibilityDetails?.[key];
  }
  // Overlapping boundary brackets need an exact answer; a wholly qualifying
  // or wholly excluded bracket does not justify another income question.
  const INCOME_BOUNDS = { under1: [0,99999], '1to2.5': [100000,250000], '2.5to4.5': [250000,450000], '4.5to8': [450000,800000], above8: [800001,Infinity] };
  function incomeOutcome(profile, max) {
    const exact = read(profile, 'annualIncomeRupees');
    if (validValue('annualIncomeRupees', exact)) return Number(exact) <= max ? 'pass' : 'fail';
    const bounds = INCOME_BOUNDS[profile.inc];
    if (!bounds) return 'unknown';
    if (bounds[1] <= max) return 'pass';
    if (bounds[0] > max) return 'fail';
    return 'unknown';
  }
  function evaluate(scheme, profile) {
    const rule = scheme.reviewedConditions;
    if (!rule || !profile) return null;
    const details = sanitizeDetails(profile.eligibilityDetails);
    const p = { ...profile, eligibilityDetails: details };
    const contextState = details.domicileState || p.state;
    if ((scheme.state && contextState !== scheme.state) || (!rule.categories.includes('*') && !rule.categories.includes(p.cat)) || !rule.education.includes(p.edu)) return null;
    const checked = [], missing = [], failed = [], manual = [], checkResults = [];
    const checkCounts={passed:1,failed:0,unknown:0,manual:0}; // The supported education gate passed above.
    if(!rule.categories.includes('*'))checkCounts.passed++;
    if(scheme.id==='central-sector' && scheme.matchingEnabled===true){
      const branch=details.csssCourse;
      if((branch==='pg' && p.edu!=='pg') || (branch==='technical' && p.edu!=='ug-tech') || (branch==='general' && p.edu!=='ug-arts') || (p.edu==='pg' && branch && branch!=='pg'))manual.push('Your course branch and education level disagree. Edit your answers.');
      if(details.applicationRoute==='fresh' && p.edu==='pg')failed.push('A fresh CSSS application starts in first-year graduation, not postgraduate study.');
      if(details.csssTenure && details.courseYear && Number(details.csssTenure)<Number(details.courseYear))manual.push('Your CSSS support year and course year disagree. Check the tenure answers.');
      if(branch==='pg' && details.csssTenure && details.courseYear && Number(details.csssTenure)<Number(details.courseYear)+3)manual.push('Postgraduate renewal follows undergraduate support. Check the total years of CSSS support.');
      if(details.applicationRoute==='fresh' && details.csssTenure && Number(details.csssTenure)!==1)manual.push('A fresh application starts with the first year of CSSS support. Edit your tenure answer.');
      if(details.applicationRoute==='renewal' && branch && branch!=='pg' && details.courseYear==='1')failed.push('Undergraduate renewal requires an earlier course year and CSSS award.');
    }
    const courseRoute = read(p, 'tnCourseRoute');
    if (rule.routeEducation?.[courseRoute] && !rule.routeEducation[courseRoute].includes(p.edu)) {
      manual.push('Your education level and selected course branch disagree. Edit them before checking this branch.');
    }
    checkCounts.failed+=failed.length;
    checkCounts.manual+=manual.length;
    for (const check of rule.checks) {
      if (check.when && !Object.entries(check.when).every(([key, values]) => values.includes(read(p, key)))) continue;
      if (!fields[check.field]) { manual.push('A published condition cannot be evaluated.'); checkCounts.manual++; continue; }
      checked.push(check.field);
      const value = read(p, check.field);
      let outcome = 'unknown';
      if (check.op === 'incomeMax') outcome = incomeOutcome(p, check.max);
      else if (validValue(check.field, value)) {
        if (check.op === 'oneOf') outcome = check.values.includes(value) ? 'pass' : 'fail';
        if (check.op === 'minimum') outcome = Number(value) >= check.min ? 'pass' : 'fail';
        if (check.op === 'maximum') outcome = Number(value) <= check.max ? 'pass' : 'fail';
        if (check.op === 'route') outcome = check.values.includes(value) ? 'pass' : 'manual';
      }
      if (outcome === 'fail') failed.push(check.reason);
      if (outcome === 'manual') manual.push(check.manualNote || 'This course branch needs further source review.');
      if (outcome === 'unknown') missing.push({ key: check.field, reason: check.reason, source: check.source || rule.source });
      checkResults.push({field:check.field,outcome,reason:check.reason,source:check.source || rule.source});
      checkCounts[outcome==='pass'?'passed':outcome==='fail'?'failed':outcome==='manual'?'manual':'unknown']++;
    }
    // Known exclusion takes priority: do not ask for details that cannot
    // change it. Ask one unresolved check per candidate, then reassess.
    const questions = failed.length || manual.length ? [] : missing.slice(0,1);
    return {
      id: scheme.id, name: scheme.name, state: scheme.state, source: rule.source,
      status: failed.length ? 'fails-reviewed-condition' : manual.length ? 'needs-source-review' : missing.length ? 'more-information-needed' : 'meets-reviewed-conditions',
      eligible: scheme.matchingEnabled===true && rule.complete===true && !failed.length && !manual.length && !missing.length, reasons: failed.length ? failed : manual,
      questions, usedFields: [...new Set(checked)], checkedOn: rule.checkedOn,
      checkCounts, checkResults, rulesComplete:rule.complete===true,
      reviewNote: rule.reviewNote,
    };
  }
  function review(schemes, profile) {
    const candidates = schemes.map(s => evaluate(s,profile)).filter(Boolean);
    const byKey = new Map();
    candidates.forEach(c => c.questions.forEach(q => {
      if (!byKey.has(q.key)) byKey.set(q.key, { ...q, schemes: [] });
      byKey.get(q.key).schemes.push({ id: c.id, name: c.name, reason: q.reason, source: q.source });
    }));
    return { candidates, questions: [...byKey.values()] };
  }
  function finishScore(result) {
    // Legacy rules already say these facts need confirmation. Preserve those
    // warnings as unresolved gates instead of turning them into full matches.
    const unresolved = (result.reasons || []).filter(reason => /^[ℹ⚠]/u.test(reason) &&
      /confirm(?: your)? (?:exact income|institute)|confirm.*(?:status|occupation)|enter marks to verify|only for students who studied/i.test(reason));
    const blocks = [...new Set([...(result.blocks || []), ...unresolved.map(r => r.replace(/^[ℹ⚠]\s*/u,''))])];
    return { ...result, blocks, eligible: blocks.length === 0 && result.score >= 30 };
  }
  return { fields, validValue, sanitizeDetails, evaluate, review, incomeOutcome, finishScore };
});
