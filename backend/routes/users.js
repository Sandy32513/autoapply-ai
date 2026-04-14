const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { getMe } = require('../controllers/userController');

// All routes here require authentication
router.use(authenticate);

/**
 * GET /api/me
 */
router.get('/me', getMe);

module.exports = router;
