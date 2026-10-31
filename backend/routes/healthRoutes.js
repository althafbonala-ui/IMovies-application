const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

/**
 * Route: /api/health
 * In MVC architecture:
 * This Route receives incoming HTTP GET requests and forwards
 * them to the healthController.
 */
router.get('/', getHealthStatus);

module.exports = router;
