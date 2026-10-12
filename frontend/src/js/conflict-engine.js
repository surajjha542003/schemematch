/* ════════════════════════════════════════════════
   Scheme Finder — Conflict-Aware Best-Fit Recommendation Engine
   Stage 1.5 · Tamil Nadu Scheme Matcher

   Problem this solves: eligibility scoring alone produces a flat
   list of "everything you technically qualify for." Several of
   those schemes cover the SAME benefit (e.g. two fee-reimbursement
   schemes for the same tuition fee) and cannot legally be claimed
   together. This engine turns the flat eligible-list into either:
     (a) a single best-fit scheme, or
     (b) the highest-value VALID combination of schemes that don't
         conflict with each other.

   Conflict model (see tn-schemes.js header for the real-world basis):
     - exclusiveGroup: at most ONE scheme per group may be selected
       (schemes competing for the same benefit/purpose).
     - conflictsWith:  explicit pairwise overrides for special cases
       that cross group boundaries.
   ════════════════════════════════════════════════ */

// Build a same-length conflict bitmask array for a list of scored schemes.
// schemes[i].conflictBit = bitmask of OTHER indices it conflicts with.
function buildConflictMasks(schemes){
  const n = schemes.length;
  const masks = new Array(n).fill(0);
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      if(i===j) continue;
      const a=schemes[i], b=schemes[j];
      const sameGroup = a.exclusiveGroup && b.exclusiveGroup && a.exclusiveGroup===b.exclusiveGroup;
      const explicitConflict = (a.conflictsWith&&a.conflictsWith.includes(b.id)) || (b.conflictsWith&&b.conflictsWith.includes(a.id));
      if(sameGroup||explicitConflict){ masks[i] |= (1<<j); }
    }
  }
  return masks;
}

// Exact max-weight independent set via bitmask brute force. Fine for n<=20
// (2^20 ≈ 1M iterations). Falls back to a greedy per-group pick above that.
function maxWeightIndependentSet(schemes, weightOf){
  const n = schemes.length;
  if(n===0) return {chosen:[], total:0};
  if(n>20) return greedyByGroup(schemes, weightOf);

  let bestMask=0, bestTotal=-1;
  const masks = buildConflictMasks(schemes);
  const total = 1<<n;
  for(let mask=0; mask<total; mask++){
    let valid=true, sum=0;
    for(let i=0;i<n;i++){
      if(!(mask&(1<<i))) continue;
      if(mask & masks[i]){ valid=false; break; } // a conflicting item is also selected
      sum += weightOf(schemes[i]);
    }
    if(valid && sum>bestTotal){ bestTotal=sum; bestMask=mask; }
  }
  const chosen=[];
  for(let i=0;i<n;i++) if(bestMask&(1<<i)) chosen.push(schemes[i]);
  return {chosen, total:bestTotal};
}

// Fallback for large lists — pick the highest-value item per exclusiveGroup,
// then drop any that still violate an explicit cross-group conflictsWith.
function greedyByGroup(schemes, weightOf){
  const byGroup = {};
  const ungrouped = [];
  schemes.forEach(s=>{
    if(s.exclusiveGroup){
      if(!byGroup[s.exclusiveGroup] || weightOf(s)>weightOf(byGroup[s.exclusiveGroup])) byGroup[s.exclusiveGroup]=s;
    } else ungrouped.push(s);
  });
  let chosen=[...Object.values(byGroup), ...ungrouped];
  chosen = chosen.filter(s=>!chosen.some(o=>o!==s && s.conflictsWith && s.conflictsWith.includes(o.id) && weightOf(o)>=weightOf(s)));
  return {chosen, total:chosen.reduce((sum,s)=>sum+weightOf(s),0)};
}

/**
 * Compute the conflict-aware Best-Fit recommendation for a user profile.
 * @param {object} u - user profile (same shape used by scheme.eligFn)
 * @param {Array}  schemePool - defaults to TN_SCHEMES
 * @returns {{
 *   eligible: Array,        // fully eligible schemes (score+reasons+blocks attached)
 *   needsVerification: Array, // partially eligible / info-only schemes
 *   bestSingle: object|null,  // highest-value single eligible scheme
 *   bestCombo: Array,          // highest-value VALID (non-conflicting) combination
 *   comboTotalValue: number,
 *   excludedByConflict: Array  // eligible schemes left out of bestCombo, with why
 * }}
 */
function computeBestFit(u, schemePool){
  const pool = schemePool || (typeof TN_SCHEMES!=='undefined' ? TN_SCHEMES : []);
  if(typeof ProgrammeRules!=='undefined' && pool.some(s=>s.matchingEnabled===true && s.reviewedConditions))return ProgrammeRules.matches(pool,u);
  const scored = pool.map(s=>{
    const r = scoreScheme(s,u);
    return {...s, ...r};
  });

  const eligible = scored.filter(s=>s.eligible);
  const needsVerification = scored.filter(s=>!s.eligible && s.score>0);

  const weightOf = s => s.amtNum || 0;

  const {chosen: bestCombo, total: comboTotalValue} = maxWeightIndependentSet(eligible, weightOf);

  const bestSingle = eligible.length
    ? eligible.reduce((best,s)=> (weightOf(s)>weightOf(best) ? s : best), eligible[0])
    : null;

  const comboIds = new Set(bestCombo.map(s=>s.id));
  const excludedByConflict = eligible
    .filter(s=>!comboIds.has(s.id))
    .map(s=>{
      const conflictsWithChosen = bestCombo.find(c =>
        c.exclusiveGroup===s.exclusiveGroup ||
        (s.conflictsWith&&s.conflictsWith.includes(c.id)) ||
        (c.conflictsWith&&c.conflictsWith.includes(s.id))
      );
      return {
        ...s,
        conflictReason: conflictsWithChosen
          ? `Can't be combined with "${conflictsWithChosen.name}" — both cover the same ${s.exclusiveGroup==='tn-fee-reimbursement'?'tuition/fee benefit':s.exclusiveGroup==='tn-welfare-grant'?'welfare grant':s.exclusiveGroup==='central-maintenance-allowance'?'central government maintenance allowance — NSP rules don\'t allow drawing two concurrently':'benefit type'}, and it pays out more.`
          : 'Lower value than the selected combination.'
      };
    });

  return { eligible, needsVerification, bestSingle, bestCombo, comboTotalValue, excludedByConflict };
}
