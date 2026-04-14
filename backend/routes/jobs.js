const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { getJobs, getJobById, scrapeAndSaveJobs, scrapeFromSource, getSources } = require('../controllers/jobController');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/jobs
 * Get all jobs with pagination and filters
 */
router.get('/', getJobs);

/**
 * GET /api/jobs/sources
 * Get available job sources
 */
router.get('/sources', getSources);

/**
 * GET /api/jobs/:id
 * Get a specific job by ID
 */
router.get('/:id', getJobById);

/**
 * POST /api/jobs/scrape
 * Scrape jobs and save to database (all sources)
 */
router.post('/scrape', scrapeAndSaveJobs);

/**
 * POST /api/jobs/scrape/:source
 * Scrape jobs from a specific source (linkedin, naukri)
 */
router.post('/scrape/:source', scrapeFromSource);

module.exports = router;