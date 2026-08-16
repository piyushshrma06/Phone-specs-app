/**
 * pipeline.js
 *
 * Wires the three agents into ONE function: given a phone slug, fetch
 * raw data, clean it, get a verdict. This is what cacheService.js calls
 * on a cache miss - it doesn't need to know these are 3 separate agents,
 * just that this function returns { cleaned, verdict }.
 */

const { getPhoneDetails } = require('../dataSources/specsApi');
const { analyzePhone } = require('./analyst');
const { getVerdict } = require('./verdict');

async function runPipeline(slug) {
  const raw = await getPhoneDetails(slug);
  const cleaned = analyzePhone(raw);
  const verdict = await getVerdict(cleaned);

  return { cleaned, verdict };
}

module.exports = { runPipeline };