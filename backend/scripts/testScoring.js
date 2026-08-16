/**
 * Standalone test for scoringService.js.
 * Scores the SAME phone under all 3 personas to prove the weights
 * actually produce different results.
 * Usage: node scripts/testScoring.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const { getPhoneData } = require('../services/cacheService');
const { scorePhone } = require('../services/scoringService');

async function main() {
  await connectDB();

  const slug = 'apple_iphone_17e-14487';
  const { cleaned } = await getPhoneData(slug); // will hit cache if you ran testCache.js already

  console.log(`Scoring: ${cleaned.model}\n`);

  for (const persona of ['gamer', 'contentCreator', 'everyday']) {
    const result = scorePhone(cleaned, persona);
    console.log(`${persona}: ${result.score}/10`);
    console.log('  raw:', result.breakdown.raw);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});