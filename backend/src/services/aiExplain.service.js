/**
 * SCHEME FINDER BACKEND — AI Explanation Layer
 *
 * IMPORTANT: this module never decides eligibility, ranking, or
 * compatibility. Those come out of eligibilityEngine.js + conflictEngine.js
 * (deterministic, rule-based) BEFORE this file ever runs. This module's only
 * job is to turn that already-decided JSON into a short, readable paragraph
 * for the student — using ONLY the facts it's given. The prompt explicitly
 * forbids adding, removing, or changing any eligibility fact, amount, or
 * rule. If the AI is unavailable or returns something that doesn't look like
 * plain rephrasing, we fall back to a deterministic template built from the
 * same facts, so the feature degrades gracefully rather than breaking.
 */

const { chatComplete, aiEnabled, extractJsonText } = require('./openrouter.client');

const SYSTEM_PROMPT = `You are a phrasing assistant for a government scholarship matching tool.
You will be given a JSON object describing eligibility results that were already computed by a
deterministic rules engine — NOT by you. Your only job is to explain those results in plain,
warm, encouraging English for a student.

STRICT RULES:
- Do NOT decide or imply eligibility for anything not already marked eligible in the input.
- Do NOT invent scheme names, amounts, documents, deadlines, or rules not present in the input.
- Do NOT change any number given to you.
- If the input says information is missing, say so — don't guess.
- Keep it concise: a 2-4 sentence summary, plus short bullet phrases pulled from the given reasons.
- Output strict JSON only, matching this shape:
  {"summary": "string", "whyYouQualify": ["string", ...], "whyOthersWerentSelected": ["string", ...]}`;

function buildTemplateFallback(facts) {
  const { bestCombo, comboTotalValue, excludedByConflict, needsVerification } = facts;
  const names = bestCombo.map(s => s.name).join(' + ') || 'No scheme';
  const summary = bestCombo.length
    ? `The existing catalogue suggests ${names} for review, using an estimated ₹${Number(comboTotalValue || 0).toLocaleString('en-IN')}/year. Confirm current rules, amounts and combination permissions with the official authorities.`
    : `No match is confirmed by the existing checks. Review unresolved criteria and any state-scholarship follow-up questions.`;
  const whyYouQualify = bestCombo.flatMap(s => (s.reasons || []).filter(r => r.startsWith('✓')));
  const whyOthersWerentSelected = [
    ...excludedByConflict.map(s => `${s.name}: ${s.conflictReason}`),
    ...needsVerification.slice(0, 3).map(s => `${s.name}: ${(s.blocks || [])[0] || 'missing information'}`),
  ];
  return { summary, whyYouQualify, whyOthersWerentSelected, aiGenerated: false };
}

/**
 * @param {object} matchResult - { eligible, bestCombo, comboTotalValue, excludedByConflict, needsVerification }
 * @returns {Promise<{summary, whyYouQualify, whyOthersWerentSelected, aiGenerated}>}
 */
async function explainMatch(matchResult) {
  const facts = {
    bestCombo: (matchResult.bestCombo || []).map(s => ({ name: s.name, amt: s.amt, reasons: s.reasons })),
    comboTotalValue: matchResult.comboTotalValue,
    excludedByConflict: (matchResult.excludedByConflict || []).map(s => ({ name: s.name, conflictReason: s.conflictReason })),
    needsVerification: (matchResult.needsVerification || []).map(s => ({ name: s.name, blocks: s.blocks })),
  };

  const fallback = buildTemplateFallback(facts);
  // Pending-only catalogues have no eligibility decision for an AI to phrase.
  if (!facts.bestCombo.length || !aiEnabled()) return fallback;

  // This runs synchronously inside a live /schemes/match request — a
  // student is staring at "Checking against the live matching engine…"
  // while it's in flight. The 15s client default (fine for a background
  // ingestion job) is much too slow here; fail fast to the already-good
  // template fallback above instead of blocking the UI. Caught live: the
  // free OpenRouter model (openrouter.client.js's DEFAULT_MODEL) can hang
  // for the full 15s under load on this prompt.
  const raw = await chatComplete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(facts) },
    ],
    { jsonMode: true, temperature: 0.3, maxTokens: 500, timeoutMs: 4000 }
  );
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(extractJsonText(raw));
    if (typeof parsed.summary !== 'string') return fallback;
    return {
      summary: parsed.summary,
      whyYouQualify: Array.isArray(parsed.whyYouQualify) ? parsed.whyYouQualify : fallback.whyYouQualify,
      whyOthersWerentSelected: Array.isArray(parsed.whyOthersWerentSelected) ? parsed.whyOthersWerentSelected : fallback.whyOthersWerentSelected,
      aiGenerated: true,
    };
  } catch {
    return fallback;
  }
}

module.exports = { explainMatch };
