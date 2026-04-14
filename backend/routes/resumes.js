const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { 
  getResumes, 
  getResumeById,
  uploadResume, 
  tailorResumeHandler,
  getTailoredResumes 
} = require('../controllers/resumeController');
const upload = require('../middlewares/upload');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/resumes/upload
 * Upload and parse a resume
 */
router.post('/upload', upload.single('resume'), uploadResume);

/**
 * POST /api/resumes/tailor
 * Tailor a resume for a job using AI
 */
router.post('/tailor', tailorResumeHandler);

/**
 * GET /api/resumes/tailored
 * Get all tailored resumes
 */
router.get('/tailored', getTailoredResumes);

/**
 * GET /api/resumes
 * List all resumes
 */
router.get('/', getResumes);

/**
 * GET /api/resumes/:id
 * Get a specific resume
 */
router.get('/:id', getResumeById);

module.exports = router;