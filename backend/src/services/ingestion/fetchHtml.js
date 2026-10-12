const { officialFetch, boundedBody } = require('./officialFetch');
const { createHash } = require('node:crypto');
const cheerio = require('cheerio');

async function fetchHtmlText(url, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { response: res, finalUrl } = await officialFetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SchemeFinderBot/1.0 (+official-source ingestion; contact: harshkumargupta630@gmail.com)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = (await boundedBody(res, 2 * 1024 * 1024)).toString('utf8');
    const $ = cheerio.load(html);
    $('script, style, noscript, nav, header, footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return { ok: true, text: text.slice(0, 20000), finalUrl, sourceHash:createHash('sha256').update(html).digest('hex'), textTruncated:text.length > 20000, fetchedAt: new Date().toISOString(), url };
  } catch (err) {
    return { ok: false, error: err.message, fetchedAt: new Date().toISOString(), url };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchHtmlText };
