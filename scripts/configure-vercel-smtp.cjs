// Upload only verified SMTP settings to the existing backend. Never print values.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const env=require('../backend/node_modules/dotenv').parse(fs.readFileSync(path.join(root,'backend/.env')));
const {smtpConfig}=require('../backend/src/services/proposalEmail.service');
const settings=require('../docs/vercel-projects.json');
(async()=>{
 const config=smtpConfig(env);if(!config)throw new Error('SMTP configuration is incomplete.');
 const transport=require('../backend/node_modules/nodemailer').createTransport(config.transport);
 try{await transport.verify();}finally{transport.close();}
 for(const key of ['SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_FROM','SMTP_PASS']){
  const value=key==='SMTP_FROM'?env[key] || env.SMTP_USER:key==='SMTP_SECURE'?String(config.transport.secure):key==='SMTP_PORT'?String(config.transport.port):env[key];
  const result=spawnSync('vercel',['env','add',key,'production','--project',settings.projects.backend.projectId,'--scope',settings.scope,'--sensitive','--force','--yes','--local-config',path.join(root,'backend/vercel.json')],{cwd:root,input:value+'\n',encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
  if(result.status!==0)throw new Error('Could not configure '+key+' on Vercel. Previously updated keys are retained; rerun to finish.');
  console.log(key+' configured on the backend Production environment. Value hidden.');
 }
 console.log('Verified SMTP settings configured securely. Redeploy the backend to apply them.');
})().catch(error=>{console.error(error.code?'SMTP configuration failed ('+String(error.code).replace(/[^A-Za-z0-9_]/g,'')+').':error.message);process.exitCode=1;});
