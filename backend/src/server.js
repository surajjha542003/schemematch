/**
 * SCHEME FINDER BACKEND — Server Entry Point
 * Stage 2 scaffold.
 */

require('dotenv').config();

const cron = require('node-cron');
const app = require('./app');
const connectDB = require('../config/db');
const { runDailyIngestion } = require('./services/ingestion/runIngestion');

const PORT = process.env.PORT || 5050;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    // Scheme matching (TN dataset + conflict engine) is static data — it
    // works without Mongo. Only auth/profile-persistence routes need a DB.
    console.warn('MongoDB unavailable — running without account persistence.');
  }
  app.listen(PORT, () => {
    console.log(`Scheme Finder API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  // Daily scheme-source ingestion check, 03:00 server time. Writes proposed
  // changes to SchemeChangeProposal for review — never overwrites verified
  // data automatically. See services/ingestion/runIngestion.js.
  if (process.env.INGESTION_ENABLED === 'true') cron.schedule('0 3 * * *', () => {
    runDailyIngestion().catch(err => console.warn('[ingestion] daily run failed:', err.message));
  }, { timezone: 'Asia/Kolkata' });
}

start();
