const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema(
  {
    id:             { type: String, required: true, unique: true },
    ico:            String,
    col:            String,
    type:           String,
    name:           { type: String, required: true },
    by:             String,
    portal:         String,
    amt:            String,
    amtNum:         Number,
    tags:           [String],
    exclusiveGroup: String,
    conflictsWith:  [String],
    verified:       String,
    confidence:     String,
    source:         String,
    department:     String,
    academicYear:   String,
    status:         { type: String, default: 'unknown' }, // active | closed | unknown
    state:          String,
    sector:         String,
    matchingEnabled: { type: Boolean, default: false },
    eligibilityVerification: { type: String, default: 'pending' },
    sourceChecked: String,
    sourceVerification: String,
    verificationScope: String,
    accessNote: String,
    evidenceSummary: String,
    beneficiaryVerification: String,
    documentsVerified: Boolean,
    documentsNote: String,
    deadlineVerified: Boolean,
    deadlineSource: String,
    deadlineChecked: String,
    applicationRoute: String,
    benefitVerified: Boolean,
    benefitSource: String,
    reviewedConditions: mongoose.Schema.Types.Mixed,
    documents:      [String],
    applicationUrl: String,
    registrationUrl: String,
    applicationAccess: String,
    applicationNote: String,
    applicationSource: String,
    applicationChecked: String,
    applicationOptions: [{label:String,url:String}],
    deadline:       String, // ISO date, or null if unconfirmed
    sourceDocument: String, // PDF/GO filename or URL, if the rule came from a document
    lastChecked:    Date,
    durationYears:  Number, // total years the award can be renewed for, if fixed
    renewal: {
      minAttendance: Number,  // percent required to stay eligible next year
      minMarks:      Number,  // percent required in semester/annual exams to renew
      noArrears:     Boolean, // true if an active backlog/arrear blocks renewal
      windowMonths:  [String], // e.g. ['Aug','Sep'] — renewal application window
      notes:         String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scheme', SchemeSchema);
