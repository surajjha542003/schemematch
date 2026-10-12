// Deploy only the allowlisted current working source to the existing separate projects.
// Credentials remain in the backend project's Vercel environment settings.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {stage}=require('./stage-vercel.cjs'),settings=require('../docs/vercel-projects.json');
const role=process.argv[2];
if(!['backend','frontend'].includes(role))throw new Error('Choose backend or frontend.');
const project=settings.projects[role],upload=stage()[role],metadata=path.join(upload,'.vercel');
fs.mkdirSync(metadata,{recursive:true});
fs.writeFileSync(path.join(metadata,'project.json'),JSON.stringify({projectId:project.projectId,orgId:project.orgId,projectName:project.name}));
const config=path.join(role,'vercel.json');
const args=['deploy',...(process.argv.includes('--dry')?['--dry']:['--prod','--yes']),'--local-config',config,'--scope',settings.scope];
console.log('Target: '+project.name+' ('+project.url+'). Upload contains no local environment files.');
// Use the staged directory as the process cwd as well as an explicit config path:
// this prevents the legacy combined root vercel.json from being selected.
const child=spawn('vercel',args,{cwd:upload,stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});
child.on('close',code=>{process.exitCode=code??1;});
