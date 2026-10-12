/**
 * SCHEME FINDER — Schemes Controller
 * Tamil Nadu scheme matcher: eligibility scoring + conflict-aware best-fit.
 */

const { ALL_SCHEMES } = require('../data/catalog');
const Catalog = require('../data/shared')('scheme-catalog');
const { computeBestFit } = require('../services/conflictEngine');
const { explainMatch } = require('../services/aiExplain.service');
const { enrichScheme, enrichSchemeList } = require('../utils/schemeEnrichment');
const ReviewedConditions = require('../data/shared')('reviewed-conditions');
const ProgrammeRules = require('../data/shared')('programme-rules');

// Strip the non-serializable eligFn before sending a scheme to the client.
function serializeScheme(s) {
  const { eligFn, ...rest } = s;
  return rest;
}

const REQUIRED_PROFILE_FIELDS = ['cat', 'edu', 'inc'];

function validateProfile(body) {
  return REQUIRED_PROFILE_FIELDS.filter(f => !body || !body[f]);
}

// Publish the versioned shared bundle even when an older Mongo seed exists.
exports.listSchemes = async (req, res, next) => {
  try {
    const { type, state, sector } = req.query;
    const filterCatalog = records => records.filter(s => (!type || s.type === type) && (!sector || (sector==='other' ? s.sector && s.sector!=='students' : (s.sector || 'students')===sector)) &&
      (!state || (state === 'central' ? !s.state && !s.id.startsWith('tn-') : (s.state || (s.id.startsWith('tn-') ? 'Tamil Nadu' : null)) === state)));
    let data = ALL_SCHEMES;
    data = filterCatalog(data);
    res.json({ count: data.length, data: enrichSchemeList(data.map(serializeScheme)), source: 'static', catalogueVersion: Catalog.version });
  } catch (err) {
    next(err);
  }
};

exports.getScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scheme = ALL_SCHEMES.find(s => s.id === id);
    if (!scheme) return res.status(404).json({ error: `Scheme "${id}" not found` });
    res.json({ data: { ...serializeScheme(scheme), ...enrichScheme(scheme) }, source: 'static', catalogueVersion: Catalog.version });
  } catch (err) {
    next(err);
  }
};

exports.matchSchemes = async (req, res, next) => {
  try {
    const profile = req.body || {};
    const missing = validateProfile(profile);
    if (missing.length) {
      return res.status(400).json({
        error: 'Incomplete profile',
        message: `Missing required field(s): ${missing.join(', ')}. Provide at least category, education level, and income to get accurate results.`,
        missing,
      });
    }

    const result = computeBestFit(profile, ALL_SCHEMES);

    const eligible = enrichSchemeList(result.eligible.map(serializeScheme));
    const needsVerification = enrichSchemeList(result.needsVerification.map(serializeScheme));
    const bestCombo = enrichSchemeList(result.bestCombo.map(serializeScheme));
    const excludedByConflict = enrichSchemeList(result.excludedByConflict.map(serializeScheme));
    const bestSingle = result.bestSingle
      ? { ...serializeScheme(result.bestSingle), ...enrichScheme(result.bestSingle) }
      : null;

    const matchPayload = {
      catalogueVersion: Catalog.version,
      relevantListings: ProgrammeRules.rank(Catalog.forProfile(profile),profile,{excludeFailed:true}).map(row=>row.s),
      reviewedConditions: ReviewedConditions.review(ALL_SCHEMES, profile),
      eligible,
      needsVerification,
      bestSingle,
      bestCombo,
      comboTotalValue: result.comboTotalValue,
      excludedByConflict,
      comboCompatibility: result.comboCompatibility,
    };

    // AI explanation is a pure phrasing layer over the already-decided
    // result above — see aiExplain.service.js. Never blocks: falls back to
    // a deterministic template if OPEN_ROUTER is unavailable.
    const explanation = await explainMatch(matchPayload);

    res.json({ data: { ...matchPayload, explanation } });
  } catch (err) {
    next(err);
  }
};
