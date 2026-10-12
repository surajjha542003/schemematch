/* SchemeMatch — stable page translation, separate from speech recognition. */
const LANGS = [
  {code:'en',label:'English'},{code:'hi',label:'हिंदी'},{code:'ta',label:'தமிழ்'},
  {code:'te',label:'తెలుగు'},{code:'kn',label:'ಕನ್ನಡ'},{code:'ml',label:'മലയാളം'},
  {code:'bn',label:'বাংলা'},{code:'mr',label:'मराठी'},{code:'gu',label:'ગુજરાતી'},
  {code:'pa',label:'ਪੰਜਾਬੀ'},{code:'ur',label:'اردو'}
];
let languageRequest=0, translationWidgetStarted=false, appliedLanguage='en';
const LANGUAGE_SCRIPTS={hi:/[\u0900-\u097F]/,mr:/[\u0900-\u097F]/,ta:/[\u0B80-\u0BFF]/,te:/[\u0C00-\u0C7F]/,kn:/[\u0C80-\u0CFF]/,ml:/[\u0D00-\u0D7F]/,bn:/[\u0980-\u09FF]/,gu:/[\u0A80-\u0AFF]/,pa:/[\u0A00-\u0A7F]/,ur:/[\u0600-\u06FF]/};
function confirmPageTranslation(code,request,attempts=80){
  if(request!==languageRequest)return;
  const heading=document.querySelector(document.getElementById('pg-app')?.classList.contains('active')?'#abTitle':'.hh1');
  // A provider accepting an option is not proof that it translated the page.
  if(heading && LANGUAGE_SCRIPTS[code]?.test(heading.textContent)){
    appliedLanguage=code;document.documentElement.lang=code;document.documentElement.dir=code==='ur'?'rtl':'ltr';
    try{localStorage.setItem('sf_lang',code);}catch(_){}
    setLanguageStatus('Machine translation · verify details at the official source');return;
  }
  if(attempts<=0){setLanguageStatus('Page translation could not be confirmed. Retry or choose English.');return;}
  setTimeout(()=>confirmPageTranslation(code,request,attempts-1),250);
}
function currentLangFromCookie(){
  const code=document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z-]+)/)?.[1];
  return LANGS.some(l=>l.code===code)?code:'en';
}
function setLanguageStatus(text){const el=document.getElementById('langStatus');if(el)el.textContent=text;}
function placeLanguageControl(){
  const control=document.getElementById('languageControl');
  const app=document.getElementById('pg-app')?.classList.contains('active');
  const target=document.querySelector(app?'.ab-r':'.lnav-actions');
  if(control && target && control.parentElement!==target)target.appendChild(control);
}
window.placeLanguageControl=placeLanguageControl;
function googleTranslateElementInit(){
  if(translationWidgetStarted || !window.google?.translate?.TranslateElement)return;
  translationWidgetStarted=true;
  new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:LANGS.filter(l=>l.code!=='en').map(l=>l.code).join(','),autoDisplay:false},'google_translate_element');
}
window.googleTranslateElementInit=googleTranslateElementInit;
function withGoogleCombo(fn,attempts=80,request=languageRequest,code=null){
  if(request!==languageRequest)return;
  const combo=document.querySelector('.goog-te-combo');
  if(combo && (!code || [...combo.options].some(option=>option.value===code)))return fn(combo);
  if(attempts<=0){setLanguageStatus('Translation unavailable. Try again or use English.');document.getElementById('langSwitch').value=appliedLanguage;return;}
  setTimeout(()=>withGoogleCombo(fn,attempts-1,request,code),250);
}
function switchLanguage(code){
  if(!LANGS.some(l=>l.code===code))return;
  const request=++languageRequest;
  if(code==='en'){
    try{localStorage.setItem('sf_lang','en');}catch(_){}
    for(const domain of ['',location.hostname,'.'+location.hostname])document.cookie='googtrans=; Max-Age=0; path=/'+(domain?'; domain='+domain:'');
    document.cookie='googtrans=/en/en; path=/';
    location.reload();return;
  }
  setLanguageStatus('Loading translation…');
  withGoogleCombo(combo=>{
    combo.value=code;
    if(combo.value!==code){setLanguageStatus('This translation is unavailable.');document.getElementById('langSwitch').value=appliedLanguage;return;}
    combo.dispatchEvent(new Event('change',{bubbles:true}));
    setLanguageStatus('Translating page…');
    confirmPageTranslation(code,request);
  },80,request,code);
}
function initLangSwitcher(){
  const sel=document.getElementById('langSwitch');if(!sel)return;
  sel.innerHTML=LANGS.map(l=>`<option value="${l.code}">${l.label}</option>`).join('');
  let saved;try{saved=localStorage.getItem('sf_lang');}catch(_){}
  const code=LANGS.some(l=>l.code===saved)?saved:currentLangFromCookie();
  sel.value=code;
  sel.addEventListener('change',()=>switchLanguage(sel.value));
  placeLanguageControl();
  // Register the callback before loading Google; the previous async tag raced it.
  const script=document.createElement('script');
  script.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async=true;
  script.onerror=()=>{setLanguageStatus('Translation unavailable. English remains available.');if(appliedLanguage==='en')document.getElementById('langSwitch').value='en';};
  document.head.appendChild(script);
  if(code!=='en')switchLanguage(code);
}
window.addEventListener('DOMContentLoaded',initLangSwitcher);
