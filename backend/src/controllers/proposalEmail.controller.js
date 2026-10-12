const Mail=require('../services/proposalEmail.service');

exports.preview=async(req,res,next)=>{
  try{res.json({data:{...Mail.proposalFor(req.user),configured:Boolean(Mail.smtpConfig()),automatic:Boolean(req.user.emailPreferences?.proposalOnProfileSave)}});}catch(error){next(error);}
};
exports.preferences=async(req,res,next)=>{
  try{
    if(typeof req.body?.automatic!=='boolean')return res.status(400).json({error:'Choose whether automatic proposal emails are enabled.'});
    req.user.emailPreferences={proposalOnProfileSave:req.body.automatic};await req.user.save();
    res.json({data:{automatic:req.body.automatic,configured:Boolean(Mail.smtpConfig()),recipient:req.user.email}});
  }catch(error){next(error);}
};
exports.send=async(req,res,next)=>{
  try{
    // Neither recipient nor profile can be supplied by the client.
    if(req.body?.automatic===true && !req.user.emailPreferences?.proposalOnProfileSave)return res.json({data:{state:'disabled',count:0}});
    const result=await Mail.sendProposal(req.user,{automatic:req.body?.automatic===true});
    res.status(['unconfigured','failed'].includes(result.state)?503:200).json({data:result});
  }catch(error){next(error);}
};
