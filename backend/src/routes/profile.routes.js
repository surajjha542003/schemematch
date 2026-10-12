/**
 * SCHEME FINDER — Profile Routes
 * POST /api/v1/profile/parse — natural-language self-description → structured JSON
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/profile.controller');
const { aiLimiter } = require('../middleware/rateLimiter');
router.use(aiLimiter);

router.post('/parse', ctrl.parseProfile);
router.post('/translate', ctrl.translateText);

module.exports = router;
