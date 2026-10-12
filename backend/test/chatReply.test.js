const { test } = require('node:test');
const assert = require('node:assert/strict');

// Force the AI-unavailable path regardless of the shell's environment —
// these tests must never make a real network call.
delete process.env.OPEN_ROUTER;
delete process.env.OPENROUTER_API_KEY;

const { generateChatReply, buildSchemeFacts, buildEligibleFacts, buildRecommendationFacts, FALLBACK_REPLY } = require('../src/services/chatReply.service');

// These tests run with no OPEN_ROUTER key in the test environment (only
// server.js loads .env), so generateChatReply always takes the
// AI-unavailable path — same boundary aiExplain.service.js relies on.
test('generateChatReply falls back to the deterministic message when AI is unavailable', async () => {
  const result = await generateChatReply('How do I apply for NSP?', null);
  assert.equal(result.aiGenerated, false);
  assert.equal(result.reply, FALLBACK_REPLY);
});

test('generateChatReply falls back on an empty message without crashing', async () => {
  const result = await generateChatReply('   ', null);
  assert.equal(result.aiGenerated, false);
});

test('buildSchemeFacts never leaks eligFn (non-serializable) to the prompt', () => {
  const facts = buildSchemeFacts();
  assert.ok(facts.length > 0);
  for (const f of facts) {
    assert.equal(f.eligFn, undefined);
    assert.equal(typeof f.name, 'string');
  }
});

test('buildEligibleFacts returns null for an incomplete profile (never guesses)', () => {
  assert.equal(buildEligibleFacts(null), null);
  assert.equal(buildEligibleFacts({ cat: 'SC' }), null); // missing edu/inc
});

test('buildEligibleFacts does not promote unreviewed catalogue records to awards', () => {
  const facts = buildEligibleFacts({ state: 'Tamil Nadu', cat: 'SC', edu: '9-10', inc: 'under1' });
  assert.ok(Array.isArray(facts));
  assert.equal(facts.length, 0);
  assert.ok(facts.every(f => typeof f.name === 'string' && typeof f.matchScore === 'number'));
});

test('online AI recommendations exclude zero matches and refresh with category, course and gender', () => {
  assert.equal(buildRecommendationFacts({cat:'SC'}),null);
  const profile={state:'Telangana',cat:'OBC',edu:'ug-tech',inc:'under1',gender:'Male',disability:'No'};
  const male=buildRecommendationFacts(profile);
  assert.ok(male.length>6);assert.ok(male.every(s=>s.matchPercent>0));
  assert.ok(!male.some(s=>s.name.includes('Pragati') || s.name.includes('Saksham')));
  const female=buildRecommendationFacts({...profile,gender:'Female'});
  assert.ok(female.some(s=>s.name.includes('Pragati')));
  const school=buildRecommendationFacts({...profile,cat:'ST',edu:'9-10'});
  assert.ok(!school.some(s=>s.name.includes('Technical Degree')));
  assert.notDeepEqual(school.map(s=>s.name),male.map(s=>s.name));
});
