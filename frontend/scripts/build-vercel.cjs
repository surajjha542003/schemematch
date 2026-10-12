const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function apiBase(value){
  if(!value)return '';
  const url=new URL(value);
  if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash)throw new Error('SCHEMEMATCH_API_BASE must be a public HTTPS backend URL, without credentials, query or fragment.');
  const pathname=url.pathname.replace(/\/$/,'');
  if(pathname && pathname!=='/api/v1')throw new Error('Use the backend origin or its /api/v1 endpoint.');
  url.pathname='/api/v1';
  return url.href.replace(/\/$/,'');
}
function build({destination=path.join(root,'dist'),backendUrl=process.env.SCHEMEMATCH_API_BASE,requireBackend=process.env.VERCEL==='1'}={}){
  const endpoint=apiBase(backendUrl);
  if(requireBackend && !endpoint)throw new Error('Set SCHEMEMATCH_API_BASE in the frontend Vercel project to the backend HTTPS URL before deploying.');
  fs.cpSync(path.join(root,'src'),destination,{recursive:true});
  fs.writeFileSync(path.join(destination,'js/config.js'),'// Public backend endpoint only. Never put database or API secrets here.\nwindow.SCHEMEMATCH_CONFIG = { apiBase: '+JSON.stringify(endpoint)+' };\n');
  // config.js changes per hosting project; give this deployment its own offline cache.
  const workerPath=path.join(destination,'sw.js'),worker=fs.readFileSync(workerPath,'utf8');
  const version=crypto.createHash('sha256').update(worker).update(endpoint).digest('hex').slice(0,20);
  fs.writeFileSync(workerPath,worker.replace(/const CACHE='schemematch-public-[a-f0-9]+';/,"const CACHE='schemematch-public-"+version+"';"));
  console.log('Prepared standalone frontend with its public API configuration and offline cache.');
  return {endpoint,destination};
}
if(require.main===module)build();
module.exports={apiBase,build};
