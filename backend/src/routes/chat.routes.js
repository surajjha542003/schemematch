/**
 * SCHEME FINDER — Chat Routes
 * POST /api/v1/chat — free-text student question → grounded AI reply.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chat.controller');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', aiLimiter, ctrl.chat);

module.exports = router;
