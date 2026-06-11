const { rateLimit } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { client } = require('../services/redisService');

/**
 * Per-doctor rate limiting middleware.
 * Uses Redis to track requests per doctor ID.
 */
const doctorRateLimiter = rateLimit({
  // Store in Redis if available, otherwise fallback to memory
  store: client ? new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
  }) : undefined,
  
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Pro doctors get more requests
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') return 5000;
    if (req.user?.plan === 'pro') return 1000;
    return 100; // Basic/Trial doctors
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Rate limit by user ID or IP
  },
  message: {
    success: false,
    message: 'Too many requests for your account. Please wait 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for local development if needed
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === '1') return true;
    return false;
  }
});

module.exports = {
  doctorRateLimiter
};
