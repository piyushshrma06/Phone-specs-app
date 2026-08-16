/**
 * Phone.js
 *
 * One document per phone = cleaned specs + verdict together, since
 * they're always read together. cachedAt drives the 24hr TTL check
 * in cacheService.js.
 */

const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true, // one document per phone, re-fetching updates the same doc
    index: true,
  },
  cleaned: {
    type: mongoose.Schema.Types.Mixed, // output of analyst.js - shape may evolve, so kept flexible
    required: true,
  },
  verdict: {
    type: mongoose.Schema.Types.Mixed, // output of verdict.js
    required: true,
  },
  cachedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Phone', phoneSchema);