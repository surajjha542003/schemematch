/**
 * SCHEME FINDER — Auth Middleware
 * JWT protection for private routes.
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorised — no token' });
  }
  if (require('mongoose').connection.readyState !== 1) return res.status(503).json({ error: 'Account database unavailable. Try again later.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'Not authorised — user no longer exists' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authorised — invalid token' });
  }
};

// Operator allowlist; never trust a client-supplied reviewer name or role.
exports.requireSchemeReviewer = (req, res, next) => {
  const allowed = (process.env.SCHEME_REVIEWER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (req.user?.role !== 'scheme-reviewer' || !req.user?.email || !allowed.includes(req.user.email.toLowerCase())) return res.status(403).json({ error: 'Scheme reviewer access required' });
  next();
};
