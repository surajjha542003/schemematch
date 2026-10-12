/**
 * SCHEME FINDER — User Routes  (Stage 2 scaffold)
 *
 * GET    /api/v1/user/profile    — get saved profile
 * PUT    /api/v1/user/profile    — update profile
 * GET    /api/v1/user/saved      — get saved schemes
 * POST   /api/v1/user/saved/:id  — save a scheme
 * DELETE /api/v1/user/saved/:id  — unsave a scheme
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const emailCtrl=require('../controllers/proposalEmail.controller');
const {emailLimiter}=require('../middleware/rateLimiter');

router.use(protect);

router.get('/profile',        ctrl.getProfile);
router.put('/profile',        ctrl.updateProfile);
router.get('/proposal',emailCtrl.preview);
router.put('/email-preferences',emailCtrl.preferences);
router.post('/proposal/send',emailLimiter,emailCtrl.send);
router.get('/saved',          ctrl.getSaved);
router.post('/saved/:id',     ctrl.saveScheme);
router.delete('/saved/:id',   ctrl.unsaveScheme);

module.exports = router;
