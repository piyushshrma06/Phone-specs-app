const express = require('express');
const router = express.Router();
const {
  listBrands,
  listPhonesByBrand,
  getPhoneWithScore,
} = require('../controllers/phone.controller');

// Order matters: /brands and /brands/:brandSlug must come before
// the catch-all /:slug route, or Express would try to match
// "brands" itself as a phone slug.
router.get('/brands', listBrands);
router.get('/brands/:brandSlug', listPhonesByBrand);
router.get('/:slug', getPhoneWithScore);

module.exports = router;