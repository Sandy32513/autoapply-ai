const express = require('express');
const router = express.Router();
const { getJobs, getJobById, scrapeAndSaveJobs } = require('../controllers/jobController');

/**
 * GET /api/jobs
 * Get all jobs with pagination and filters
 */
router.get('/', getJobs);

/**
 * GET /api/jobs/:id
 * Get a specific job by ID
 */
router.get('/:id', getJobById);

/**
 * POST /api/jobs/scrape
 * Scrape jobs and save to database
 */
router.post('/scrape', scrapeAndSaveJobs);

module.exports = router;