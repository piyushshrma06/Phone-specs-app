const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller');

// Routes stay thin - they just map a URL to a controller function.
// All actual logic lives in the controller, never here.
router.get('/', getHealth);

module.exports = router;