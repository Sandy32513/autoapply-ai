const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Public health check endpoint.
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
