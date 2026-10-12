const { officialUrl } = require('../../data/shared')('source-policy');

async function officialFetch(url, options = {}) {
  let current = officialUrl(url);
  if (!current) throw new Error('Source URL is outside the approved official domain policy');
  for (let i = 0; i < 5; i++) {
    const response = await fetch(current, { ...options, redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const next = officialUrl(new URL(response.headers.get('location'), current).href);
      await response.body?.cancel();
      if (!next) throw new Error('Source redirected outside the approved official domain policy');
      current = next;
    } else {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { response, finalUrl: current };
    }
  }
  throw new Error('Too many source redirects');
}
async function boundedBody(response, limit = 10 * 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error('Official source exceeds fetch size limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
module.exports = { officialFetch, boundedBody };
