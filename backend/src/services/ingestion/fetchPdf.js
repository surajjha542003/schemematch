const { officialFetch, boundedBody } = require('./officialFetch');
const { createHash } = require('node:crypto');
/**
 * SCHEME FINDER BACKEND — Ingestion: PDF / Government Order Fetch Stage
 * pdf-parse equivalent of pdfplumber/PyMuPDF. Text-layer PDFs only — a
 * scanned/image-only PDF will come back with near-empty text; that's the
 * hook point for an OCR stage (not wired in this pass — see runIngestion.js
 * header for why), so the caller can detect low-text-yield and flag it
 * rather than silently proceeding with nothing.
 */

async function fetchPdfText(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let parser;
  try {
    const { PDFParse } = require('pdf-parse');
    const { response: res, finalUrl } = await officialFetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await boundedBody(res);
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const text = (parsed.text || '').replace(/\s+/g, ' ').trim();
    return {
      ok: true,
      text: text.slice(0, 20000), finalUrl, sourceHash:createHash('sha256').update(buffer).digest('hex'), textTruncated:text.length > 20000,
      lowTextYield: text.length < 200, // likely scanned — needs OCR, not implemented here
      pages: parsed.total,
      fetchedAt: new Date().toISOString(),
      url,
    };
  } catch (err) {
    return { ok: false, error: err.message, fetchedAt: new Date().toISOString(), url };
  } finally {
    clearTimeout(timeout);
    await parser?.destroy();
  }
}

module.exports = { fetchPdfText };
