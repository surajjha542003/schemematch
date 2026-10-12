/* SMTP credentials and matching are server-side; only the account email is used. */
let proposalRetryTimer=null,proposalRequestBusy=false,proposalVisibleAccount=null;
const proposalStateMessages={
  incomplete:'Complete and save your category, course and income first.',
  no_matches:'No open scheme matches your saved profile right now.',
  unconfigured:'Your profile is saved. The email service is not ready yet.',
  invalid_recipient:'Your account needs a valid email address.',
  unchanged:'Your latest proposal already covers this saved profile.',
  disabled:'Automatic proposal emails are off.',
  daily_limit:'You have reached today’s email limit. Try again tomorrow.',
  failed:'Your profile is saved, but the email could not be sent. Try again later.',
};
function proposalMessage(text,target='proposal-email-status'){
  const el=document.getElementById(target);if(el)el.textContent=text;
}
function updateEmailProposalUI(){
  const account=AUTH_USER?._id || AUTH_USER?.email || null;
  if(account!==proposalVisibleAccount){
    const preview=document.getElementById('proposal-email-preview');
    if(preview){preview.innerHTML='';preview.classList.add('hidden');}
    clearTimeout(proposalRetryTimer);proposalRetryTimer=null;
    proposalMessage('','proposal-preference-status');proposalVisibleAccount=account;
  }
  const toggle=document.getElementById('proposal-email-automatic');
  if(toggle)toggle.checked=Boolean(AUTH_USER?.emailPreferences?.proposalOnProfileSave);
  if(!AUTH_USER || !toggle?.checked){clearTimeout(proposalRetryTimer);proposalRetryTimer=null;}
  if(!AUTH_USER){document.getElementById('proposal-email-preview')?.classList.add('hidden');proposalMessage('Log in to preview and email your saved-profile matches.');}
}
async function proposalRequest(path,options={}){
  const token=getToken();
  if(!token)throw new Error('Log in to email your saved-profile matches.');
  if(navigator.onLine===false)throw new Error('Email needs an internet connection. Your local matches still work offline.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
    const response=await fetch(API_BASE+path,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}});
    const json=await response.json();
    if(getToken()!==token)throw new Error('Your account changed. Preview the proposal again.');
    if(!response.ok && !json.data?.state)throw new Error(json.error || 'The email service is unavailable. Try again later.');
    return json.data;
  }catch(error){if(error.name==='AbortError')throw new Error('Email confirmation timed out. Check your inbox before trying again.');throw error;}
  finally{clearTimeout(timer);}
}
function handleProposalEmailResult(result){
  let message=proposalStateMessages[result.state];
  if(result.state==='sent')message=`Your ${result.count}-scheme proposal was accepted for delivery to ${result.recipient}.`;
  if(result.state==='cooldown'){
    message='Your profile is saved. Email is limited to one proposal per minute.';
    clearTimeout(proposalRetryTimer);
    if(AUTH_USER?.emailPreferences?.proposalOnProfileSave){
      const account=AUTH_USER._id || AUTH_USER.email;
      message+=' The latest saved proposal will retry while this page is open.';
      proposalRetryTimer=setTimeout(async()=>{
        if(!getToken() || (AUTH_USER?._id || AUTH_USER?.email)!==account || !AUTH_USER?.emailPreferences?.proposalOnProfileSave)return;
        try{handleProposalEmailResult(await proposalRequest('/user/proposal/send',{method:'POST',body:JSON.stringify({automatic:true})}));}
        catch(error){proposalMessage(error.message);}
      },Math.max(1,result.retryAfter || 60)*1000+500);
    }
  }
  proposalMessage(message || 'Email status is unavailable.');proposalMessage(message || 'Email status is unavailable.','proposal-preference-status');
}
async function saveEmailProposalPreference(automatic){
  const toggle=document.getElementById('proposal-email-automatic');if(toggle)toggle.disabled=true;
  try{
    const data=await proposalRequest('/user/email-preferences',{method:'PUT',body:JSON.stringify({automatic})});
    AUTH_USER.emailPreferences={proposalOnProfileSave:data.automatic};updateEmailProposalUI();
    proposalMessage(data.automatic?`Automatic proposals enabled for ${data.recipient}. ${data.configured?'Save your profile to receive your matches.':'The email service is not ready yet.'}`:'Automatic proposal emails are off.','proposal-preference-status');
  }catch(error){if(toggle)toggle.checked=Boolean(AUTH_USER?.emailPreferences?.proposalOnProfileSave);proposalMessage(error.message,'proposal-preference-status');}
  finally{if(toggle)toggle.disabled=false;}
}
async function previewEmailProposal(){
  if(proposalRequestBusy)return;proposalRequestBusy=true;
  const button=document.getElementById('proposal-preview-button');if(button)button.disabled=true;
  try{
    if(!getToken())throw new Error('Log in through My Profile to preview your email proposal.');
    if(navigator.onLine===false)throw new Error('Email needs an internet connection. Your local matches still work offline.');
    await pushProfileToBackend();
    if(localStorage.getItem(PROFILE_PENDING_KEY)==='true')throw new Error('Your latest profile has not synced yet. Retry when it is saved to your account.');
    const data=await proposalRequest('/user/proposal');
    const box=document.getElementById('proposal-email-preview');box.classList.remove('hidden');
    box.innerHTML=`<p>To: <strong>${escapeSchemeText(data.recipient || 'Account email unavailable')}</strong></p>${data.matches.map(s=>`<div class="qsi"><div class="qsi-main"><div class="qsi-name">${escapeSchemeText(s.name)}</div><div class="qsi-by">${s.matchPercent}% profile match · ${escapeSchemeText(s.benefit)}</div></div></div>`).join('')}<p style="font-size:12px;color:var(--t3)">These are suggestions based on your saved profile. Official eligibility and selection checks still apply.</p><button class="btnp" id="proposal-send-button" onclick="sendEmailProposal()" ${!data.configured || !data.complete || !data.matches.length || !data.recipient?'disabled':''}>Send proposal now</button>`;
    proposalMessage(!data.complete?proposalStateMessages.incomplete:!data.matches.length?proposalStateMessages.no_matches:!data.configured?proposalStateMessages.unconfigured:'Your proposal is ready to email.');
  }catch(error){proposalMessage(error.message);}
  finally{proposalRequestBusy=false;if(button)button.disabled=false;}
}
async function sendEmailProposal(){
  if(proposalRequestBusy)return;proposalRequestBusy=true;
  const button=document.getElementById('proposal-send-button');if(button)button.disabled=true;
  try{handleProposalEmailResult(await proposalRequest('/user/proposal/send',{method:'POST',body:'{}'}));}
  catch(error){proposalMessage(error.message);}
  finally{proposalRequestBusy=false;if(button)button.disabled=false;}
}
