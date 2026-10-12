/**
 * SCHEME FINDER — User Model
 * Mongoose schema for user accounts.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const {fields} = require('../data/shared')('reviewed-conditions');

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    // Set only by a trusted database operator; registration/profile never accept role.
    role:     { type: String, enum: ['student', 'scheme-reviewer'], default: 'student' },

    // Education profile
    profile: {
      age:    String,
      gender: String,
      state:  String,
      cat:    String,   // OBC | SC | ST | EWS | Minority | General
      inc:    String,   // income bracket key
      edu:    String,   // education level key
      marks:  String,
      stream: String,
      firstGrad: { type: String, enum: ['', 'Yes', 'No'] },
      disability: { type: String, enum: ['', 'Yes', 'No'] },
      parentDisabled: { type: String, enum: ['', 'Yes', 'No'] },
      parentOcc: { type: String, enum: ['', 'construction', 'government', 'other'] },
      // Self-declared matching facts only; never collect certificate IDs/files.
      eligibilityDetails: Object.fromEntries(Object.entries(fields).filter(([,spec])=>!spec.profileField).map(([key])=>[key,String])),
    },

    savedSchemes: [{ type: String }],  // array of scheme IDs
    emailPreferences: {proposalOnProfileSave:{type:Boolean,default:false}},
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
