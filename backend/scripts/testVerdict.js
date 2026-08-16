/**
 * Standalone test for the full 3-agent chain:
 * specsApi -> analyst -> verdict (the real Gemini call)
 * Usage: node scripts/testVerdict.js
 */
require('dotenv').config();
const { getPhonesByBrand, getPhoneDetails } = require('../services/dataSources/specsApi');
const { analyzePhone } = require('../services/agentPipeline/analyst');
const { getVerdict } = require('../services/agentPipeline/verdict');

async function main() {
  console.log('Fetching Apple phones list...');
  const applePhones = await getPhonesByBrand('apple-phones-48');

  const firstSlug = applePhones[0].slug;
  console.log(`Fetching raw details for "${firstSlug}"...`);
  const raw = await getPhoneDetails(firstSlug);

  console.log('Running Analyst agent...');
  const cleaned = analyzePhone(raw);
  console.log('Cleaned:', cleaned.model, '-', cleaned.chipset);

  console.log('\nRunning Verdict agent (calling Gemini)...');
  const verdict = await getVerdict(cleaned);

  console.log('\nVerdict:');
  console.log(JSON.stringify(verdict, null, 2));
}

main().catch((err) => {
  console.error('Test failed:', err.message);
});