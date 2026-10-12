/**
 * SCHEME FINDER BACKEND — Vercel serverless entry point
 *
 * Wraps the Express app for Vercel Functions. DB connection is cached
 * across warm invocations (Fluid Compute reuses instances) instead of
 * reconnecting per request. Cron ingestion does not run here — serverless
 * functions have no persistent process; run ingestion via Vercel Cron
 * hitting a dedicated route instead, if needed.
 */

const app = require('../src/app');
const connectDB = require('../config/db');

let dbConnection;

module.exports = async (req, res) => {
  // Catalogue, condition checks and parsing do not need account persistence.
  if (!/^\/api\/v1\/(auth|user|ingestion)(?:\/|\?|$)/.test(req.url)) return app(req, res);
  if (!dbConnection) {
    dbConnection = connectDB().catch((err) => {
      console.warn('MongoDB unavailable — account persistence is unavailable.');
      dbConnection = null;
    });
  }
  await dbConnection;
  return app(req, res);
};
