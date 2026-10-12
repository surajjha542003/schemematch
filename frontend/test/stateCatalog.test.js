const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadWindow } = require('../testHelpers');
const records = require('../src/data/state-scholarships.json');

function setup(t) {
  const dom = loadWindow([
    'frontend/src/js/reviewed-conditions.js', 'frontend/src/js/programme-rules.js', 'frontend/src/js/exam-calendar.js', 'frontend/src/js/state.js', 'frontend/src/js/eligibility-engine.js',
    'frontend/src/js/tn-schemes.js', 'frontend/src/js/source-policy.js', 'frontend/src/js/scheme-catalog.js', 'frontend/src/js/catalog-bootstrap.js', 'frontend/src/js/ui.js', 'frontend/src/js/panels.js', 'frontend/src/js/catalog-chat.js', 'frontend/src/js/chat.js', 'frontend/src/js/init.js',
  ], {
    bodyHtml: fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8'),
    transform: source => source.slice(0, source.lastIndexOf('window.goPanel=goPanel')).replace(/window.addEventListener\('DOMContentLoaded',[\s\S]*?\n\}\);/g, '').replace(/window.goPanel=goPanel;[^\n]*\nwindow.filterSch=filterSch;[^\n]*/g, ''),
    postEval: 'window.getCatalogForTest = () => SCHEMES;',
  });
  t.after(() => dom.window.close());
  dom.window.fetch = async () => ({ ok: true, json: async () => records });
  return dom.window;
}

test('the bundled state directory loads without the backend and repeated refreshes do not duplicate cards', async t => {
  const w = setup(t);
  const initial = w.getCatalogForTest().length;
  const existing = new Set(w.getCatalogForTest().map(s => s.id));
  await w.refreshStateScholarships();
  assert.equal(w.getCatalogForTest().length, initial + records.filter(s => !existing.has(s.id)).length);
  const count = w.getCatalogForTest().length;
  await w.refreshStateScholarships();
  assert.equal(w.getCatalogForTest().length, count);
  assert.equal(new Set(w.getCatalogForTest().map(s => s.id)).size, count);
  assert.match(w.document.getElementById('state-catalog-note').textContent, /15 states/);
});

test('all 15 state filters, central filter and state-plus-search render the correct listings', async t => {
  const w = setup(t);
  await w.refreshStateScholarships();
  const filter = w.document.getElementById('sch-state-filter');
  assert.equal(filter.options.length, 18);
  for (const state of new Set(records.map(s => s.state))) {
    filter.value = state;
    w.renderSchemes();
    assert.ok(Number(w.document.getElementById('sch-count').textContent) >= 4, state);
    const names = [...w.document.querySelectorAll('#schGrid .fsc-name')].map(el => el.textContent);
    for (const record of records.filter(s => s.state === state)) assert.ok(names.includes(record.name), record.id);
  }
  filter.value = 'central'; w.renderSchemes();
  assert.doesNotMatch(w.document.getElementById('schGrid').textContent, /eGrantz|Maharashtra|e-Kalyan/);
  filter.value = 'Assam';
  w.document.getElementById('schSearchInput').value = 'research';
  w.renderSchemes();
  assert.equal(w.document.getElementById('sch-count').textContent, '1');
  assert.match(w.document.getElementById('schGrid').textContent, /PG Research Scholarship/);
});

test('new cards explain pending rules and closed windows instead of claiming eligibility or verified submission', async t => {
  const w = setup(t);
  await w.refreshStateScholarships();
  w.document.getElementById('sch-state-filter').value = 'Bihar';
  w.renderSchemes();
  const card = w.document.querySelector('#schGrid .fsc');
  assert.match(card.textContent, /View requirements/);
  assert.match(card.textContent, /published window ended/i);
  assert.doesNotMatch(card.textContent, /Apply Directly|Not eligible|% match/);
  assert.equal(w.getSchemeRegistrationUrl(records.find(s => s.state === 'Jharkhand')), 'https://ekalyan.cgg.gov.in/student.do');
});

test('state cards escape injected catalogue text and reject executable links', async t => {
  const w = setup(t);
  await w.refreshStateScholarships();
  const record = w.getCatalogForTest().find(s => s.state === 'Assam');
  record.name = '<img src=x onerror=alert(1)>';
  record.source = 'javascript:alert(1)';
  w.document.getElementById('sch-state-filter').value = 'Assam';
  w.renderSchemes();
  assert.equal(w.document.querySelector('#schGrid img'), null);
  assert.match(w.document.getElementById('schGrid').textContent, /<img/);
  assert.ok([...w.document.querySelectorAll('#schGrid a')].every(a=>a.getAttribute('href')==='#' || a.href.startsWith('https://')));
});

test('state scholarship questions return official-source information locally without inventing eligibility', async t => {
  const w = setup(t);
  await w.refreshStateScholarships();
  w.fetch = async () => { throw new Error('Backend unavailable'); };
  const answer = await w.getReply('Tell me about scholarships in Gujarat');
  assert.match(answer, /BCK-6.1/);
  assert.match(answer, /sje.gujarat.gov.in/);
  assert.match(answer, /programme-specific questions/);
  assert.match(answer, /Complete your profile/);
  assert.doesNotMatch(answer, /% match|eligible schemes|Start Guided Application/);
  assert.match(w.reply('Bihar scholarship portal details'), /published window ended/i);
});

test('matching rejects an outdated API and unreviewed awards, while accepting current pending results', async t => {
  const w = setup(t);
  const pending = {catalogueVersion:w.SchemeCatalog.version, eligible:[],needsVerification:[],bestCombo:[],excludedByConflict:[],relevantListings:[],reviewedConditions:{candidates:[],questions:[]},bestSingle:null,comboTotalValue:0};
  const respond = data => {w.fetch = async () => ({ok:true,json:async()=>({data})});};
  respond({...pending,catalogueVersion:'older-backend'});
  assert.equal(await w.fetchMatch({}),null);
  respond({...pending,eligible:[{id:'ugc-pg-national',score:100}],comboTotalValue:12000});
  assert.equal(await w.fetchMatch({}),null);
  respond({...pending,needsVerification:'malformed'});
  assert.equal(await w.fetchMatch({}),null);
  respond({...pending,relevantListings:[{id:'unknown-programme'}]});
  assert.equal(await w.fetchMatch({}),null);
  respond(pending);
  assert.equal((await w.fetchMatch({})).catalogueVersion,w.SchemeCatalog.version);
});
