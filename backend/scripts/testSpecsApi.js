/**
 * Standalone test - proves the full chain: brands -> phones by brand -> phone details
 * Usage: node scripts/testSpecsApi.js
 */
require('dotenv').config();
const { getBrands, getPhonesByBrand, getPhoneDetails } = require('../services/dataSources/specsApi');

async function main() {
  console.log('Step 1: getBrands()...');
  const brands = await getBrands();
  const brandCount = Object.keys(brands).length;
  console.log(`Got ${brandCount} brands. Apple entry:`, brands.Apple);

  console.log('\nStep 2: getPhonesByBrand("apple-phones-48")...');
  const applePhones = await getPhonesByBrand('apple-phones-48');
  console.log(`Got ${applePhones.length} devices. First one:`, applePhones[0]);

  const firstSlug = applePhones[0].slug;
  console.log(`\nStep 3: getPhoneDetails("${firstSlug}")...`);
  const details = await getPhoneDetails(firstSlug);
  console.log('Model:', details.model);
  console.log('Chipset:', details.specifications?.Platform?.Chipset);

  console.log('\n✅ Full chain works end to end.');
}

main().catch((err) => {
  console.error('Test failed:', err.message);
});