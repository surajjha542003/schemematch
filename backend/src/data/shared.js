// Canonical browser modules locally; copied build artifacts in a standalone API deployment.
const fs=require('node:fs'),path=require('node:path');
const names=new Set(['scheme-catalog','reviewed-conditions','programme-rules','source-policy']);
module.exports=function loadShared(name){
  if(!names.has(name))throw new Error('Unsupported shared module');
  const canonical=path.resolve(__dirname,'../../../frontend/src/js',name+'.js');
  const bundled=path.resolve(__dirname,'../../shared',name+'.js');
  return require(fs.existsSync(canonical)?canonical:bundled);
};
