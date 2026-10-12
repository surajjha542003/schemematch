const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {apiBase,build}=require('../../frontend/scripts/build-vercel.cjs');
const {prepare}=require('../scripts/prepare-vercel.cjs');
const backend=path.resolve(__dirname,'..');
function temporary(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'schemematch-deploy-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
test('frontend build connects only to a public HTTPS backend, generates offline config, and rejects missing or unsafe endpoints',t=>{
 const dir=temporary(t),first=path.join(dir,'first'),second=path.join(dir,'second');
 assert.equal(apiBase('https://api.example.test'),'https://api.example.test/api/v1');
 assert.equal(apiBase('https://api.example.test/api/v1/'),'https://api.example.test/api/v1');
 for(const value of ['http://api.example.test','https://user:password@api.example.test','https://api.example.test?key=secret','https://api.example.test/#x','https://api.example.test/wrong'])assert.throws(()=>apiBase(value));
 assert.throws(()=>build({destination:first,backendUrl:'',requireBackend:true}),/SCHEMEMATCH_API_BASE/);
 build({destination:first,backendUrl:'https://first.example.test',requireBackend:true});
 build({destination:second,backendUrl:'https://second.example.test',requireBackend:true});
 const config=fs.readFileSync(path.join(first,'js/config.js'),'utf8');
 assert.match(config,/https:\/\/first.example.test\/api\/v1/);assert.doesNotMatch(config,/MONGODB_URI|JWT_SECRET|OPEN_ROUTER/);
 assert.ok(fs.existsSync(path.join(first,'index.html')));assert.equal(fs.existsSync(path.join(first,'.env')),false);
 const cache=dir=>fs.readFileSync(path.join(dir,'sw.js'),'utf8').match(/const CACHE='([^']+)'/)[1];assert.notEqual(cache(first),cache(second));
});
test('standalone backend works without frontend source files, preserves match parity, and permits only configured browser origins',t=>{
 const dir=temporary(t);prepare();
 for(const name of ['src','api','shared'])fs.cpSync(path.join(backend,name),path.join(dir,name),{recursive:true});
 // config has an example and the connection helper; never copy local environment files.
 fs.mkdirSync(path.join(dir,'config'));fs.copyFileSync(path.join(backend,'config/db.js'),path.join(dir,'config/db.js'));
 fs.symlinkSync(path.join(backend,'node_modules'),path.join(dir,'node_modules'),'dir');
 assert.equal(fs.existsSync(path.join(dir,'frontend')),false);assert.equal(fs.existsSync(path.join(dir,'.env')),false);
 const script=`
 const assert=require('node:assert/strict'),http=require('node:http');
 process.env.NODE_ENV='production';process.env.ALLOWED_ORIGIN='https://frontend.example.test, https://preview.example.test';process.env.OPEN_ROUTER='';
 const Catalog=require('./src/data/shared')('scheme-catalog'),Rules=require('./src/data/shared')('programme-rules');
 const handler=require('./api/index');const server=http.createServer(handler);
 (async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const url='http://127.0.0.1:'+server.address().port;
 for(const origin of ['https://frontend.example.test','https://preview.example.test']){
 const res=await fetch(url+'/health',{headers:{Origin:origin}});assert.equal(res.status,200);assert.equal(res.headers.get('access-control-allow-origin'),origin);}
 const denied=await fetch(url+'/health',{headers:{Origin:'https://unlisted.example.test'}});assert.equal(denied.headers.get('access-control-allow-origin'),null);
 const preflight=await fetch(url+'/api/v1/schemes/match',{method:'OPTIONS',headers:{Origin:'https://frontend.example.test','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,authorization'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://frontend.example.test');
 const list=await (await fetch(url+'/api/v1/schemes')).json();assert.equal(list.count,120);assert.equal(list.catalogueVersion,Catalog.version);
 const profile={cat:'OBC',edu:'ug-tech',inc:'under1',state:'Telangana',gender:'Female',disability:'No',eligibilityDetails:{}};
 const res=await fetch(url+'/api/v1/schemes/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)});assert.equal(res.status,200);const result=(await res.json()).data;
 assert.deepEqual(result.needsVerification.map(s=>[s.id,s.matchPercent]),Rules.matches(Catalog.records,profile).needsVerification.map(s=>[s.id,s.matchPercent]));
 console.log('Standalone backend, catalogue/match parity and CORS passed.');
 }finally{await new Promise(resolve=>server.close(resolve));}
 })().catch(e=>{console.error(e);process.exitCode=1;});`;
 const output=execFileSync(process.execPath,['-e',script],{cwd:dir,encoding:'utf8',timeout:20000});assert.match(output,/Standalone backend, catalogue\/match parity and CORS passed/);
});
