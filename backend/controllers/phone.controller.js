/**
 * phone.controller.js
 *
 * Actual request-handling logic. Routes stay thin and just call these.
 */

const { getBrands, getPhonesByBrand } = require('../services/dataSources/specsApi');
const { getPhoneData } = require('../services/cacheService');
const { scorePhone } = require('../services/scoringService');

/**
 * GET /api/brands
 * Returns the full brand list - lets the frontend build a browse UI
 * since the specs API's /search endpoint doesn't actually work.
 */
async function listBrands(req, res) {
  try {
    const brands = await getBrands();
    res.status(200).json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/brands/:brandSlug
 * Returns phones for one brand, filtered to likely-phone devices only
 * would require details for each - too expensive to do here, so we
 * return the raw list (name, slug, image) and let the frontend decide
 * which to fetch full details for.
 */
async function listPhonesByBrand(req, res) {
  try {
    const { brandSlug } = req.params;
    const phones = await getPhonesByBrand(brandSlug);
    res.status(200).json(phones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/phones/:slug?persona=gamer
 * The core route: cache-aside fetch + clean + verdict, then score
 * for the requested persona. Defaults to "everyday" if no persona given.
 */
async function getPhoneWithScore(req, res) {
  try {
    const { slug } = req.params;
    const persona = req.query.persona || 'everyday';

    const { cleaned, verdict, fromCache } = await getPhoneData(slug);
    const scoreResult = scorePhone(cleaned, persona);

    res.status(200).json({
      cleaned,
      verdict,
      score: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      fromCache,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listBrands, listPhonesByBrand, getPhoneWithScore };