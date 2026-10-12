const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadWindow}=require('../testHelpers');
function setup(t,extra=''){
 const dom=loadWindow(['frontend/src/js/lang.js'],{bodyHtml:'<div class="page active" id="pg-land"><nav class="lnav-actions"></nav><h1 class="hh1">Find scholarships</h1></div><div class="page" id="pg-app"><div class="ab-r"></div></div><div id="languageControl"><select id="langSwitch"></select><span id="langStatus"></span></div><div id="google_translate_element"></div>',transform:s=>s.replace("window.addEventListener('DOMContentLoaded',initLangSwitcher);",''),postEval:extra});
 t.after(()=>dom.window.close());dom.window.document.documentElement.lang='en';return dom.window;
}
function combo(w){const el=w.document.createElement('select');el.className='goog-te-combo';el.innerHTML='<option value=""></option><option value="kn">Kannada</option><option value="te">Telugu</option><option value="ur">Urdu</option>';el.addEventListener('change',()=>{w.document.querySelector('.hh1').textContent={kn:'ವಿದ್ಯಾರ್ಥಿವೇತನ',te:'విద్యా',ur:'تعلیم'}[el.value] || 'Find scholarships';});w.document.body.appendChild(el);return el;}
test('saved language is applied and the sole selector moves with the active header',t=>{
 const w=setup(t);const c=combo(w);let changes=0;c.addEventListener('change',()=>changes++);
 w.localStorage.setItem('sf_lang','kn');w.initLangSwitcher();
 assert.equal(changes,1);assert.equal(c.value,'kn');assert.equal(w.document.documentElement.lang,'kn');
 assert.equal(w.document.querySelectorAll('#langSwitch option').length,11);
 assert.equal(w.document.getElementById('languageControl').parentElement.className,'lnav-actions');
 w.document.getElementById('pg-app').classList.add('active');w.placeLanguageControl();
 assert.equal(w.document.getElementById('languageControl').parentElement.className,'ab-r');
 assert.equal(w.document.querySelectorAll('#languageControl').length,1);
 assert.equal(typeof w.googleTranslateElementInit,'function');
});
test('translation retries terminate visibly and stale requests cannot overwrite a newer selection',t=>{
 const w=setup(t);w.initLangSwitcher();const timers=[];w.setTimeout=fn=>timers.push(fn);
 w.switchLanguage('kn');w.switchLanguage('te');const c=combo(w);timers.forEach(fn=>fn());
 assert.equal(c.value,'te');assert.equal(w.localStorage.getItem('sf_lang'),'te');
 c.remove();w.withGoogleCombo(()=>assert.fail('No combo available'),0);
 assert.match(w.document.getElementById('langStatus').textContent,/Translation unavailable/);
 assert.equal(w.document.getElementById('langSwitch').value,'te');
});
test('provider failures are visible and unsupported codes cannot masquerade as translated',t=>{
 const w=setup(t);w.initLangSwitcher();
 const script=w.document.querySelector('script');script.onerror();
 assert.match(w.document.getElementById('langStatus').textContent,/unavailable/);
 const c=combo(w);w.switchLanguage('hi');assert.equal(w.document.documentElement.lang,'en');assert.equal(w.localStorage.getItem('sf_lang'),null);
 assert.equal(w.document.getElementById('langSwitch').value,'en');
 w.switchLanguage('xx');assert.equal(c.value,'');
});
test('accepting a provider language option without translating visible content does not report success',t=>{
 const w=setup(t,'window.confirmForTest=(code,n)=>confirmPageTranslation(code,languageRequest,n);');w.initLangSwitcher();const el=w.document.createElement('select');el.className='goog-te-combo';el.innerHTML='<option value="kn">Kannada</option>';w.document.body.appendChild(el);w.setTimeout=()=>{};w.switchLanguage('kn');
 assert.equal(w.document.documentElement.lang,'en');assert.equal(w.localStorage.getItem('sf_lang'),null);
 assert.match(w.document.getElementById('langStatus').textContent,/Translating/);
 w.confirmForTest('kn',0);assert.match(w.document.getElementById('langStatus').textContent,/could not be confirmed/);
});
