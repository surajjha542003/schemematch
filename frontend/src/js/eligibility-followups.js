// Follow-ups are separate from the initial form: one unresolved necessary
// check per relevant programme, with an editable summary of previous answers.
function invalidateEligibilityDetails(previous, next) {
  const details = ReviewedConditions.sanitizeDetails(previous.eligibilityDetails);
  if (previous.inc !== next.inc) delete details.annualIncomeRupees;
  if (previous.state !== next.state) delete details.domicileState;
  if(previous.disability!==next.disability)delete details.disabilityPercent;
  if (previous.edu !== next.edu || previous.stream !== next.stream) {
    ['tnCourseRoute','institutionType','governmentQuota','firstDiploma','attendancePercent','matricPassed','regularDegree','recognisedInstitution','annualExamPercent','courseYear','aicteApproved','regularTechnical','admissionEntry','dualDegree','csssCourse','promoted','studyGapYears',...Object.keys(details).filter(k=>/_route$|_award$/.test(k))].forEach(k => delete details[k]);
  }
  return details;
}

function renderEligibilityFollowups(profile) {
  const container = document.getElementById('elig-followups');
  if (!container) return;
  const review = ReviewedConditions.review(SCHEMES, profile);
  const details = ReviewedConditions.sanitizeDetails(profile.eligibilityDetails);
  const wasOpen=Boolean(container.querySelector('.elig-refine')?.open);
  container.replaceChildren();
  container.classList.toggle('hidden', review.candidates.length === 0 && !Object.keys(details).length);
  if (!review.candidates.length && !Object.keys(details).length) return;
  const append = (parent, tag, text, className) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    parent.appendChild(el);
    return el;
  };
  const sourceLink = (parent, source) => {
    try {
      const url = new URL(source);
      if (url.protocol !== 'https:') return;
      const a = append(parent, 'a', 'Official conditions ↗');
      a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:var(--bl);font-size:12px';
    } catch(e) {}
  };
  const refine=append(container,'details','','elig-refine');
  refine.open=wasOpen;
  append(refine,'summary',review.questions.length?'Fine-tune eligibility · '+review.questions.length+' optional answers':'Review your eligibility answers');
  const note = append(refine, 'p', 'Your matches use your saved profile. These extra answers help check programme-specific requirements. Answer only what you know.');
  note.style.cssText = 'font-size:12px;color:var(--t3);line-height:1.6';
  const labels = {
    'more-information-needed': 'More information needed',
    'meets-reviewed-conditions': 'Listed conditions met',
    'fails-reviewed-condition': 'Does not meet a reviewed condition',
    'needs-source-review': 'Further source review needed',
  };
  const evidence=append(refine,'details','','elig-evidence');
  append(evidence,'summary','Checks & sources');
  review.candidates.forEach(candidate => {
    const card = append(evidence, 'div');
    card.style.cssText = 'margin:12px 0;padding:12px;border:1px solid var(--b1);border-radius:8px';
    append(card, 'strong', candidate.name);
    const status = append(card, 'p', candidate.eligible?'Published screening conditions met':labels[candidate.status]);
    status.style.cssText = 'font-size:12px;margin:6px 0;color:var(--gd)';
    candidate.reasons.forEach(reason => append(card, 'p', reason).style.cssText = 'font-size:12px;color:var(--t2)');
    const scope = append(card, 'details');
    append(scope, 'summary', 'What was checked');
    append(scope, 'p', candidate.reviewNote);
    scope.style.cssText = 'font-size:12px;color:var(--t3);line-height:1.6;margin:6px 0';
    sourceLink(scope, candidate.source);
    append(scope, 'small', ' · Conditions checked ' + candidate.checkedOn);
  });
  const form = append(refine, 'form');
  form.addEventListener('submit', event => { event.preventDefault(); applyEligibilityFollowups(form); });
  const createField = (parent, key, value, question) => {
    const spec = ReviewedConditions.fields[key];
    const wrap = append(parent, 'div', '', 'fg');
    wrap.style.marginBottom = '12px';
    const label = append(wrap, 'label', spec.label);
    const id = 'elig-detail-' + key;
    label.htmlFor = id;
    let input;
    if (spec.options) {
      input = append(wrap, 'select');
      input.add(new Option('Not sure / leave unanswered', ''));
      spec.options.forEach(([v,text]) => input.add(new Option(text,v)));
    } else {
      input = append(wrap, 'input');
      input.type = 'number'; input.min = spec.min; input.max = spec.max;
      input.step = spec.integer ? '1' : 'any'; input.inputMode = spec.integer ? 'numeric' : 'decimal';
    }
    input.id = id; input.dataset.detailKey = key; input.value = value || '';
    if (question) {
      question.schemes.forEach(s => {
        const why = append(wrap, 'p', s.reason);
        why.style.cssText = 'font-size:12px;line-height:1.6;color:var(--t3);margin:6px 0';
        const reference=append(wrap,'details','','elig-evidence');
        append(reference,'summary','Why this question?');
        sourceLink(reference, s.source);
      });
    }
  };
  review.questions.forEach(q => createField(form, q.key, '', q));
  const pendingKeys = new Set(review.questions.map(q => q.key));
  const usedKeys = new Set(review.candidates.flatMap(c => c.usedFields));
  if (!review.candidates.length) Object.keys(details).forEach(k => usedKeys.add(k));
  // Domicile also controls relevance, so keep it editable when it is known.
  if (details.domicileState) usedKeys.add('domicileState');
  const answeredKeys = [...usedKeys].filter(k => !pendingKeys.has(k) && ReviewedConditions.validValue(k, ReviewedConditions.fields[k].profileField ? profile[k] : details[k]));
  if (answeredKeys.length) {
    const edit = append(form, 'details');
    append(edit, 'summary', 'Review or edit your additional answers');
    edit.style.cssText = 'margin:14px 0;font-size:13px';
    answeredKeys.forEach(k => createField(edit, k, ReviewedConditions.fields[k].profileField ? profile[k] : details[k]));
  }
  if (review.questions.length || answeredKeys.length) {
    const button = append(form, 'button', review.questions.length ? 'Use these answers and re-check →' : 'Save changes and re-check →', 'ebtn');
    button.type = 'submit';
    button.style.cssText = 'max-width:100%;white-space:normal;margin-top:8px';
    const optional = append(form, 'p', 'You can leave an answer unknown. We will keep that check unresolved. Do not enter certificate numbers, Aadhaar or bank details.');
    optional.style.cssText = 'font-size:12px;color:var(--t3);line-height:1.6';
  }
}

async function applyEligibilityFollowups(form) {
  const details = ReviewedConditions.sanitizeDetails(U.eligibilityDetails);
  const changes = [];
  for (const input of form.querySelectorAll('[data-detail-key]')) {
    const key = input.dataset.detailKey;
    const value = input.value.trim();
    input.setCustomValidity('');
    if (input.validity.badInput || (value && !ReviewedConditions.validValue(key, value))) {
      input.setCustomValidity('Enter a valid answer within the stated range.');
      for(let parent=input.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
      input.reportValidity();
      return false;
    }
    changes.push([key,value]);
  }
  for (const [key,value] of changes) {
    if (ReviewedConditions.fields[key].profileField) {
      U[key] = value;
      const input = document.getElementById(NL_FIELD_MAP[key]);
      if (input) input.value = value;
    } else if (value) details[key] = value;
    else delete details[key];
  }
  U.eligibilityDetails = details;
  saveProfileLocal();
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try { await runElig(); } finally { if (button?.isConnected) button.disabled = false; }
  return true;
}
window.renderEligibilityFollowups = renderEligibilityFollowups;
window.applyEligibilityFollowups = applyEligibilityFollowups;
