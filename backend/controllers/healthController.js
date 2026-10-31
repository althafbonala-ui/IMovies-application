const mongoose = require('mongoose');

/**
 * @desc    Get system & database health status
 * @route   GET /api/health
 * @access  Public
 * 
 * In MVC architecture:
 * This Controller handles the business logic for the health route,
 * verifies database connectivity, and formats the response.
 *
 * Status codes:
 * - 200 OK: MongoDB is fully connected (readyState === 1).
 * - 503 Service Unavailable: MongoDB is disconnected, connecting, or disconnecting (readyState !== 1).
 */
const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbStateCode = mongoose.connection.readyState;
  const isDbConnected = dbStateCode === 1;
  const dbStatus = dbStateMap[dbStateCode] || 'Unknown';

  const statusCode = isDbConnected ? 200 : 503;

  return res.status(statusCode).json({
    success: isDbConnected,
    application: 'iMovies Application',
    message: isDbConnected
      ? 'Welcome to iMovies Application API! System is operational.'
      : `Database service unavailable. MongoDB status is currently ${dbStatus}.`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      name: 'imovies',
      status: dbStatus,
      host: mongoose.connection.host || '127.0.0.1:27017',
      readyState: dbStateCode,
    },
  });
};

module.exports = {
  getHealthStatus,
};
