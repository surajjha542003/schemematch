/* Shared, deterministic screening. Published rates are separate from awards. */
(function(root,factory){
  const api=factory(typeof module==='object' && module.exports?require('./reviewed-conditions'):root.ReviewedConditions);
  if(typeof module==='object' && module.exports)module.exports=api;else root.ProgrammeRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(conditions){
  'use strict';
  function rate(s,p){
    const b=s.benefit;if(!s.benefitVerified || !b)return {amount:0,annual:false,label:s.amt};
    if(b.kind==='annual-fixed')return {amount:b.amount,annual:true,label:'₹'+b.amount.toLocaleString('en-IN')+'/year'};
    if(b.kind==='csss'){
      const d=p?.eligibilityDetails || {},year=Number(d.courseYear),branch=d.csssCourse;
      if(!Number.isInteger(year) || year<1)return {amount:0,annual:true,label:s.amt};
      let amount=0;
      if(branch==='pg' && p.edu==='pg' && year<=2)amount=20000;
      if(branch==='general' && ['ug-arts','ug-tech','ug-medical'].includes(p.edu) && year<=3)amount=12000;
      if(branch==='technical' && p.edu==='ug-tech' && year<=4)amount=year<=3?12000:20000;
      if(branch==='professional-5' && ['ug-arts','ug-tech','ug-medical'].includes(p.edu) && year<=5)amount=year<=3?12000:20000;
      return {amount,annual:true,label:amount?'₹'+amount.toLocaleString('en-IN')+'/year':s.amt};
    }
    return {amount:0,annual:false,label:s.amt};
  }
  function score(s,p){
    const r=conditions.evaluate(s,p),b=rate(s,p);
    if(!r)return {score:0,matchPercent:null,eligible:false,reasons:[],blocks:[],amtNum:0};
    const counts=r.checkCounts,total=Object.values(counts).reduce((sum,n)=>sum+n,0);
    const matchPercent=r.rulesComplete?(r.status==='fails-reviewed-condition'?0:r.eligible?100:Math.min(99,Math.floor(100*counts.passed/total))):null;
    return {score:matchPercent ?? (r.status==='fails-reviewed-condition'?0:50),matchPercent,checkCounts:counts,eligible:r.eligible,
      status:r.status,reasons:r.eligible?['Meets the published screening conditions on your answers']:r.reasons,
      blocks:[...r.reasons,...r.questions.map(q=>conditions.fields[q.key].label)],
      amt:b.label,amtNum:r.eligible && b.annual?b.amount:0,questions:r.questions};
  }
  // Profile relevance is a recommendation heuristic, separate from eligibility.
  // Broad audiences earn less than explicit targets; missing answers are ignored.
  function profileMatch(s,p={}){
    const details=conditions.sanitizeDetails(p.eligibilityDetails),profile={...p,eligibilityDetails:details};
    const rule=s.reviewedConditions,a=s.audience || {},factors=[],exclusions=[];
    const add=(field,label,points,maxPoints)=>factors.push({field,label,points,maxPoints});
    const state=details.domicileState || p.state;
    if(state){
      const target=a.domicileStates || (s.state?[s.state]:null);
      if(target && !target.includes(state))exclusions.push('This programme targets a different domicile/state.');
      add('state',target?'State/domicile audience':'Central / All India',target?25:20,25);
    }
    if(p.edu){
      const title=String(s.name || '');
      const stage=/classes?\s+XI\s*\/\s*XII/i.test(title)?['11-12']:/post[ -]?graduate/i.test(title) && !/under[ -]?graduate/i.test(title)?['pg']:/pre[ -]?matric/i.test(title)?['9-10']:/post[ -]?matric/i.test(title)?['11-12','diploma','ug-arts','ug-tech','ug-medical','pg','phd']:null;
      const target=a.education || rule?.education || stage;
      if(target && !target.includes(p.edu))exclusions.push('Your saved course level is outside the listed audience.');
      add('edu',a.education || rule?.education?'Published course audience':stage?'Programme level from published title':'Student programme; course-specific audience not recorded',a.education || rule?.education?30:stage?25:20,30);
    }
    if(p.cat){
      // Only literal, explicit category names in the catalogue title qualify.
      // EBC and alternative beneficiary routes cannot be inferred from caste.
      const title=String(s.name || ''),named=/\bEBC\b|beneficiaries|children scheme/i.test(title)?[]:[...title.matchAll(/\b(SC|ST|OBC|BC|MBC|DNC)\b/g)].map(m=>m[1]);
      if(named.includes('BC'))named.push('OBC');
      const target=a.categories || rule?.categories || (named.length?named:null),specific=target && !target.includes('*');
      if(specific && !target.includes(p.cat))exclusions.push('Your saved category is outside the listed audience.');
      add('cat',specific?'Published category audience':'Broad category relevance',specific?25:20,25);
    }
    const genders=a.genders || (/\b(girls?|female|women)\b/i.test(s.name || '')?['Female']:null);
    if(genders && p.gender){
      if(!genders.includes(p.gender))exclusions.push('Your saved gender is outside the listed audience.');
      add('gender','Published gender audience',5,5);
    }
    if(p.disability==='No' && /students with disabilities/i.test(s.name || ''))exclusions.push('The programme title targets students with disabilities.');
    const screened=conditions.evaluate(s,profile),seen=new Set(factors.map(f=>f.field));
    if(screened?.status==='fails-reviewed-condition')exclusions.push(...screened.reasons);
    for(const check of screened?.checkResults || []){
      if(check.outcome==='unknown' || seen.has(check.field))continue;
      seen.add(check.field);
      add(check.field,conditions.fields[check.field]?.label || check.field,check.outcome==='pass'?5:0,5);
    }
    const points=factors.reduce((sum,f)=>sum+f.points,0),maxPoints=factors.reduce((sum,f)=>sum+f.maxPoints,0);
    return {percent:exclusions.length?0:maxPoints?Math.round(100*points/maxPoints):null,points,maxPoints,factors,exclusions:[...new Set(exclusions)],kind:'saved-profile-relevance'};
  }
  function rank(pool,p,{excludeFailed=false}={}){
    return pool.map(s=>({s,check:score(s,p),profileMatch:profileMatch(s,p)})).filter(row=>!excludeFailed || (!row.profileMatch.exclusions.length && row.profileMatch.percent!==0)).sort((a,b)=>
      Number(Boolean(a.profileMatch.exclusions.length))-Number(Boolean(b.profileMatch.exclusions.length)) || (b.profileMatch.percent ?? -1)-(a.profileMatch.percent ?? -1) || Number(b.check.eligible)-Number(a.check.eligible) || b.check.amtNum-a.check.amtNum || a.s.name.localeCompare(b.s.name));
  }
  function matchText(s,p){const r=profileMatch(s,p);return r.percent===null?'Complete your profile':r.percent===0?'Outside your profile':r.percent+'% match';}
  function matchExplanation(s,p){
    const r=profileMatch(s,p);
    if(r.percent===null)return 'Save your profile to calculate programme relevance.';
    if(r.exclusions.length)return r.exclusions.join(' ');
    return 'Profile relevance: '+r.points+' / '+r.maxPoints+' weighted points from saved details. '+r.factors.map(f=>f.label+' ('+f.points+'/'+f.maxPoints+')').join('; ')+'. Unanswered applicant details are excluded. Broad audience matches receive less weight than specific published audiences. This is not confirmed eligibility or an award probability.';
  }
  function matches(pool,p){
    const scored=rank(pool.filter(s=>(s.sector || 'students')==='students'),p,{excludeFailed:true}).map(({s,check})=>({...s,...check})),eligible=scored.filter(s=>s.eligible);
    // Unknown coexistence is not permission to add awards. Show one annual rate.
    const bestSingle=eligible.filter(s=>s.amtNum>0).sort((a,b)=>b.amtNum-a.amtNum)[0] || null;
    return {eligible,needsVerification:scored.filter(s=>!s.eligible && s.score>0),bestSingle,bestCombo:bestSingle?[bestSingle]:[],comboTotalValue:bestSingle?.amtNum || 0,
      excludedByConflict:[],comboCompatibility:[]};
  }
  function documents(s,p){
    return (s.documentChecklist || []).filter(doc=>!doc.when || Object.entries(doc.when).every(([key,values])=>values.includes(conditions.fields[key]?.profileField || ['cat','disability'].includes(key)?p[key]:p.eligibilityDetails?.[key])));
  }
  function potential(pool,p){
    const result=matches(pool,p);if(result.bestSingle)return {amount:result.bestSingle.amtNum,label:'Estimate if selected',scheme:result.bestSingle,checked:true};
    const rates=rank(pool,p,{excludeFailed:true}).map(({s,check})=>({s,r:check,b:rate(s,p)})).filter(x=>x.b.annual && x.b.amount>0 && x.r.score>0).sort((a,b)=>b.b.amount-a.b.amount);
    const first=rates[0];return first?{amount:first.b.amount,label:'Published rate · answer checks',scheme:first.s,checked:false}:{amount:0,label:'Choose a scheme to check',scheme:null,checked:false};
  }
  return {rate,score,profileMatch,rank,matchText,matchExplanation,matches,documents,potential};
});
