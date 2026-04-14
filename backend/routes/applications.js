const express = require('express');
const router = express.Router();
const { 
  getApplications, 
  getApplicationById,
  applyToJob,
  getQueueInfo 
} = require('../controllers/applicationController');

/**
 * POST /api/applications/apply
 * Submit job application (must be before :id route)
 */
router.post('/apply', applyToJob);

/**
 * GET /api/applications/queue/status
 * Get queue status (must be before :id route)
 */
router.get('/queue/status', getQueueInfo);

/**
 * GET /api/applications
 * List all applications
 */
router.get('/', getApplications);

/**
 * GET /api/applications/:id
 * Get specific application
 */
router.get('/:id', getApplicationById);

module.exports = router;