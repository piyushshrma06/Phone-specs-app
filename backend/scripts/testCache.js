/**
 * Standalone test for cacheService.js.
 * Calls getPhoneData() twice for the same slug - first should be a
 * cache MISS (slow, calls Gemini), second should be a cache HIT
 * (fast, no Gemini call). Timing proves the difference.
 * Usage: node scripts/testCache.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const { getPhoneData } = require('../services/cacheService');

async function main() {
  await connectDB();

  const slug = 'apple_iphone_17e-14487';

  console.log('First call (expect cache MISS - this will call Gemini, takes a few seconds)...');
  const t1 = Date.now();
  const first = await getPhoneData(slug);
  console.log(`Done in ${Date.now() - t1}ms. fromCache: ${first.fromCache}`);
  console.log('Verdict:', first.verdict.verdict);

  console.log('\nSecond call (expect cache HIT - should be near-instant)...');
  const t2 = Date.now();
  const second = await getPhoneData(slug);
  console.log(`Done in ${Date.now() - t2}ms. fromCache: ${second.fromCache}`);
  console.log('Verdict:', second.verdict.verdict);

  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});