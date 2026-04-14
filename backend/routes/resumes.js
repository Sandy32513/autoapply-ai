const express = require('express');
const router = express.Router();
const { 
  getResumes, 
  getResumeById,
  uploadResume, 
  tailorResumeHandler,
  getTailoredResumes 
} = require('../controllers/resumeController');
const upload = require('../middlewares/upload');

/**
 * POST /api/resumes/upload
 * Upload and parse a resume (public)
 */
router.post('/upload', upload.single('resume'), uploadResume);

/**
 * POST /api/resumes/tailor
 * Tailor a resume for a job using AI (public)
 */
router.post('/tailor', tailorResumeHandler);

/**
 * GET /api/resumes/tailored
 * Get all tailored resumes (public)
 */
router.get('/tailored', getTailoredResumes);

/**
 * GET /api/resumes
 * List all resumes (public)
 */
router.get('/', getResumes);

/**
 * GET /api/resumes/:id
 * Get a specific resume (public)
 */
router.get('/:id', getResumeById);

module.exports = router;