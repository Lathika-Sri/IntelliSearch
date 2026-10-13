const rateLimit = require('express-rate-limit');

/**
 * Autocomplete rate limiter:
 * High throughput for typing prefixes (defaults to 120 req / minute / IP).
 */
const searchLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many search requests from this IP, please try again in a minute.'
  }
});

/**
 * Analytics rate limiter:
 * Moderate throughput (60 req / minute / IP).
 */
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many analytics requests from this IP.'
  }
});

/**
 * Admin rate limiter:
 * Restricted throughput (30 req / minute / IP).
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin operations attempted.'
  }
});

module.exports = {
  searchLimiter,
  analyticsLimiter,
  adminLimiter
};
