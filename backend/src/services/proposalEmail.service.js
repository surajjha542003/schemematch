const {createHash,randomUUID}=require('node:crypto');
const nodemailer=require('nodemailer');
const Delivery=require('../models/ProposalDelivery.model');
const Catalog=require('../data/shared')('scheme-catalog');
const Rules=require('../data/shared')('programme-rules');
const Policy=require('../data/shared')('source-policy');
const Conditions=require('../data/shared')('reviewed-conditions');

const COOLDOWN_MS=60000,DAILY_LIMIT=10;
const validEmail=value=>typeof value==='string' && /^[^@\s<>,;:\r\n]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
const escape=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function smtpConfig(env=process.env){
  const port=Number(env.SMTP_PORT || 587),from=env.SMTP_FROM || env.SMTP_USER;
  if(!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !validEmail(from) || !Number.isInteger(port) || port<1 || port>65535)return null;
  const secure=env.SMTP_SECURE ? env.SMTP_SECURE==='true' : port===465;
  if(env.SMTP_SECURE && !['true','false'].includes(env.SMTP_SECURE))return null;
  return {from:{name:'SchemeMatch',address:from},transport:{host:env.SMTP_HOST,port,secure,requireTLS:!secure,
    auth:{user:env.SMTP_USER,pass:env.SMTP_PASS},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:15000,
    disableFileAccess:true,disableUrlAccess:true}};
}
function profileOf(user){const p=user.profile?.toObject?.() || user.profile || {};return {...p,eligibilityDetails:Conditions.sanitizeDetails(p.eligibilityDetails)};}
function proposalFor(user,now=new Date()){
  const profile=profileOf(user),today=now.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
  const complete=Boolean(profile.cat && profile.edu && profile.inc);
  const matches=complete?Rules.rank(Catalog.forProfile(profile),profile,{excludeFailed:true})
    .filter(({s,profileMatch})=>profileMatch.percent>0 && s.status!=='closed' && s.applicationAccess!=='closed' && !(s.deadlineVerified && s.deadline<today))
    .slice(0,6).map(({s,profileMatch})=>({id:s.id,name:s.name,by:s.by,matchPercent:profileMatch.percent,
      benefit:Rules.rate(s,profile).label,deadline:s.deadlineVerified?s.deadline:null,
      applicationRoute:s.applicationRoute,actions:Policy.applicationActions(s),source:Policy.officialUrl(s.source)})):[];
  return {recipient:validEmail(user.email)?user.email:null,name:user.name || 'Student',complete,
    catalogueVersion:Catalog.version,matches};
}
function composeProposal(proposal){
  const intro='Your scholarship proposal is based on your saved SchemeMatch profile. Profile match percentages are suggestions, not confirmation of eligibility, selection or payment.';
  const text=['Hello '+proposal.name+',',intro,...proposal.matches.map(s=>[
    s.name+' — '+s.matchPercent+'% profile match',s.by,s.benefit,
    s.deadline?'Published '+(s.applicationRoute==='renewal'?'renewal ':'')+'closing date: '+s.deadline:'Current closing date not confirmed',
    s.actions.note,...s.actions.links.map(link=>link.label+': '+link.url),
    s.actions.search?s.actions.search.label+': '+s.actions.search.url:'',s.source?'Programme information: '+s.source:''
  ].filter(Boolean).join('\n')),'Sign in to the official application service where required. SchemeMatch does not submit applications.',
  'Turn automatic proposal emails off in SchemeMatch → My Profile → Email proposals.'].join('\n\n');
  const html=`<div style="font-family:Arial,sans-serif;color:#14213d;max-width:640px;margin:auto;padding:24px"><h1 style="font-size:26px">Your scholarship proposal</h1><p>Hello ${escape(proposal.name)},</p><p>${escape(intro)}</p>${proposal.matches.map(s=>`<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0"><strong style="color:#ea580c">${s.matchPercent}% profile match</strong><h2 style="font-size:19px">${escape(s.name)}</h2><p>${escape(s.by)}</p><p><strong>${escape(s.benefit)}</strong></p><p>${s.deadline?'Published '+(s.applicationRoute==='renewal'?'renewal ':'')+'closing date: '+escape(s.deadline):'Current closing date not confirmed'}</p><p>${escape(s.actions.note)}</p>${s.actions.links.map(link=>`<p><a href="${escape(link.url)}" style="color:#1d4ed8">${escape(link.label)} ↗</a></p>`).join('')}${s.actions.search?`<p><a href="${escape(s.actions.search.url)}">${escape(s.actions.search.label)} ↗</a></p>`:''}${s.source?`<p><a href="${escape(s.source)}">Programme information ↗</a></p>`:''}</div>`).join('')}<p>Sign in to the official application service where required. SchemeMatch does not submit applications.</p><p style="font-size:12px;color:#64748b">Turn automatic proposal emails off in SchemeMatch → My Profile → Email proposals.</p></div>`;
  return {to:{address:proposal.recipient},subject:'Your SchemeMatch scholarship proposal',text,html};
}
function digestFor(user,proposal){
  const ordered=value=>Array.isArray(value)?value.map(ordered):value && typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])])):value;
  return createHash('sha256').update(JSON.stringify(ordered({profile:profileOf(user),name:user.name,recipient:proposal.recipient,version:proposal.catalogueVersion,matches:proposal.matches.map(s=>s.id)}))).digest('hex');
}
async function sendProposal(user,{automatic=false,env=process.env,delivery=Delivery,transportFactory=nodemailer.createTransport,now=new Date()}={}){
  const proposal=proposalFor(user,now);
  if(!proposal.complete)return {state:'incomplete',count:0};
  if(!proposal.recipient)return {state:'invalid_recipient',count:0};
  if(!proposal.matches.length)return {state:'no_matches',count:0};
  const config=smtpConfig(env);if(!config)return {state:'unconfigured',count:proposal.matches.length};
  // Ensure the unique account index exists before concurrent serverless sends.
  if(delivery.init)await delivery.init();
  const userId=user._id,digest=digestFor(user,proposal),leaseId=randomUUID(),day=now.toISOString().slice(0,10);
  const rules=[{$or:[{leaseUntil:{$lte:now}},{leaseUntil:null}]},{$or:[{nextAllowedAt:{$lte:now}},{nextAllowedAt:null}]},{$or:[{sentDay:{$ne:day}},{sentCount:{$lt:DAILY_LIMIT}}]}];
  if(automatic)rules.push({lastDigest:{$ne:digest}});
  let claim;
  try{claim=await delivery.findOneAndUpdate({userId,$and:rules},{$set:{leaseId,leaseUntil:new Date(now.getTime()+120000)}},{upsert:true,new:true,setDefaultsOnInsert:true});}
  catch(error){
    if(error.code!==11000)throw error;
    const previous=await delivery.findOne({userId});
    if(automatic && previous?.lastDigest===digest)return {state:'unchanged',count:proposal.matches.length};
    if(previous?.sentDay===day && previous?.sentCount>=DAILY_LIMIT)return {state:'daily_limit',count:proposal.matches.length};
    const retryAfter=Math.max(1,Math.ceil((Math.max(+previous?.nextAllowedAt || 0,+previous?.leaseUntil || 0)-now.getTime())/1000));
    return {state:'cooldown',retryAfter,count:proposal.matches.length};
  }
  const transport=transportFactory(config.transport);
  try{
    const info=await transport.sendMail({...composeProposal(proposal),from:config.from});
    if(!info.accepted?.some(address=>String(address).toLowerCase()===proposal.recipient.toLowerCase()))throw new Error('Recipient not accepted');
  }catch(_){
    await delivery.updateOne({userId,leaseId},{$set:{nextAllowedAt:new Date(now.getTime()+COOLDOWN_MS)},$unset:{leaseId:1,leaseUntil:1}});
    return {state:'failed',count:proposal.matches.length,retryAfter:60};
  }finally{transport.close?.();}
  // SMTP has accepted the message. A tracking write failure must not be treated
  // as a send failure or cause an immediate resend; retain the claim in that case.
  try{await delivery.updateOne({userId,leaseId},{$set:{lastDigest:digest,lastSentAt:now,nextAllowedAt:new Date(now.getTime()+COOLDOWN_MS),sentDay:day,sentCount:(claim.sentDay===day?claim.sentCount || 0:0)+1},$unset:{leaseId:1,leaseUntil:1}});}
  catch(_){console.warn('Proposal accepted by SMTP; delivery tracking update unavailable.');}
  return {state:'sent',count:proposal.matches.length,recipient:proposal.recipient};
}
module.exports={smtpConfig,proposalFor,composeProposal,digestFor,sendProposal};
