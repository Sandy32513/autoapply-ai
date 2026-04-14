const express = require('express');
const router = express.Router();
const { 
  getApplications, 
  getApplicationById,
  applyToJob,
  getQueueInfo,
  startApplyFlow,
  trackApplicationStatus,
  getApplicationStats
} = require('../controllers/applicationController');

/**
 * POST /api/applications/apply
 * Submit job application (must be before :id route)
 */
router.post('/apply', applyToJob);

/**
 * POST /api/applications/start-apply
 * Start the semi-automated apply flow
 */
router.post('/start-apply', startApplyFlow);

/**
 * POST /api/applications/track
 * Track application status from extension
 */
router.post('/track', trackApplicationStatus);

/**
 * GET /api/applications/stats
 * Get application statistics
 */
router.get('/stats', getApplicationStats);

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