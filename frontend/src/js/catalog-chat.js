/* Preserve the interactive assistant while sourcing every programme from the shared catalogue. */
function chatCatalogueSelection(query,profile=U){
  const q=String(query || '').toLowerCase();
  const deadlineQuery=/deadline|last date|closing/.test(q);
  const select=pool=>{
    const ranked=ProgrammeRules.rank(pool,profile,{excludeFailed:true}).map(row=>row.s);
    if(!deadlineQuery)return ranked;
    const today=ExamCalendar.today();
    return ranked.filter(s=>s.deadlineVerified && s.deadline>=today && s.status!=='closed').sort((a,b)=>a.deadline.localeCompare(b.deadline));
  };
  const states=[...new Set(SCHEMES.map(s=>s.state).filter(Boolean))].filter(state=>q.includes(state.toLowerCase()));
  const aliases={'central-sector':/csss|central sector|pm.usp/,'aicte-pragati':/pragati/,'aicte-pragati-diploma':/pragati/,'aicte-saksham':/saksham/,'aicte-saksham-diploma':/saksham/,'ishan-uday':/ishan.*uday/,'pm-kisan':/pm.?kisan/,'pmfby':/pmfby|fasal bima/,'pmjay':/pm.?jay|ayushman/};
  const exact=SCHEMES.find(s=>q===s.id || q.includes(s.name.toLowerCase()));
  if(exact)return deadlineQuery?select([exact]):[exact];
  const named=SCHEMES.filter(s=>aliases[s.id]?.test(q));
  if(named.length){const specific=named.filter(s=>!/diploma/.test(q) || /diploma/.test(s.id));return deadlineQuery?select(specific):specific;}
  let data=states.length?SchemeCatalog.balanced(SCHEMES.filter(s=>states.includes(s.state) && (s.sector || 'students')==='students')):/nsp|national scholarship|all india|central programmes/.test(q)?SCHEMES.filter(s=>!s.state && (s.sector || 'students')==='students'):SchemeCatalog.forProfile(profile);
  if(/girls?|female|women/.test(q)){
    if(!states.length && !/nsp|all india|central programmes/.test(q))data=SchemeCatalog.forProfile({...profile,gender:'Female'});
    data=data.filter(s=>/girls?|female|women|pragati|kanya|balika|kishori/i.test([s.name,...(s.tags || [])].join(' ')));
  }
  if(/\bsc\b|\bst\b|minority/.test(q)){
    const terms=[...q.matchAll(/\b(sc|st|minority)\b/g)].map(m=>m[1]);
    data=data.filter(s=>terms.some(term=>new RegExp('\\b'+term+'\\b','i').test([s.name,...(s.tags || [])].join(' '))));
  }
  if(/post.?matric/.test(q))data=data.filter(s=>/post.?matric/i.test(s.name));
  return select(data);
}
function chatProgrammeStatus(s,profile=U){
  const result=typeof ReviewedConditions!=='undefined'?ReviewedConditions.evaluate(s,profile):null;
  const labels={'fails-reviewed-condition':'Condition not met','more-information-needed':'More details needed','needs-source-review':'Rules need review','meets-reviewed-conditions':'Reviewed checks met'};
  return {result,label:result?.eligible?'Published conditions met':result?labels[result.status]:'View requirements'};
}
function chatProgrammeCard(s,{profile=U,steps=false,best=false}={}){
  const {label,result}=chatProgrammeStatus(s,profile);
  const source=officialSchemeUrl(s.source);
  const window=schemeWindowText(s);
  const amount=ProgrammeRules.rate(s,profile).label;
  const matching=ProgrammeRules.score(s,profile),fit=ProgrammeRules.profileMatch(s,profile);
  const checks=result?.reasons || [];
  return `<div class="csc" data-chat-scheme-id="${escapeSchemeText(s.id)}"><div class="csc-h"><div class="csc-name">${escapeSchemeText(s.name)}${best?'<span class="match-best">Best match</span>':''}</div><span class="badge ${fit.percent>=70?'b-gn':'b-gd'}" title="${escapeSchemeText(ProgrammeRules.matchExplanation(s,profile))}">${escapeSchemeText(ProgrammeRules.matchText(s,profile))}</span></div><div class="csc-by">${escapeSchemeText(s.by)} · ${escapeSchemeText(s.state || 'Central / All India')}</div><div class="csc-amt">${escapeSchemeText(amount)}</div>${fit.percent!==null?`<div class="match-progress" role="progressbar" aria-label="Saved-profile relevance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fit.percent}"><span style="width:${fit.percent}%"></span></div>`:''}<div class="chat-programme-note match-status">Profile match · saved details${matching.eligible?' · Published checks met':''}</div><div class="chat-programme-note">${escapeSchemeText(window)}</div>${checks.slice(0,2).map(reason=>`<div class="chat-programme-note">• ${escapeSchemeText(reason)}</div>`).join('')}
  ${steps?`<div class="csc-steps"><div class="csc-step"><div class="csc-sn">1</div><div class="csc-st">Read the programme guideline and confirm the application route and current window.</div></div><div class="csc-step"><div class="csc-sn">2</div><div class="csc-st">Check the exact eligibility and document list in that notice; your profile does not replace certificate verification.</div></div><div class="csc-step"><div class="csc-sn">3</div><div class="csc-st">Use the official portal to register or sign in, complete its form and retain the acknowledgement. SchemeMatch does not submit it for you.</div></div></div>`:''}
  <div class="csc-btns">${schemeApplicationActions(s,"csc-launch")}<button class="csc-bs" data-chat-action="guide" data-scheme-id="${escapeSchemeText(s.id)}">Guide me</button><button class="csc-bs" data-chat-action="conditions" data-scheme-id="${escapeSchemeText(s.id)}">Check eligibility</button><button class="kbtn-track" data-chat-action="track" data-scheme-id="${escapeSchemeText(s.id)}">+ Track</button></div><details class="fsc-details"><summary>Official sources &amp; review details</summary><p>${escapeSchemeText(ProgrammeRules.matchExplanation(s,profile))}</p><p>${escapeSchemeText(s.verificationScope)}</p><p>${escapeSchemeText(s.ruleSourceVersion || '')}</p><div class="chat-programme-note"><a href="${escapeSchemeText(source)}" target="_blank" rel="noopener noreferrer">Official source ↗</a>${s.guidelineUrl?` · <a href="${escapeSchemeText(officialSchemeUrl(s.guidelineUrl))}" target="_blank" rel="noopener noreferrer">Guideline ↗</a>`:''}</div></details></div>`;
}
function renderCatalogueMatches(profile=getSavedApplicantProfile()){
  const ranked=ProgrammeRules.rank(SchemeCatalog.forProfile(profile),profile,{excludeFailed:true}),data=ranked.map(row=>row.s);
  LAST_SHOWN_SCHEMES=data.map(s=>({id:s.id,name:s.name,by:s.by}));
  const summary=[profile.state,formatEdu(profile.edu),profile.cat,formatInc(profile.inc)].filter(Boolean).map(escapeSchemeText).join(' · ');
  return `<div data-profile-matches><strong>Find My Schemes</strong><div class="chat-programme-note">${summary}</div><p>${data.length} programme suggestions, best profile match first. Percentages use saved details; unanswered applicant details do not reduce your match. Use Check eligibility for programme-specific questions.</p>${data.slice(0,6).map((s,i)=>chatProgrammeCard(s,{profile,best:i===0 && ranked[0].profileMatch.percent>0})).join('')}<div class="cqr"><button class="cqb" onclick="goPanel('eligibility')">Edit Eligibility Form</button><button class="cqb" onclick="goPanel('schemes')">Browse all ${data.length} suggestions</button><button class="cqb" onclick="sendQ('Official registration links for schemes')">Registration links</button></div></div>`;
}
function chatConditionQuestion(s,question,intent='conditions'){
  const spec=ReviewedConditions.fields[question.key];if(!spec)return '';
  const input=spec.options?`<select data-chat-detail-key="${escapeSchemeText(question.key)}"><option value="">Not sure</option>${spec.options.map(([v,t])=>`<option value="${escapeSchemeText(v)}">${escapeSchemeText(t)}</option>`).join('')}</select>`:`<input type="number" data-chat-detail-key="${escapeSchemeText(question.key)}" min="${spec.min}" max="${spec.max}" step="${spec.integer?'1':'any'}" placeholder="Enter your answer">`;
  return `<div class="chat-question"><label>${escapeSchemeText(spec.label)}${input}</label><p class="chat-programme-note">${escapeSchemeText(question.reason || 'This answer determines which documents are needed.')}</p><button class="cqb" data-chat-action="answer" data-scheme-id="${escapeSchemeText(s.id)}" data-answer-intent="${intent}">Use my answer →</button></div>`;
}
function renderCatalogueConditionExplanation(query){
  const data=chatCatalogueSelection(query),named=data.length===1?data[0]:data.find(s=>s.reviewedConditions);
  if(!named)return '<strong>Check eligibility</strong><p>Choose a programme from your list to check its requirements.</p><button class="cqb" onclick="goPanel(\'eligibility\')">Eligibility Form</button>';
  const {result,label}=chatProgrammeStatus(named);
  return `<strong>Eligibility check — ${escapeSchemeText(named.name)}</strong><p>${escapeSchemeText(label)}${result?.eligible?' on your answers. Selection follows official certificate verification.':'.'}</p>${result?.reasons?.map(r=>`<p>${escapeSchemeText(r)}</p>`).join('') || ''}${result?.questions?.map(q=>chatConditionQuestion(named,q)).join('') || (result?.eligible?'':`<p class="chat-programme-note">${escapeSchemeText(named.reviewedConditions?.reviewNote || 'Read the programme requirements in Details.')}</p>`)}${chatProgrammeCard(named)}<button class="cqb" onclick="goPanel('eligibility')">Review all my answers</button>`;
}
function renderProfileMatchExplanation(query){
  const profile=getSavedApplicantProfile(),data=chatCatalogueSelection(query,profile);
  const scheme=data.length===1?data[0]:data.find(s=>s.id===LAST_SHOWN_SCHEMES[0]?.id) || data.find(s=>!ProgrammeRules.profileMatch(s,profile).exclusions.length) || data[0];
  if(!scheme)return '<p>Use Find my schemes first to see your profile matches.</p>';
  const fit=ProgrammeRules.profileMatch(scheme,profile);
  return `<strong>Why this profile match?</strong><div class="csc"><div class="csc-name">${escapeSchemeText(scheme.name)}</div><p>${escapeSchemeText(ProgrammeRules.matchText(scheme,profile))} · saved details only</p>${fit.factors.map(f=>`<div class="chat-programme-note">${escapeSchemeText(f.label)} · ${f.points}/${f.maxPoints} points</div>`).join('')}${fit.exclusions.map(reason=>`<p>${escapeSchemeText(reason)}</p>`).join('')}<p>Unanswered details do not reduce this score. Broad programme audiences receive fewer relevance points than specific published audiences. This score is separate from full eligibility and award selection.</p></div>${chatProgrammeCard(scheme,{profile})}`;
}
function renderCatalogueWhatIf(query){
  if(!(U.cat && U.edu && U.inc))return '<strong>What if?</strong><p>Fill your profile first so I can compare the change.</p><button class="cqb" onclick="goPanel(\'eligibility\')">Fill Eligibility Form</button>';
  const changes=typeof localExtractProfile==='function'?localExtractProfile(query):{};
  if(!Object.keys(changes).length)return '<strong>What if?</strong><p>Try “What if my annual family income is ₹3 lakh?” or “What if I study in Telangana?” Hostel allowances require the specific programme notice.</p>';
  const after={...U,...changes,eligibilityDetails:{...U.eligibilityDetails}};
  if(typeof invalidateEligibilityDetails==='function')after.eligibilityDetails=invalidateEligibilityDetails(U,after);
  const before=SchemeCatalog.forProfile(U),next=SchemeCatalog.forProfile(after);
  const review=ReviewedConditions.review(next,after);
  LAST_WHATIF_CHANGES=changes;
  return `<strong>What If: ${describeWhatIfChanges(U,changes).map(escapeSchemeText).join(', ')}?</strong><p>Simulation only — your saved profile is unchanged. ${before.length} → ${next.length} relevant programme suggestions.</p>${review.candidates.map(c=>`<div class="csc"><div class="csc-name">${escapeSchemeText(c.name)}</div><div>${escapeSchemeText(c.status.replaceAll('-',' '))}</div>${c.reasons.map(r=>`<p>${escapeSchemeText(r)}</p>`).join('')}</div>`).join('') || '<p>No reviewed condition covers this change yet; an award cannot be inferred.</p>'}<div class="cqr"><button class="cqb" onclick="applyWhatIfToProfile()">Apply this to my profile</button><button class="cqb" onclick="sendQ('find my schemes')">Back to my actual schemes</button></div>`;
}
function catalogueDocumentGuide(query){
  const income=/income/i.test(query),caste=/caste|community|category/i.test(query);
  const title=income?'How to Get Income Certificate':caste?'How to Get Caste / Category Certificate':'Programme document checklist';
  const state=U.eligibilityDetails?.domicileState || U.state;
  const sources={Telangana:'https://ts.meeseva.telangana.gov.in/', 'Tamil Nadu':'https://www.tnesevai.tn.gov.in/', 'Uttar Pradesh':'https://edistrict.up.gov.in/', Maharashtra:'https://aaplesarkar.mahaonline.gov.in/'};
  const route=sources[state];
  return `<strong>${title}</strong><div class="csc"><div class="csc-steps"><div class="csc-step"><div class="csc-sn">1</div><div class="csc-st">Check the named scholarship’s notice for the certificate type, issuing authority and validity period.</div></div><div class="csc-step"><div class="csc-sn">2</div><div class="csc-st">Use your state’s official citizen-service portal or revenue office. Requirements and processing times vary by state.</div></div><div class="csc-step"><div class="csc-sn">3</div><div class="csc-st">Follow that service’s current document checklist and retain the receipt. Confirm the issued certificate meets your scholarship’s requirements.</div></div></div>${route?`<a class="csc-launch" href="${escapeSchemeText(route)}" target="_blank" rel="noopener noreferrer">${escapeSchemeText(state)} official citizen services ↗</a>`:'<p>Select your state in your profile for its service route.</p>'}</div><div class="cqr"><button class="cqb" onclick="goPanel('profile')">My Profile</button><button class="cqb" onclick="sendQ('Official registration links for schemes')">Scholarship notices</button></div>`;
}
function renderCatalogueExamHelp(query){
  if(typeof ExamCalendar==='undefined')return '<button class="cqb" onclick="goPanel(\'exams\')">Exam Calendar</button>';
  const records=ExamCalendar.filter({query:/jee/i.test(query)?'JEE Main':/neet/i.test(query)?'NEET':/cuet/i.test(query)?'CUET':/gate/i.test(query)?'GATE':/ugc|jrf|\bnet\b/i.test(query)?'UGC NET':'',status:'all'}).slice(0,6);
  return `<strong>Exam information and preparation</strong><p>Use the organiser’s current syllabus and bulletin for the pattern. Work through its published sample or previous papers, practise under timed conditions and review mistakes; chapter weightage is not guaranteed.</p>${records.map(e=>`<div class="csc"><div class="csc-name">${escapeSchemeText(e.name)}</div><p>${e.datesVerified?e.examDates.map(escapeSchemeText).join(' · '):'Next examination dates unconfirmed'}</p><a class="csc-launch" href="${escapeSchemeText(ExamCalendar.officialUrl(e.source))}" target="_blank" rel="noopener noreferrer">Official bulletin / notices ↗</a></div>`).join('')}<button class="cqb" onclick="goPanel('exams')">Open Exam Calendar</button>`;
}
function routeCatalogueChat(query){
  const q=String(query || '').trim();
  if(GUIDED_APP?.catalogue){
    if(/^cancel|^stop|^exit|^find my schemes$/i.test(q)){GUIDED_APP=null;return q.toLowerCase()==='find my schemes'?handleFindMySchemesFlow():'Guidance cancelled. You can start again from any programme card.';}
    if(GUIDED_APP.kind==='documents' && GUIDED_APP.contextKey){const key=GUIDED_APP.contextKey,spec=ReviewedConditions.fields[key];const found=spec.options?.find(([v,label])=>v.toLowerCase()===q.toLowerCase() || label.toLowerCase()===q.toLowerCase());if(found){if(spec.profileField){U[key]=found[0];const el=document.getElementById(NL_FIELD_MAP[key]);if(el)el.value=found[0];}else U.eligibilityDetails={...U.eligibilityDetails,[key]:found[0]};saveProfileLocal();return renderCatalogueGuidedStep();}return renderCatalogueGuidedStep();}
    if(/^(yes|y|done|ready|i have)\b/i.test(q))return answerGuidedStep(true);
    if(/^(no|n|not yet|missing|don.t have)\b/i.test(q))return answerGuidedStep(false);
    return renderCatalogueGuidedStep();
  }
  if(/what if\b/i.test(q))return renderCatalogueWhatIf(q);
  if(/income.*(cert|proof|document)|certificate.*income|how.*(get|make|apply).*income|caste.*cert|community.*cert|category.*cert/i.test(q))return catalogueDocumentGuide(q);
  if(/\bjee\b|\bneet\b|\bcuet\b|ugc.*(net|jrf)|exam dates|exam pattern|syllabus|best books|\bgate\b|\bpyqs?\b/i.test(q))return renderCatalogueExamHelp(q);
  if(/\bpmrf\b|prime minister.?s research/i.test(q))return '<strong>Prime Minister’s Research Fellowship</strong><div class="csc"><div class="csc-name">PMRF guidance</div><p>Start with the Ministry of Education’s official PMRF reference. Ask your research institute to confirm the current guideline, application route and call before preparing an application. The linked Ministry reference is a historical guideline; current deadlines and awards have not been reviewed here.</p><a class="csc-launch" href="https://www.education.gov.in/revised-guidelines-prime-ministers-research-fellows-pmrf-scheme" target="_blank" rel="noopener noreferrer">Ministry of Education reference ↗</a></div><button class="cqb" onclick="goPanel(\'schemes\')">Browse research scholarships</button>';
  if(/(why|how|explain).*(match|score|percent)/i.test(q))return renderProfileMatchExplanation(q);
  if(/(why|how|explain).*(eligible|qualif)|am i eligible for/i.test(q))return renderCatalogueConditionExplanation(q);
  if(/\b(i am|i'm|my name|my income)\b/i.test(q) && typeof localExtractProfile==='function'){
    const facts=localExtractProfile(q);
    if(Object.keys(facts).length){const next={...U,...facts};if(typeof invalidateEligibilityDetails==='function')next.eligibilityDetails=invalidateEligibilityDetails(U,next);Object.assign(U,next);LAST_MATCH=null;profileSet=Boolean(U.cat && U.edu && U.inc);Object.entries(EF_FIELD_MAP).forEach(([id,key])=>{if(key in facts && document.getElementById(id))document.getElementById(id).value=facts[key];});saveProfileLocal();saveFormData();updateUI();updateDashboard();return `<strong>Your profile details</strong><p>I extracted the details you stated. Review them in the Eligibility Form before checking conditions.</p>${renderCatalogueMatches(U)}<button class="cqb" onclick="goPanel('eligibility')">Review filled form</button>`;}
  }
  if(/find.*(my)?.*(scheme|scholarship)|my.*(scheme|scholarship)|scholarship.*for me|what.*(scheme|scholarship).*(can i|eligible)|check.*eligib/i.test(q))return handleFindMySchemesFlow();
  if(/^(hi|hello|hey|namaste|namaskar)\b/i.test(q))return `<strong>Hello${U.name?', '+escapeSchemeText(U.name.split(' ')[0]):''}!</strong><p>Choose a task or ask about a programme.</p><div class="cqr"><button class="cqb" onclick="sendQ('find my schemes')">Find my schemes</button><button class="cqb" onclick="sendQ('Official registration links for schemes')">Registration links</button><button class="cqb" onclick="sendQ('How to get income certificate')">Income certificate</button></div>`;
  if(/thank/i.test(q))return 'You’re welcome! You can track your preparation here and check the programme’s current notice before applying.';
  if(!/scheme|scholarship|pragati|saksham|csss|yasasvi|kisan|pmjay|ayushman|apply|registration|portal|deadline|document|certificate|income|renewal|merit|match|qualify|eligible|bank|aadhaar|pension|benefit/i.test(q))return null;
  const data=chatCatalogueSelection(q);
  if(/guide me|walk me through|step.?by.?step|help me apply/i.test(q) && data.length===1)return startGuidedApplication(data[0].id);
  if(/two scholarship|multiple scholarship|combine|same time/i.test(q))return `<strong>Combining scholarships</strong><p>Check each named programme’s coexistence rules. CSSS excludes another scholarship, fee waiver or reimbursement; other combinations remain unconfirmed.</p>${chatProgrammeCard(SCHEMES.find(s=>s.id==='central-sector'))}`;
  const title=/registration|portal|links|apply/i.test(q)?'Official registration links and application guidance':'Scholarship information';
  return `<strong>${title}</strong><p>${data.length} programme${data.length===1?'':'s'} found. ${data.length?'Use Check eligibility to answer the programme-specific questions.':'No matching official-reference listing is bundled for this request. Broaden your search in All Schemes.'}</p>${data.slice(0,8).map(s=>chatProgrammeCard(s,{steps:/how.*apply|documents|renewal|application steps/i.test(q)})).join('')}<div class="cqr"><button class="cqb" onclick="goPanel('schemes')">Browse schemes</button><button class="cqb" onclick="goPanel('eligibility')">Eligibility Checker</button></div>`;
}
function startCatalogueGuidance(id){
  const sch=SCHEMES.find(s=>s.id===id);if(!sch)return 'Choose a programme from the current catalogue.';
  if(sch.documentChecklist?.length){GUIDED_APP={catalogue:true,kind:'documents',sch,stepIndex:0,documentStatus:{}};return `<strong>Guided Application — ${escapeSchemeText(sch.name)}</strong><p>We’ll prepare one document at a time. Please answer only whether you have it; keep identity and bank numbers on the official portal.</p>${renderCatalogueGuidedStep()}`;}
  GUIDED_APP={catalogue:true,sch,stepIndex:0,completed:[],steps:[{title:'Read the official programme guideline',help:'Use the official source or guideline link below.'},{title:'Confirm the current application window and route',help:schemeWindowText(sch)+'. Check for an official extension if the window ended.'},{title:'Check the exact eligibility and document checklist',help:'Read the notice for this programme and cycle. No universal document list is assumed.'},{title:'Prepare the documents named by the programme',help:'Keep only the documents that the current notice requires. Do not enter Aadhaar or bank details in this chat.'}]};
  return `<strong>Guided Application — ${escapeSchemeText(sch.name)}</strong><p>These are preparation steps, not confirmation of eligibility or submission.</p>${renderCatalogueGuidedStep()}`;
}
function renderCatalogueGuidedStep(){
  const g=GUIDED_APP;if(g.kind==='documents')return renderCatalogueDocumentStep();
  const step=g.steps[g.stepIndex];
  return `<div class="csc"><small>Step ${g.stepIndex+1} of ${g.steps.length}</small><div class="csc-name">${escapeSchemeText(step.title)}</div><p>${escapeSchemeText(step.help)}</p><a href="${escapeSchemeText(officialSchemeUrl(g.sch.guidelineUrl || g.sch.source))}" target="_blank" rel="noopener noreferrer">Official guideline / source ↗</a></div><p>Have you completed this step?</p><div class="cqr"><button class="cqb" onclick="sendQ('yes')">Yes, done</button><button class="cqb" onclick="sendQ('no')">Not yet</button><button class="cqb" onclick="sendQ('cancel')">Cancel guidance</button></div>`;
}
function answerCatalogueGuidance(done){
  const g=GUIDED_APP;
  if(g.kind==='documents')return answerCatalogueDocument(done);
  if(!done)return `<p>Take your time. ${escapeSchemeText(g.steps[g.stepIndex].help)}</p>${renderCatalogueGuidedStep()}`;
  const completed=g.steps[g.stepIndex].title;
  g.completed.push(completed);g.stepIndex++;
  const confirmed=`<div class="guide-confirmation"><span class="guide-check" aria-hidden="true">✓</span><span><strong>${escapeSchemeText(completed)}</strong><span class="guide-confirmation-note">Confirmed by you</span></span></div>`;
  if(g.stepIndex<g.steps.length)return confirmed+renderCatalogueGuidedStep();
  const html=`<strong>Preparation checklist — ${escapeSchemeText(g.sch.name)}</strong><div class="csc">${g.completed.map(s=>`<div class="chat-programme-note">✓ ${escapeSchemeText(s)}</div>`).join('')}<p>Steps marked complete by you. The official portal decides eligibility and submission status.</p>${schemeApplicationActions(g.sch,"csc-launch")}</div><button class="kbtn-track" data-chat-action="track" data-scheme-id="${escapeSchemeText(g.sch.id)}">+ Track application preparation</button>`;
  GUIDED_APP=null;return confirmed+html;
}
function renderCatalogueDocumentStep(){
  const g=GUIDED_APP;
  const read=key=>ReviewedConditions.fields[key]?.profileField?U[key]:U.eligibilityDetails?.[key];
  const conditionalKeys=(g.sch.documentChecklist || []).flatMap(doc=>{
    const entries=Object.entries(doc.when || {});
    return entries.filter(([key])=>ReviewedConditions.fields[key] && !ReviewedConditions.validValue(key,read(key)) && entries.every(([other,values])=>other===key || !ReviewedConditions.validValue(other,read(other)) || values.includes(read(other)))).map(([key])=>key);
  });
  const context=[...(g.sch.checklistContext || []),...conditionalKeys].find(key=>!ReviewedConditions.validValue(key,read(key)));
  g.contextKey=context || null;
  if(context)return chatConditionQuestion(g.sch,{key:context},'guide');
  if(g.sch.id.startsWith('aicte-swanath') && U.eligibilityDetails?.swanathFamily==='medical'){
    GUIDED_APP=null;
    return '<strong>Confirm the medical / accident checklist</strong><p>This branch was added in the May 2025 guideline. Ask your institution for its current evidence checklist before preparing the application.</p>'+chatProgrammeCard(g.sch);
  }
  const docs=ProgrammeRules.documents(g.sch,U);g.documents=docs;
  const doc=docs[g.stepIndex];
  if(!doc){
    const ready=docs.filter(d=>g.documentStatus[d.id]===true),missing=docs.filter(d=>g.documentStatus[d.id]!==true);
    const html=`<strong>Your document checklist — ${escapeSchemeText(g.sch.name)}</strong><div class="csc">${docs.map(d=>`<p class="chat-programme-note">${g.documentStatus[d.id]?'✓ Ready':'○ Still needed'} · ${escapeSchemeText(d.label)}</p>`).join('')}<p>${ready.length} ready · ${missing.length} still needed</p>${g.sch.reviewedConditions?.complete?'':'<p class="chat-programme-note">These are the preparation documents verified so far. The current notice may require additional documents.</p>'}<p class="chat-programme-note">${escapeSchemeText(schemeWindowText(g.sch))}. Check requirements, complete the official form and keep its acknowledgement.</p>${schemeApplicationActions(g.sch,"csc-launch")}</div>`;GUIDED_APP=null;return html;
  }
  return `<div class="csc"><small>Document ${g.stepIndex+1} of ${docs.length}</small><h4 class="csc-name">${escapeSchemeText(doc.label)}</h4><p>Do you already have this document?</p><details class="fsc-details"><summary>How to prepare this document</summary><p>${escapeSchemeText(doc.help)}</p><a href="${escapeSchemeText(officialSchemeUrl(doc.source))}" target="_blank" rel="noopener noreferrer">Official source ↗</a></details></div><p>Do you have this ready?</p><div class="cqr"><button class="cqb" onclick="sendQ('yes')">Yes, I have it</button><button class="cqb" onclick="sendQ('no')">No, help me</button><button class="cqb" onclick="sendQ('cancel')">Cancel guidance</button></div>`;
}
function answerCatalogueDocument(done){
  const g=GUIDED_APP,doc=g.documents[g.stepIndex];g.documentStatus[doc.id]=done;
  if(done){const confirmed=`<div class="guide-confirmation"><span class="guide-check" aria-hidden="true">✓</span><span><strong>${escapeSchemeText(doc.label)}</strong> ready<span class="guide-confirmation-note">Confirmed by you</span></span></div>`;g.stepIndex++;return confirmed+renderCatalogueDocumentStep();}
  return `<div class="csc"><h4 class="csc-name">Get ${escapeSchemeText(doc.label)}</h4><p>${escapeSchemeText(doc.help)}</p><p class="chat-programme-note">I’ve marked this as still needed. You can continue preparing the other documents.</p><a class="csc-launch" href="${escapeSchemeText(officialSchemeUrl(doc.source))}" target="_blank" rel="noopener noreferrer">Open official instructions ↗</a></div><div class="cqr"><button class="cqb" data-chat-action="next-document" data-scheme-id="${escapeSchemeText(g.sch.id)}" data-document-id="${escapeSchemeText(doc.id)}">Next document →</button><button class="cqb" onclick="sendQ('cancel')">Cancel guidance</button></div>`;
}
window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('chatMsgs')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-chat-action]');if(!button)return;
    const s=SCHEMES.find(s=>s.id===button.dataset.schemeId);if(!s)return;
    if(button.dataset.chatAction==='guide')addAI(startGuidedApplication(s.id));
    if(button.dataset.chatAction==='conditions'){addAI(renderCatalogueConditionExplanation(s.id));}
    if(button.dataset.chatAction==='answer'){
      if(button.disabled)return;
      if(button.dataset.answerIntent==='guide' && (!GUIDED_APP || GUIDED_APP.sch.id!==s.id)){button.disabled=true;return;}
      const box=button.closest('.chat-question'),input=box.querySelector('[data-chat-detail-key]'),key=input.dataset.chatDetailKey,value=input.value.trim();
      if(!value){addAI('You can leave this unknown. Return when you know the answer.');return;}
      if(!ReviewedConditions.validValue(key,value)){input.setCustomValidity('Use a valid answer within the stated range.');input.reportValidity();return;}
      if(ReviewedConditions.fields[key].profileField){U[key]=value;const el=document.getElementById(NL_FIELD_MAP[key]);if(el)el.value=value;}else U.eligibilityDetails={...U.eligibilityDetails,[key]:value};
      LAST_MATCH=null;saveProfileLocal();if(typeof pushProfileToBackend==='function')pushProfileToBackend();updateDashboard();
      button.disabled=true;addAI(button.dataset.answerIntent==='guide'?renderCatalogueGuidedStep():renderCatalogueConditionExplanation(s.id));
    }
    if(button.dataset.chatAction==='next-document' && !button.disabled && GUIDED_APP?.kind==='documents' && GUIDED_APP.sch.id===s.id && GUIDED_APP.documents?.[GUIDED_APP.stepIndex]?.id===button.dataset.documentId){button.disabled=true;GUIDED_APP.stepIndex++;addAI(renderCatalogueDocumentStep());}
    if(button.dataset.chatAction==='track'){addToTracker(s.id,s.name,s.by,s.amt,officialSchemeUrl(getSchemeRegistrationUrl(s)),s.deadlineVerified?s.deadline:null);button.textContent='Tracked ✓';}
  });
});
