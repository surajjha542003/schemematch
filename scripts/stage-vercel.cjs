// Stage the current working code for two independent Vercel projects.
// An explicit allowlist keeps credentials, student data and local reports out of uploads.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function stage(destination=fs.mkdtempSync(path.join(os.tmpdir(),'schemematch-vercel-'))){
  const backend=path.join(destination,'backend-project'),frontend=path.join(destination,'frontend-project');
  function copy(base,relative){
    const target=path.join(base,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.cpSync(path.join(root,relative),target,{recursive:true});
  }
  for(const relative of ['backend/src','backend/api','backend/scripts','backend/config/db.js','backend/package.json','backend/package-lock.json','backend/vercel.json'])copy(backend,relative);
  for(const name of ['scheme-catalog','reviewed-conditions','programme-rules','source-policy'])copy(backend,'frontend/src/js/'+name+'.js');
  for(const relative of ['frontend/src','frontend/scripts','frontend/vercel.json'])copy(frontend,relative);
  for(const dir of [backend,frontend]){
    fs.writeFileSync(path.join(dir,'.vercelignore'),'.env\n.env*\n**/.env\n**/.env*\n**/node_modules\n**/dist\n**/test\n**/*.log\n');
    function audit(current){for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      if(/^\.env(?:\.|$)/.test(entry.name)||entry.name==='node_modules'||entry.isSymbolicLink())throw new Error('Private or unexpected upload path: '+entry.name);
      if(entry.isDirectory())audit(path.join(current,entry.name));
    }}
    audit(dir);
  }
  return {backend,frontend};
}
if(require.main===module)console.log(JSON.stringify(stage(),null,2));
module.exports={stage};
