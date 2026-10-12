function renderExamCalendar(){
  const grid=document.getElementById('examGrid');if(!grid || typeof ExamCalendar==='undefined')return;
  const stateSelect=document.getElementById('exam-state-filter');
  if(!stateSelect.dataset.ready){
    const states=[...new Set(ExamCalendar.records.map(e=>e.state).filter(Boolean))].sort();
    stateSelect.innerHTML='<option value="all">All states + Central</option><option value="central">Central government / National</option>'+states.map(s=>`<option value="${escapeSchemeText(s)}">${escapeSchemeText(s)}</option>`).join('');stateSelect.dataset.ready='true';
  }
  const date=ExamCalendar.today();
  const records=ExamCalendar.filter({state:stateSelect.value,kind:document.getElementById('exam-kind-filter').value,status:document.getElementById('exam-status-filter').value,query:document.getElementById('examSearch').value,date});
  document.getElementById('examCount').textContent=records.length;
  grid.innerHTML=records.length?records.map(e=>{
    const s=ExamCalendar.schedule(e,date);
    const status=s.status==='past'?'Past exam':s.status==='upcoming'?(s.days===0?'Today':`${s.days} days to next exam`):'Next exam date unconfirmed';
    const dates=e.datesVerified?e.examDates.map(d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric'})).join(' · '):'Read the current official notification';
    const registration=e.registrationDeadlineVerified?`Published registration deadline: ${e.registrationDeadline}${e.registrationDeadline<date?' (passed)':''}${e.registrationNote?' · '+e.registrationNote:''}`:'Next registration deadline unconfirmed';
    const source=ExamCalendar.officialUrl(e.source);
    const cycle=e.cycle && !e.name.includes(e.cycle)?' · '+escapeSchemeText(e.cycle):'';
    return `<article class="exam-card" data-exam-id="${escapeSchemeText(e.id)}"><div class="exam-card-top"><span class="badge bbl">${escapeSchemeText(e.state || 'Central / National')}</span><span class="exam-status ${s.status}">${escapeSchemeText(status)}</span></div><h4>${escapeSchemeText(e.name)}${cycle}</h4><p>${escapeSchemeText(e.by)}</p><div class="exam-dates">${escapeSchemeText(dates)}</div><p>${escapeSchemeText(registration)}</p><details><summary>Schedule evidence</summary><p>${escapeSchemeText(e.evidenceSummary)}</p><small>Reference checked ${escapeSchemeText(e.sourceChecked)} · ${escapeSchemeText(e.accessNote)}</small></details>${source?`<a href="${escapeSchemeText(source)}" target="_blank" rel="noopener noreferrer">Official ${e.datesVerified?'schedule':'notices'} ↗</a>`:''}</article>`;
  }).join(''):'<p class="no-schm">No exam references in this filter. Try All schedules or another state.</p>';
}
window.renderExamCalendar=renderExamCalendar;
