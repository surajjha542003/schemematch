/**
 * SCHEME FINDER — Ingestion Routes
 * POST /api/v1/ingestion/run             — trigger the pipeline now (demo/manual)
 * GET  /api/v1/ingestion/proposals       — list change proposals (?status=pending)
 * PATCH /api/v1/ingestion/proposals/:id  — approve/reject a proposal
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ingestion.controller');
const { protect, requireSchemeReviewer } = require('../middleware/auth.middleware');

router.use(protect, requireSchemeReviewer);

router.post('/run', ctrl.runNow);
router.get('/proposals', ctrl.listProposals);
router.patch('/proposals/:id', ctrl.reviewProposal);

module.exports = router;
