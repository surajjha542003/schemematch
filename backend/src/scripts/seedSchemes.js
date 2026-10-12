/**
 * SCHEME FINDER — Seed the reviewed shared catalogue into MongoDB
 * Usage: node src/scripts/seedSchemes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const Scheme = require('../models/Scheme.model');
const { ALL_SCHEMES } = require('../data/catalog');
const { enrichScheme } = require('../utils/schemeEnrichment');

function toDoc(s) {
  const { eligFn, ...rest } = s;
  const enriched = enrichScheme(s);
  return { ...rest, ...enriched, lastChecked: s.sourceChecked ? new Date(s.sourceChecked) : undefined };
}

async function seed() {
  await connectDB();

  const docs = ALL_SCHEMES.map(toDoc);
  let upserted = 0;
  for (const doc of docs) {
    await Scheme.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    upserted++;
  }

  console.log(`Seeded ${upserted} schemes into MongoDB (${mongoose.connection.name}).`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
