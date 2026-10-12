const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWindow } = require('../testHelpers');

const html = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8');
function setup(t) {
  const dom = loadWindow(['frontend/src/js/state.js', 'frontend/src/js/eligibility.js'], {
    bodyHtml: html,
    postEval: 'window.voiceState = () => ({ recording: isVoiceRecording, processing: voiceProcessing });',
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  const sessions = [];
  w.SpeechRecognition = class {
    constructor() { this.starts = 0; sessions.push(this); }
    start() { this.starts++; this.onstart?.(); }
    stop() { this.onend?.(); }
    abort() { this.onend?.(); }
  };
  return { w, sessions };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('all 11 configured locales reach the recognizer; this does not test actual audio', async t => {
  const { w, sessions } = setup(t);
  const options = [...w.document.getElementById('nl-voice-lang').options];
  assert.equal(options.length, 11);
  for (const option of options) {
    w.setVoiceLang(option.value);
    w.toggleVoiceInput();
    assert.equal(sessions.at(-1).lang, option.value);
    assert.equal(w.voiceState().recording, true);
    w.toggleVoiceInput(); // no audio, so no network/profile parsing
    await tick();
    assert.equal(w.voiceState().recording, false);
    assert.equal(w.voiceState().processing, false);
  }
});

test('startup failure resets recording state and permits a fresh attempt', t => {
  const { w, sessions } = setup(t);
  w.SpeechRecognition.prototype.start = function() { throw new Error('Unavailable'); };
  w.toggleVoiceInput();
  assert.equal(w.voiceState().recording, false);
  assert.equal(w.document.getElementById('nl-voice-btn').disabled, false);
  assert.match(w.document.getElementById('nl-note').textContent, /could not start/);
  w.toggleVoiceInput();
  assert.equal(sessions.length, 2);
});

test('network, permission, capture and unsupported-language errors stop without autofilling', async t => {
  const { w, sessions } = setup(t);
  let parsed = 0;
  w.parseNLProfile = async () => { parsed++; };
  for (const error of ['network', 'not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported']) {
    w.toggleVoiceInput();
    const recognition = sessions.at(-1);
    recognition.onerror({ error });
    recognition.onend();
    await tick();
    assert.equal(w.voiceState().recording, false);
    assert.equal(recognition.starts, 1);
    assert.equal(w.document.getElementById('nl-voice-lang').disabled, false);
  }
  assert.equal(parsed, 0);
});

test('silence restarts are bounded, and old session callbacks cannot restart recording', t => {
  const { w, sessions } = setup(t);
  const pending = [];
  w.setTimeout = callback => { pending.push(callback); return pending.length; };
  w.toggleVoiceInput();
  const recognition = sessions[0];
  for (let i = 0; i < 3; i++) { recognition.onend(); pending.shift()(); }
  recognition.onend();
  assert.equal(recognition.starts, 4);
  assert.equal(w.voiceState().recording, false);
  recognition.onend();
  assert.equal(pending.length, 0);
});

test('one session translates once using its fixed locale and ignores duplicate end events', async t => {
  const { w, sessions } = setup(t);
  const translated = [], parsed = [];
  w.translateToEnglish = async (text, lang) => { translated.push({ text, lang }); return 'My annual income is 2 lakh.'; };
  w.parseNLProfile = async (text, options) => { parsed.push({ text, options }); };
  w.setVoiceLang('hi-IN');
  w.toggleVoiceInput();
  w.setVoiceLang('en-IN');
  assert.equal(w.document.getElementById('nl-voice-lang').value, 'hi-IN');
  const result = [{ transcript: 'मेरी आय दो लाख है' }]; result.isFinal = true;
  sessions[0].onresult({ resultIndex: 0, results: [result] });
  w.toggleVoiceInput();
  sessions[0].onend();
  await tick();
  assert.equal(translated.length, 1);
  assert.equal(translated[0].lang, 'hi-IN');
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].options.translated, true);
  assert.equal(w.document.getElementById('nl-voice-btn').disabled, false);
});

test('a silent recording never parses an older typed description', async t => {
  const { w } = setup(t);
  let parsed = 0;
  w.parseNLProfile = async () => { parsed++; };
  w.document.getElementById('nl-text').value = 'An earlier student profile';
  w.toggleVoiceInput(); w.toggleVoiceInput();
  await tick();
  assert.equal(parsed, 0);
  assert.match(w.document.getElementById('nl-note').textContent, /No speech detected/);
});

test('a missing end event after Stop cannot leave capture running or controls stuck', async t => {
  const { w, sessions } = setup(t);
  const pending = [];
  w.setTimeout = callback => { pending.push(callback); return pending.length; };
  let aborted = false;
  w.toggleVoiceInput();
  sessions[0].stop = () => {}; // browser fails to deliver its end callback
  sessions[0].abort = () => { aborted = true; };
  w.toggleVoiceInput();
  assert.equal(w.voiceState().processing, true);
  pending.shift()();
  await tick();
  assert.equal(aborted, true);
  assert.equal(w.voiceState().processing, false);
  assert.equal(w.document.getElementById('nl-voice-btn').disabled, false);
});

test('translation failure preserves speech and releases the controls without parsing', async t => {
  const { w, sessions } = setup(t);
  let parsed = 0;
  w.translateToEnglish = async () => { throw new Error('Unavailable'); };
  w.parseNLProfile = async () => { parsed++; };
  w.toggleVoiceInput();
  const result = [{ transcript: 'मेरी आय दो लाख है' }]; result.isFinal = true;
  sessions[0].onresult({ resultIndex: 0, results: [result] });
  w.toggleVoiceInput(); await tick();
  assert.equal(parsed, 0);
  assert.equal(w.document.getElementById('nl-text').value, 'मेरी आय दो लाख है');
  assert.equal(w.voiceState().processing, false);
  assert.equal(w.document.getElementById('nl-btn').disabled, false);
});

test('translation failure is explicit; untranslated input is not returned as success', async t => {
  const { w } = setup(t);
  w.fetch = async () => { throw new Error('Offline'); };
  w.console.warn = () => {};
  await assert.rejects(w.translateToEnglish('मेरी आय दो लाख है', 'hi-IN'), /Translation unavailable/);
});

test('English containing rupee symbols does not depend on a translation service', async t => {
  const { w } = setup(t);
  w.fetch = async () => { throw new Error('Must not translate'); };
  const text = 'My annual family income is ₹1.8 lakh.';
  assert.equal(await w.translateToEnglish(text, 'en-IN'), text);
});

test('an ambiguous updated income clears a previously saved bracket before matching', async t => {
  const { w } = setup(t);
  w.setVoiceLang('en-IN');
  w.fetch = async () => { throw new Error('Offline'); };
  w.document.getElementById('ef-inc').value = 'under1';
  await w.parseNLProfile('My annual family income is below 2 lakh.');
  assert.equal(w.document.getElementById('ef-inc').value, '');
  assert.equal(JSON.parse(w.localStorage.getItem('sf_profile')).inc, '');
  assert.equal(w.document.getElementById('nl-btn').disabled, false);
});

test('profile requests abort on timeout and can be retried', async t => {
  const { w } = setup(t);
  w.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Timed out')));
  });
  await assert.rejects(w.fetchProfileJSON('/profile/parse', {}, 10), /Timed out/);
  w.fetch = async () => ({ ok: true, json: async () => ({ data: {} }) });
  assert.ok((await w.fetchProfileJSON('/profile/parse', {}, 10)).data);
});
