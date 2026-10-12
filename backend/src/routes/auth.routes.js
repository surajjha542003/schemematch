/**
 * SCHEME FINDER — Auth Routes  (Stage 2 scaffold)
 *
 * POST /api/v1/auth/register  — create a new account
 * POST /api/v1/auth/login     — login, returns JWT
 * GET  /api/v1/auth/me        — get current user (protected)
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');
router.use(authLimiter);

router.use((_req, res, next) => {
  if (require('mongoose').connection.readyState !== 1) return res.status(503).json({ error: 'Account database unavailable. Try again later.' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /change.me|your.secret/i.test(process.env.JWT_SECRET)) return res.status(503).json({ error: 'Account service requires a configured JWT secret.' });
  next();
});

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        protect, ctrl.getMe);

module.exports = router;
