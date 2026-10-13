const logger = require('../utils/logger');

/**
 * Centralized Express Error Handling Middleware.
 */
function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error: ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Route Not Found Handler.
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
