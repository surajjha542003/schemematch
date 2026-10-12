/**
 * SCHEME FINDER BACKEND — OpenRouter Client
 *
 * Thin wrapper around OpenRouter's chat-completions API. Used ONLY for
 * phrasing/extraction tasks that never decide eligibility themselves — see
 * aiExplain.service.js and profileParser.service.js for the strict prompts
 * that enforce that boundary. If OPEN_ROUTER (or OPENROUTER_API_KEY) is
 * missing, or a call fails, callers must fall back to deterministic
 * templates — this client returns null instead of throwing so the rest of
 * the app keeps working without AI.
 */

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPEN_ROUTER || process.env.OPENROUTER_API_KEY || '';
// Free-tier model — this account has no paid OpenRouter credits. Verified
// live (2026-09-10) against openrouter.ai/api/v1/models' :free listing:
// this one returns clean, valid JSON for the structured-extraction prompt;
// google/gemma-4-31b-it:free hit a shared-pool 429 and
// nvidia/nemotron-3-super-120b-a12b:free returned malformed JSON in the
// same test. Free models can still rate-limit under load — override via
// OPENROUTER_MODEL if this one starts failing.
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';

function aiEnabled() {
  return Boolean(API_KEY);
}

/**
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} opts - { model, temperature, jsonMode, maxTokens }
 * @returns {Promise<string|null>} raw text content, or null on failure/disabled
 */
async function chatComplete(messages, opts = {}) {
  if (!aiEnabled()) return null;
  const body = {
    model: opts.model || DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens || 700,
    // Default model is a reasoning-capable free model — left on, it spends
    // the whole max_tokens budget narrating chain-of-thought into
    // message.reasoning and never reaches message.content on a real-length
    // prompt (verified: an 8000-char scraped page truncated mid-thought at
    // max_tokens:600 with empty/garbage content). None of this client's
    // callers need visible reasoning — they're template/extraction tasks —
    // so it's off by default; pass opts.reasoning to override per call.
    reasoning: opts.reasoning || { enabled: false },
  };
  if (opts.jsonMode) body.response_format = { type: 'json_object' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 15000);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://scheme-finder.local',
        'X-Title': 'Scheme Finder - TN Eligibility Matcher',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn('OpenRouter request failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn('OpenRouter request errored:', err.message);
    return null;
  }
}

// response_format:{type:'json_object'} isn't honored by every model routed
// through OpenRouter — some (observed: Claude models here) still wrap the
// JSON in a ```json ... ``` fence. Strip that, and fall back to grabbing the
// first {...} block, before handing callers a string to JSON.parse().
function extractJsonText(raw) {
  if (!raw) return raw;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const braced = raw.match(/\{[\s\S]*\}/);
  if (braced) return braced[0];
  return raw.trim();
}

module.exports = { chatComplete, aiEnabled, DEFAULT_MODEL, extractJsonText };
