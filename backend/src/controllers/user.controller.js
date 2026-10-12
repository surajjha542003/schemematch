/**
 * SCHEME FINDER — User Controller
 */

const User = require('../models/User.model');
const ReviewedConditions = require('../data/shared')('reviewed-conditions');

function sanitize(user) {
  const { password, __v, ...rest } = user.toObject ? user.toObject() : user;
  return rest;
}

exports.getProfile = async (req, res, next) => {
  try {
    res.json({ data: sanitize(req.user) });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, profile } = req.body || {};
    if (name) req.user.name = name;
    if (profile) {
      const clean = { ...profile };
      if (Object.prototype.hasOwnProperty.call(clean, 'eligibilityDetails')) {
        clean.eligibilityDetails = ReviewedConditions.sanitizeDetails(clean.eligibilityDetails);
      }
      req.user.profile = { ...req.user.profile?.toObject?.() ?? req.user.profile, ...clean };
    }
    await req.user.save();
    let proposalEmail=null;
    if(profile && req.user.emailPreferences?.proposalOnProfileSave){
      try{proposalEmail=await require('../services/proposalEmail.service').sendProposal(req.user,{automatic:true});}
      catch(_){proposalEmail={state:'failed'};}
    }
    res.json({ data: sanitize(req.user),proposalEmail });
  } catch (err) {
    next(err);
  }
};

exports.getSaved = async (req, res, next) => {
  try {
    res.json({ data: req.user.savedSchemes });
  } catch (err) {
    next(err);
  }
};

exports.saveScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.user.savedSchemes.includes(id)) {
      req.user.savedSchemes.push(id);
      await req.user.save();
    }
    res.json({ data: req.user.savedSchemes });
  } catch (err) {
    next(err);
  }
};

exports.unsaveScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    req.user.savedSchemes = req.user.savedSchemes.filter(s => s !== id);
    await req.user.save();
    res.json({ data: req.user.savedSchemes });
  } catch (err) {
    next(err);
  }
};
