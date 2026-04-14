const rateLimit = require('express-rate-limit');

const userRateLimits = new Map();
const CLEANUP_INTERVAL = 15 * 60 * 1000;

const cleanupOldEntries = () => {
  const now = Date.now();
  for (const [key, data] of userRateLimits) {
    if (now - data.windowStart > data.windowMs) {
      userRateLimits.delete(key);
    }
  }
};

setInterval(cleanupOldEntries, CLEANUP_INTERVAL);

const createUserRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 100,
    keyGenerator = (req) => req.user?.id || req.ip,
    message = { success: false, error: 'Too many requests. Please try again later.' }
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    
    if (!key) {
      return next();
    }

    const now = Date.now();
    let userData = userRateLimits.get(key);

    if (!userData || now - userData.windowStart > windowMs) {
      userData = {
        count: 0,
        windowStart: now,
        windowMs
      };
    }

    userData.count++;
    userRateLimits.set(key, userData);

    if (userData.count > maxRequests) {
      const resetTime = Math.ceil((userData.windowStart + windowMs - now) / 1000);
      return res.status(429).json({
        ...message,
        retryAfter: resetTime,
        limit: maxRequests,
        remaining: 0
      });
    }

    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - userData.count),
      'X-RateLimit-Reset': Math.ceil((userData.windowStart + windowMs) / 1000)
    });

    next();
  };
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

const userApiLimiter = createUserRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 200,
  message: {
    success: false,
    error: 'User rate limit exceeded. Please try again later.',
  }
});

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

module.exports = { 
  apiLimiter, 
  authLimiter,
  userApiLimiter,
  createUserRateLimiter 
};