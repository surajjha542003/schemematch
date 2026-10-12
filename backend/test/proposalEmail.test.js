const {test}=require('node:test'),assert=require('node:assert/strict');
const Mail=require('../src/services/proposalEmail.service');
const Catalog=require('../src/data/shared')('scheme-catalog'),Rules=require('../src/data/shared')('programme-rules');
const now=new Date('2026-10-10T10:00:00Z');
const env={SMTP_HOST:'smtp.gmail.com',SMTP_PORT:'465',SMTP_SECURE:'true',SMTP_USER:'sender@example.invalid',SMTP_PASS:'test-only',SMTP_FROM:'sender@example.invalid'};
const user=()=>({_id:'test-account',name:'<img src=x>',email:'student@example.invalid',profile:{state:'Telangana',cat:'SC',edu:'ug-tech',inc:'under1',gender:'Female',disability:'No',eligibilityDetails:{}}});
// Atomic conditional upsert double: an existing nonmatching unique user key throws E11000.
function store(){
 let record=null;
 const matches=(q,r)=>Object.entries(q).every(([k,v])=>k==='$and'?v.every(x=>matches(x,r)):k==='$or'?v.some(x=>matches(x,r)):v && typeof v==='object' && !(v instanceof Date)?Object.entries(v).every(([op,n])=>op==='$ne'?r[k]!==n:op==='$lte'?r[k]!=null && r[k]<=n:op==='$lt'?r[k]<n:false):v===null?r[k]==null:r[k]===v);
 return {async init(){},async findOneAndUpdate(q,update){if(record && !matches(q,record))throw Object.assign(new Error('Duplicate'),{code:11000});record={...(record || {userId:q.userId,sentCount:0}),...update.$set};return {...record};},async findOne(){return {...record};},async updateOne(q,u){assert.equal(record.leaseId,q.leaseId);Object.assign(record,u.$set);Object.keys(u.$unset||{}).forEach(k=>delete record[k]);},get record(){return record;}};
}
const accepted=()=>({sendMail:async message=>({accepted:[message.to.address]})});
test('Gmail TLS configuration is private, validated and refuses missing passwords',()=>{
 assert.equal(Mail.smtpConfig({...env,SMTP_PASS:''}),null);
 assert.equal(Mail.smtpConfig({...env,SMTP_FROM:'bad\r\nBcc: victim@example.invalid'}),null);
 assert.equal(Mail.smtpConfig({...env,SMTP_SECURE:'invalid'}),null);
 const config=Mail.smtpConfig(env);assert.equal(config.transport.secure,true);assert.equal(config.transport.disableUrlAccess,true);
 const starttls=Mail.smtpConfig({...env,SMTP_PORT:'587',SMTP_SECURE:'false'});assert.equal(starttls.transport.requireTLS,true);
});
test('proposal ranks six positive saved-profile matches and refreshes when profile facts change',()=>{
 const u=user(),a=Mail.proposalFor(u,now);assert.equal(a.matches.length,6);
 assert.ok(a.matches.every(s=>s.matchPercent>0));assert.ok(a.matches.every((s,i)=>!i || s.matchPercent<=a.matches[i-1].matchPercent));
 for(const s of a.matches){const original=Catalog.records.find(r=>r.id===s.id);assert.equal(Rules.profileMatch(original,u.profile).percent,s.matchPercent);assert.ok(!original.deadlineVerified || original.deadline>='2026-10-10');}
 assert.ok(a.matches.some(s=>s.id==='aicte-pragati'));
 u.profile.gender='Male';const b=Mail.proposalFor(u,now);assert.ok(!b.matches.some(s=>s.id==='aicte-pragati'));assert.notDeepEqual(a.matches.map(s=>s.id),b.matches.map(s=>s.id));
 u.profile.state='Tamil Nadu';u.profile.cat='General';const c=Mail.proposalFor(u,now);assert.ok(!c.matches.some(s=>s.id.startsWith('tg-')));
});
test('message escapes user text, uses actual form routes and omits raw personal profile fields',()=>{
 const u=user();u.profile.aadhaar='secret-identifier';const proposal=Mail.proposalFor(u,now),message=Mail.composeProposal(proposal);
 assert.equal(message.to.address,u.email);assert.ok(!message.html.includes('<img'));assert.match(message.html,/&lt;img/);
 assert.match(message.text,/https:\/\/scholarships.gov.in\/ApplicationForm\//);assert.ok(!message.text.includes('secret-identifier'));
 assert.match(message.text,/not confirmation of eligibility/);assert.match(message.text,/Turn automatic proposal emails off/);
});
test('incomplete, invalid, no-match and unconfigured accounts cannot contact SMTP',async t=>{
 const transportFactory=()=>{throw new Error('Must not contact SMTP');};
 const u=user();assert.equal((await Mail.sendProposal(u,{env:{},transportFactory,now})).state,'unconfigured');
 u.profile={};assert.equal((await Mail.sendProposal(u,{env,transportFactory,now})).state,'incomplete');
 u.profile=user().profile;t.mock.method(Rules,'rank',()=>[]);assert.equal((await Mail.sendProposal(u,{env,transportFactory,now})).state,'no_matches');
 u.email='bad';assert.equal((await Mail.sendProposal(u,{env,transportFactory,now})).state,'invalid_recipient');
});
test('automatic saves deduplicate, cooldown survives instances, and latest changed profile can send',async()=>{
 const delivery=store(),u=user();let sent=0;
 const transportFactory=()=>({sendMail:async m=>{sent++;assert.equal(m.to.address,u.email);return {accepted:[u.email]};}});
 const options={automatic:true,env,delivery,transportFactory,now};
 assert.equal((await Mail.sendProposal(u,options)).state,'sent');assert.equal((await Mail.sendProposal(u,options)).state,'unchanged');
 u.profile.gender='Male';assert.equal((await Mail.sendProposal(u,options)).state,'cooldown');
 assert.equal((await Mail.sendProposal(u,{...options,now:new Date(+now+61000)})).state,'sent');assert.equal(sent,2);
});
test('concurrent sends claim one account, and daily limit resets the next day',async()=>{
 const delivery=store(),u=user();let sent=0,release;
 const gate=new Promise(resolve=>{release=resolve;});
 const options={env,delivery,now,transportFactory:()=>({sendMail:async()=>{sent++;await gate;return {accepted:[u.email]};}})};
 const first=Mail.sendProposal(u,options);await new Promise(resolve=>setImmediate(resolve));
 assert.equal((await Mail.sendProposal(u,options)).state,'cooldown');release();assert.equal((await first).state,'sent');assert.equal(sent,1);
 delivery.record.sentCount=10;
 assert.equal((await Mail.sendProposal(u,{...options,now:new Date(+now+61000)})).state,'daily_limit');
 assert.equal((await Mail.sendProposal(u,{...options,now:new Date(+now+86400000)})).state,'sent');assert.equal(delivery.record.sentCount,1);
});
test('recipient rejection and SMTP failure are not reported as sent; accepted mail remains sent if tracking fails',async t=>{
 const delivery=store(),u=user();
 assert.equal((await Mail.sendProposal(u,{env,delivery,now,transportFactory:()=>({sendMail:async()=>({accepted:[]})})})).state,'failed');
 assert.equal(delivery.record.lastDigest,undefined);assert.equal(delivery.record.leaseId,undefined);
 const broken=store();broken.updateOne=async()=>{throw new Error('DB unavailable');};t.mock.method(console,'warn',()=>{});
 assert.equal((await Mail.sendProposal(u,{env,delivery:broken,now,transportFactory:accepted})).state,'sent');assert.ok(broken.record.leaseId);
});
test('profile save sends only after persistence and SMTP errors do not fail the save',async t=>{
 const ctrl=require('../src/controllers/user.controller'),u=user();u.emailPreferences={proposalOnProfileSave:true};let saved=false,response;
 u.save=async()=>{saved=true;};
 t.mock.method(Mail,'sendProposal',async(account,options)=>{assert.equal(saved,true);assert.equal(account.profile.cat,'OBC');assert.equal(options.automatic,true);throw new Error('SMTP unavailable');});
 await ctrl.updateProfile({user:u,body:{profile:{cat:'OBC'}}},{json:json=>{response=json;}},e=>{throw e;});
 assert.equal(response.data.profile.cat,'OBC');assert.equal(response.proposalEmail.state,'failed');
});
test('send endpoint ignores client recipient/profile and respects disabled automatic email',async t=>{
 const ctrl=require('../src/controllers/proposalEmail.controller'),u=user();let response,status;
 t.mock.method(Mail,'sendProposal',async(account)=>{assert.equal(account,u);assert.equal(account.email,'student@example.invalid');return {state:'sent',recipient:account.email};});
 const res={status:n=>{status=n;return res;},json:json=>{response=json;}};
 await ctrl.send({user:u,body:{recipient:'attacker@example.invalid',profile:{cat:'Other'}}},res,e=>{throw e;});
 assert.equal(status,200);assert.equal(response.data.recipient,u.email);
 await ctrl.send({user:u,body:{automatic:true}},res,e=>{throw e;});assert.equal(response.data.state,'disabled');
});
