/**
 * SCHEME FINDER — Global Error Handler Middleware
 */

/** @param {Error} err */
module.exports = function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR ${status}] ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error:   message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
