/**
 * cacheService.js
 *
 * The cache-aside logic: check MongoDB first, only run the (slow,
 * costs-money) agent pipeline on a miss, then save the result back.
 * This is the piece that makes the app fast and cheap on repeat lookups.
 */

const Phone = require('../models/Phone');
const { runPipeline } = require('./agentPipeline/pipeline');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isFresh(cachedAt) {
  return Date.now() - new Date(cachedAt).getTime() < CACHE_TTL_MS;
}

/**
 * Main entry point: given a phone slug, return { cleaned, verdict, fromCache }.
 * fromCache is included so callers/logs can tell hit vs miss - useful for
 * demoing the cache-aside behavior later.
 */
async function getPhoneData(slug) {
  const existing = await Phone.findOne({ slug });

  if (existing && isFresh(existing.cachedAt)) {
    return {
      cleaned: existing.cleaned,
      verdict: existing.verdict,
      fromCache: true,
    };
  }

  // Cache miss (no document, or stale) - run the full agent pipeline
  const { cleaned, verdict } = await runPipeline(slug);

  // Save/update - upsert so this works whether it's a new phone or a stale refresh.
  // If the pipeline threw above, we never reach here, so we never cache a
  // broken result - matches the design decision from the diagram earlier.
  await Phone.findOneAndUpdate(
    { slug },
    { slug, cleaned, verdict, cachedAt: new Date() },
    { upsert: true, returnDocument: 'after' }
  );

  return { cleaned, verdict, fromCache: false };
}

module.exports = { getPhoneData };