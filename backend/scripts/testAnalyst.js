/**
 * Standalone test for the Analyst agent.
 * Chains: getBrands -> getPhonesByBrand -> getPhoneDetails -> analyzePhone
 * Usage: node scripts/testAnalyst.js
 */
require('dotenv').config();
const { getPhonesByBrand, getPhoneDetails } = require('../services/dataSources/specsApi');
const { analyzePhone } = require('../services/agentPipeline/analyst');

async function main() {
  console.log('Fetching Apple phones list...');
  const applePhones = await getPhonesByBrand('apple-phones-48');

  const firstSlug = applePhones[0].slug;
  console.log(`Fetching raw details for "${firstSlug}"...`);
  const raw = await getPhoneDetails(firstSlug);

  console.log('\nRunning Analyst agent...');
  const cleaned = analyzePhone(raw);

  console.log('\nCleaned output:');
  console.log(JSON.stringify(cleaned, null, 2));
}

main().catch((err) => {
  console.error('Test failed:', err.message);
});