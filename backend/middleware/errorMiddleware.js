/**
 * Middleware to handle 404 Not Found routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error handler middleware
 * Handles Mongoose validation errors, duplicate keys, invalid ObjectIds,
 * JWT authentication errors, and unexpected internal exceptions.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with identifier: ${err.value}`;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const fieldName = duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1);
    message = `${fieldName} already in use. Please use a different value.`;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
  }

  // JWT invalid token error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized, invalid token';
  }

  // JWT expired token error
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token has expired';
  }

  // Sanitize unexpected internal server errors (HTTP 500)
  if (statusCode === 500) {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
