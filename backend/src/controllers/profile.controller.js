/**
 * SCHEME FINDER — Profile Controller
 * Free-text student self-description → structured profile JSON.
 * Extraction only — see services/profileParser.service.js for the boundary.
 */

const { parseProfileText } = require('../services/profileParser.service');

exports.parseProfile = async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || text.length > 4000) {
      return res.status(400).json({ error: 'Provide a "text" field with the student\'s self-description.' });
    }
    const result = await parseProfileText(text);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

exports.translateText = async (req, res, next) => {
  try {
    const { text, targetLang = 'en', sourceLang = 'auto' } = req.body || {};
    if (typeof text !== 'string' || !text.trim() || text.length > 4000 || typeof targetLang !== 'string' || typeof sourceLang !== 'string') {
      return res.status(400).json({ error: 'Provide text and valid language codes.' });
    }
    const tl = targetLang.split('-')[0];
    const sl = sourceLang.split('-')[0];
    if (!/^[a-z]{2,3}$/.test(tl) || !/^(?:auto|[a-z]{2,3})$/.test(sl)) {
      return res.status(400).json({ error: 'Invalid language code.' });
    }
    const clean = text.trim();
    for (const language of [...new Set(['auto', sl])]) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${language}&tl=${tl}&dt=t&q=${encodeURIComponent(clean)}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) continue;
        const data = await response.json();
        if (!Array.isArray(data?.[0])) continue;
        const translated = data[0].map(c => c?.[0] || '').join('').trim();
        if (translated && (translated !== clean || data[2] === tl)) {
          return res.json({ data: { translated, sourceLang: data[2] || language, status: 'translated' } });
        }
      } catch(e) {
        // Try the next source-language hint; never report untranslated input as success.
      } finally { clearTimeout(timeout); }
    }
    return res.status(503).json({ error: 'Translation is unavailable. Retry or fill the form manually.', data: { status: 'unavailable' } });
  } catch(err) { next(err); }
};
