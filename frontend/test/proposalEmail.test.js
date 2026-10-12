const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadWindow}=require('../testHelpers');
function setup(t){
 const dom=loadWindow(['frontend/src/js/state.js','frontend/src/js/proposal-email.js'],{bodyHtml:fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8'),postEval:`
 window.setAccountForTest=value=>{AUTH_USER=value;};
 window.escapeSchemeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.pushProfileToBackend=async()=>{};
 `});t.after(()=>dom.window.close());return dom.window;
}
function signin(w){w.setToken('test-only-token');w.setAccountForTest({_id:'account',email:'student@example.invalid',emailPreferences:{proposalOnProfileSave:true}});}
test('guests and offline users cannot send or preview SMTP proposals',async t=>{
 const w=setup(t);w.fetch=()=>{throw new Error('Must not fetch');};
 await w.previewEmailProposal();assert.match(w.document.getElementById('proposal-email-status').textContent,/Log in/);
 signin(w);Object.defineProperty(w.navigator,'onLine',{value:false});await w.sendEmailProposal();assert.match(w.document.getElementById('proposal-email-status').textContent,/internet connection/);
});
test('preview uses authenticated saved-profile endpoint, escapes text and disables sending without SMTP',async t=>{
 const w=setup(t);signin(w);const calls=[];
 w.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({data:{recipient:'student@example.invalid',complete:true,configured:false,matches:[{name:'<img src=x>',matchPercent:85,benefit:'₹50,000/year'}]}})};};
 await w.previewEmailProposal();assert.equal(calls.length,1);assert.ok(calls[0].url.endsWith('/user/proposal'));assert.equal(calls[0].options.body,undefined);assert.match(calls[0].options.headers.Authorization,/Bearer test-only-token/);
 assert.equal(w.document.querySelector('#proposal-email-preview img'),null);assert.equal(w.document.getElementById('proposal-send-button').disabled,true);
 assert.match(w.document.getElementById('proposal-email-preview').textContent,/85% profile match/);
});
test('unsynced local changes block stale server proposal previews',async t=>{
 const w=setup(t);signin(w);w.localStorage.setItem('sf_profile_pending','true');let calls=0;w.fetch=async()=>{calls++;};
 await w.previewEmailProposal();assert.equal(calls,0);assert.match(w.document.getElementById('proposal-email-status').textContent,/not synced/);
});
test('manual email sends no client recipient/profile and double clicks make one request',async t=>{
 const w=setup(t);signin(w);let calls=0,release;
 w.fetch=async(url,options)=>{calls++;assert.ok(url.endsWith('/user/proposal/send'));assert.equal(options.body,'{}');await new Promise(resolve=>{release=resolve;});return {ok:true,json:async()=>({data:{state:'sent',count:6,recipient:'student@example.invalid'}})};};
 const sending=w.sendEmailProposal();await w.sendEmailProposal();assert.equal(calls,1);release();await sending;
 assert.match(w.document.getElementById('proposal-email-status').textContent,/6-scheme proposal was accepted/);
});
test('preference persists and logout clears automatic retries',async t=>{
 const w=setup(t);signin(w);w.fetch=async(url,options)=>{assert.ok(url.endsWith('/user/email-preferences'));assert.equal(JSON.parse(options.body).automatic,false);return {ok:true,json:async()=>({data:{automatic:false,configured:true,recipient:'student@example.invalid'}})};};
 await w.saveEmailProposalPreference(false);assert.equal(w.document.getElementById('proposal-email-automatic').checked,false);
 assert.match(w.document.getElementById('proposal-preference-status').textContent,/are off/);
 let retry,cleared=false;w.setTimeout=fn=>{retry=fn;return 42;};w.clearTimeout=id=>{if(id===42)cleared=true;};signin(w);
 w.handleProposalEmailResult({state:'cooldown',retryAfter:60});assert.ok(retry);w.logoutAccount();w.updateEmailProposalUI();assert.equal(cleared,true);
 w.fetch=()=>{throw new Error('Must not retry after logout');};await retry();
});
test('changing accounts hides previous previews and rejects stale email responses',async t=>{
 const w=setup(t);signin(w);w.updateEmailProposalUI();
 const box=w.document.getElementById('proposal-email-preview');box.innerHTML='previous account proposal';box.classList.remove('hidden');
 let release;w.fetch=async()=>{await new Promise(resolve=>{release=resolve;});return {ok:true,json:async()=>({data:{state:'sent',count:6,recipient:'student@example.invalid'}})};};
 const sending=w.sendEmailProposal();w.setToken('another-account-token');w.setAccountForTest({_id:'different',email:'other@example.invalid'});w.updateEmailProposalUI();
 assert.equal(box.innerHTML,'');assert.equal(box.classList.contains('hidden'),true);release();await sending;
 assert.match(w.document.getElementById('proposal-email-status').textContent,/account changed/);
});
