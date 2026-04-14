const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter: 100 req / 15 min per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

/**
 * Stricter limiter for auth endpoints: 10 req / 15 min per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many auth attempts. Please try again later.',
  },
});

module.exports = { apiLimiter, authLimiter };
