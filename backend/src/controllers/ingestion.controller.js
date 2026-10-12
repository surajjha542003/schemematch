/* Authenticated operator review. Approval records a reviewed proposal; publication
 * is a separate versioned catalogue edit/build so browser and API stay identical. */
const mongoose=require('mongoose');
const {runDailyIngestion}=require('../services/ingestion/runIngestion');
const Proposal=require('../models/SchemeChangeProposal.model');
const {officialUrl}=require('../data/shared')('source-policy');
exports.runNow=async(_req,res,next)=>{try{res.json({data:await runDailyIngestion()});}catch(e){next(e);}};
exports.listProposals=async(req,res,next)=>{
  try{
    if(mongoose.connection.readyState!==1)return res.status(503).json({error:'Review database unavailable'});
    const {status}=req.query;
    if(status && !['pending','approved','rejected'].includes(status))return res.status(400).json({error:'Invalid proposal status'});
    const data=await Proposal.find(status?{status}:{}).sort({createdAt:-1}).limit(100).lean();res.json({count:data.length,data});
  }catch(e){next(e);}
};
exports.reviewProposal=async(req,res,next)=>{
  try{
    if(mongoose.connection.readyState!==1)return res.status(503).json({error:'Review database unavailable'});
    if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Invalid proposal id'});
    const {decision,reviewNote}=req.body || {};
    if(!['approved','rejected'].includes(decision) || typeof reviewNote!=='string' || reviewNote.trim().length<10)return res.status(400).json({error:'Provide an approved/rejected decision and a review note of at least 10 characters.'});
    const pending=await Proposal.findOne({_id:req.params.id,status:'pending'}).lean();
    if(!pending)return res.status(409).json({error:'Proposal unavailable or already reviewed'});
    if(decision==='approved' && (!pending.fetchOk || !pending.extractionOk || !pending.sourceHash || !officialUrl(pending.sourceUrl) || !officialUrl(pending.finalUrl)))return res.status(400).json({error:'Approval requires successful source extraction, a source hash and approved source/final URLs.'});
    const data=await Proposal.findOneAndUpdate({_id:req.params.id,status:'pending'},{$set:{status:decision,reviewedBy:String(req.user._id),reviewedAt:new Date(),reviewNote:reviewNote.trim().slice(0,4000)}},{new:true});
    if(!data)return res.status(409).json({error:'Proposal was reviewed concurrently'});
    res.json({data,published:false,note:'Review recorded. Publish accepted facts through the versioned JSON catalogue and rebuild; eligibility rules remain pending until separately reviewed.'});
  }catch(e){next(e);}
};
