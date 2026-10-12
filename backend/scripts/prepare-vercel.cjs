// Copy only the four public rule modules. No environment files or student data.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../frontend/src/js'),target=path.join(root,'shared');
const modules=['scheme-catalog','reviewed-conditions','programme-rules','source-policy'];
function prepare(){
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public/index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><title>SchemeMatch API</title><h1>SchemeMatch API</h1><p><a href="/health">Health check</a> · <a href="/api/v1/schemes">Public scholarship catalogue</a></p></html>');
  fs.mkdirSync(target,{recursive:true});
  for(const name of modules)fs.copyFileSync(path.join(source,name+'.js'),path.join(target,name+'.js'));
  console.log('Prepared four shared catalogue/rule modules for the standalone backend.');
}
if(require.main===module)prepare();
module.exports={prepare};
