/**
 * SCHEME FINDER — Ingestion: Approved-Merge Field Allowlist
 *
 * Single source of truth for which extracted fields are allowed to touch a
 * live Scheme document, and how a discovered candidate becomes a new
 * browse-only Scheme doc. Shared by the manual review endpoint
 * (ingestion.controller.js, still available for anything that doesn't meet
 * the auto-apply bar) and the automatic high-confidence path
 * (runIngestion.js) — both go through the exact same narrow allowlist.
 * eligFn, amt/amtNum, verified, and confidence-of-the-live-record are never
 * touched by either path: eligibility logic is code, not scraped data, and
 * the amount/trust markers stay human-owned on purpose.
 */

const Scheme = require('../../models/Scheme.model');

function buildApprovedMerge(extracted, sourceUrl) {
  const update = { lastChecked: new Date() };
  if (sourceUrl) update.sourceDocument = sourceUrl;
  if (extracted?.applicationUrl) update.applicationUrl = extracted.applicationUrl;
  if (Array.isArray(extracted?.documents) && extracted.documents.length) update.documents = extracted.documents;
  if (extracted?.deadline) update.deadline = extracted.deadline;
  if (extracted?.academicYear) update.academicYear = extracted.academicYear;
  if (extracted?.department) update.department = extracted.department;
  return update;
}

// A discovered scheme has no eligFn and no human-confirmed amount yet — it
// only ever lands here as browse-only/unverified. amt/eligFn stay unset on
// purpose (same boundary buildApprovedMerge enforces for updates): a human
// still has to hand-author eligibility before it can be matched.
function buildNewSchemeDoc(schemeId, extracted, sourceUrl) {
  return {
    id: schemeId,
    name: extracted?.schemeNameFound || schemeId,
    by: extracted?.department || 'Unconfirmed — check official portal',
    type: 'scholarship',
    ico: '📋',
    col: 'sf',
    tags: ['Unverified — discovered via ingestion'],
    amt: 'Amount not confirmed — check official portal',
    status: 'unknown',
    confidence: 'low',
    applicationUrl: extracted?.applicationUrl || sourceUrl,
    documents: Array.isArray(extracted?.documents) ? extracted.documents : [],
    deadline: extracted?.deadline || null,
    academicYear: extracted?.academicYear || undefined,
    department: extracted?.department || undefined,
    sourceDocument: sourceUrl,
    lastChecked: new Date(),
  };
}

async function applyUpdateToScheme(schemeId, extracted, sourceUrl) {
  const update = buildApprovedMerge(extracted, sourceUrl);
  const updated = await Scheme.findOneAndUpdate({ id: schemeId }, { $set: update }, { new: true }).lean();
  return { applied: Boolean(updated), scheme: updated };
}

async function applyNewScheme(schemeId, extracted, sourceUrl) {
  const existing = await Scheme.findOne({ id: schemeId }).lean();
  if (existing) return { applied: false, reason: 'Scheme already exists — not overwritten by a discovery candidate.' };
  const doc = buildNewSchemeDoc(schemeId, extracted, sourceUrl);
  const created = await Scheme.create(doc);
  return { applied: true, scheme: created };
}

module.exports = { buildApprovedMerge, buildNewSchemeDoc, applyUpdateToScheme, applyNewScheme };
