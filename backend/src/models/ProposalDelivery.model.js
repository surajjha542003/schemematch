const mongoose = require('mongoose');

// One durable send record per account, shared across Vercel instances.
module.exports = mongoose.model('ProposalDelivery', new mongoose.Schema({
  userId: {type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true},
  leaseId:String,leaseUntil:Date,nextAllowedAt:Date,
  lastDigest:String,lastSentAt:Date,sentDay:String,sentCount:{type:Number,default:0},
}, {timestamps:true}));
