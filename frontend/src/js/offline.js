/* Cache the public app shell; profile/account/API responses are never cached. */
window.addEventListener('load',async()=>{
  if(!('serviceWorker' in navigator))return;
  let refreshing=false;const hadController=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController && !refreshing){refreshing=true;location.reload();}});
  try{await navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{updateViaCache:'none'});}catch(_){/* The app remains usable; do not claim an offline installation succeeded. */}
});
