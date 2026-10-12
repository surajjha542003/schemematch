// Tests SMTP connection/authentication without sending an email or printing secrets.
const path=require('node:path');
require('../backend/node_modules/dotenv').config({path:path.resolve(__dirname,'../backend/.env')});
const {smtpConfig}=require('../backend/src/services/proposalEmail.service');
const config=smtpConfig();
if(!config){
  console.error('SMTP is not configured. Add the Gmail App Password to SMTP_PASS in backend/.env, then retry.');
  process.exitCode=1;
}else{
  const transport=require('../backend/node_modules/nodemailer').createTransport(config.transport);
  transport.verify().then(()=>console.log('SMTP connection and authentication succeeded. No email was sent.'))
    .catch(error=>{console.error('SMTP verification failed ('+String(error.code || 'connection error').replace(/[^A-Za-z0-9_ -]/g,'')+'). Check the App Password and network connection.');process.exitCode=1;})
    .finally(()=>transport.close());
}
