/**
 * SCHEME FINDER — Rate Limiting
 *
 * `/schemes/match` and `/chat` both call OpenRouter (aiExplain.service.js /
 * chatReply.service.js) — unmetered, they're an open cost + abuse vector.
 * Capped per-IP; deliberately generous enough not to bother a real student
 * clicking around, tight enough to stop a script hammering the endpoint.
 */

const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment and try again.' },
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many account attempts. Try again later.' } });
const emailLimiter=rateLimit({windowMs:60*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,message:{error:'Too many email requests. Try again later.'}});
module.exports = { aiLimiter, authLimiter, emailLimiter };
