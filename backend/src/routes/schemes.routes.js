/**
 * SCHEME FINDER — Schemes Routes (Stage 2 scaffold)
 * GET /api/v1/schemes         — list all schemes (with optional filters)
 * GET /api/v1/schemes/:id     — single scheme detail
 * POST /api/v1/schemes/match  — score schemes against a user profile (body)
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/schemes.controller');
const { aiLimiter } = require('../middleware/rateLimiter');

router.get('/',          ctrl.listSchemes);
router.get('/:id',       ctrl.getScheme);
router.post('/match',    aiLimiter, ctrl.matchSchemes);

module.exports = router;
