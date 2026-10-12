/**
 * SCHEME FINDER BACKEND — AI Chat Reply
 *
 * Same facts-first boundary as aiExplain.service.js: this module never
 * invents scheme data. It hands the LLM (a) a compact summary of the real
 * scheme catalog and (b) — if a profile was given — the student's actual
 * computed eligible list from eligibilityEngine.js, then asks it to answer
 * the student's specific question using ONLY those facts. If the AI is
 * unavailable, callers get a deterministic fallback string, never a made-up
 * answer.
 *
 * This replaces (for callers that use it — see frontend/src/js/chat.js)
 * the old client-side keyword-priority regex chain, which had no way to
 * disambiguate a query that named a scheme just for context (e.g. "income
 * certificate for NSP") from one actually asking about that scheme.
 */

const { ALL_SCHEMES } = require('../data/catalog');
const SourcePolicy = require('../data/shared')('source-policy');
const Catalog = require('../data/shared')('scheme-catalog');
const ProgrammeRules = require('../data/shared')('programme-rules');
const { scoreAllSchemes } = require('./eligibilityEngine');
const { chatComplete, aiEnabled } = require('./openrouter.client');
const SYSTEM_PROMPT = `You are SchemeMatch, helping Indian students discover official programmes.
Use only supplied facts. Relevant listings are not confirmed eligibility. Information-only records cannot establish selection or awards.
For personalised scheme recommendations or deadlines, use only recommendationsForThisStudent. Do not recommend a programme outside that list or with a zero profile match. The complete schemes list is for explicit information questions about a named programme. Missing eligibility answers do not establish eligibility.
Do not invent application steps, certificates, amounts, exam patterns, score weights or compatible combinations.
Quote a deadline only with its academic year, application route and official evidence. Renewal windows do not prove fresh registration is open.
Link the exact programme source or applicationUrl in facts. Never substitute an NSP link for a state programme or claim submission works.
For application requests, use only applicationActions links with their supplied labels. A registration form and an application login are different. When there are no application links, explain applicationNote; never present source or portal as an application form. Individual authenticated forms cannot be opened without the applicant signing in.
If applicationActions.search is supplied, you may offer it as a web search using its exact label. It is not a confirmed form, and search results are not verified application links.
Ask for missing facts only if needed for a reviewed condition. Where rules are incomplete, state this and refer to the official source.
For topics outside these facts, say the verified information is unavailable. Keep answers concise in plain Markdown.`;

function buildSchemeFacts() {
  return ALL_SCHEMES.map(s => ({ name: s.name, by: s.by, amt: s.amt, tags: s.tags, portal: s.portal,
    state: s.state, source: s.source, applicationUrl: s.applicationUrl, deadline: s.deadlineVerified ? s.deadline : null, academicYear: s.academicYear, applicationRoute: s.applicationRoute, status: s.status, matchingEnabled: s.matchingEnabled,
    registrationUrl:s.registrationUrl,applicationAccess:s.applicationAccess,applicationNote:s.applicationNote,applicationActions:SourcePolicy.applicationActions(s),
    verificationScope: s.verificationScope, accessNote: s.accessNote }));
}

function buildEligibleFacts(profile) {
  if (!profile || !profile.cat || !profile.edu || !profile.inc) return null;
  const scored = scoreAllSchemes(ALL_SCHEMES, profile);
  return scored
    .filter(s => s.eligible)
    .sort((a, b) => b.score - a.score)
    .map(s => ({ name: s.name, amt: s.amt, matchScore: s.score, reasons: s.reasons }));
}

function buildRecommendationFacts(profile) {
  if (!profile || !profile.cat || !profile.edu || !profile.inc) return null;
  return ProgrammeRules.rank(Catalog.forProfile(profile),profile,{excludeFailed:true})
    .filter(row=>row.profileMatch.percent>0)
    .map(({s,profileMatch})=>({name:s.name,matchPercent:profileMatch.percent,state:s.state,
      deadline:s.deadlineVerified?s.deadline:null,academicYear:s.academicYear,applicationRoute:s.applicationRoute,
      status:s.status,applicationActions:SourcePolicy.applicationActions(s)}));
}

const FALLBACK_REPLY = "I can't reach the AI assistant right now. Try the Eligibility Checker for a full breakdown, or ask about a specific scheme by name.";

function fallbackReply() {
  return { reply: FALLBACK_REPLY, aiGenerated: false };
}

/**
 * @param {string} message - the student's chat message
 * @param {object} [profile] - optional UserProfile (cat/edu/inc/... )
 * @returns {Promise<{reply: string, aiGenerated: boolean}>}
 */
async function generateChatReply(message, profile) {
  if (!message || !message.trim()) return fallbackReply();
  if (!aiEnabled()) return fallbackReply();

  const facts = {
    schemes: buildSchemeFacts(),
    eligibleForThisStudent: buildEligibleFacts(profile),
    recommendationsForThisStudent: buildRecommendationFacts(profile),
  };

  // The frontend gives up on this endpoint at 6s (chat.js's getReply()) and
  // falls back to its own local reply() — give the server a shorter budget
  // than that so it returns ITS graceful fallbackReply() first, rather than
  // both sides independently timing out on the 15s client default.
  const raw = await chatComplete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ facts, message: message.trim() }) },
    ],
    { temperature: 0.3, maxTokens: 450, timeoutMs: 5000 }
  );

  if (!raw || !raw.trim()) return fallbackReply();
  return { reply: raw.trim(), aiGenerated: true };
}

module.exports = { generateChatReply, buildSchemeFacts, buildEligibleFacts, buildRecommendationFacts, FALLBACK_REPLY };
