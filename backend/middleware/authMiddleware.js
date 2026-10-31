const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verifies Bearer token and attaches user to request
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token from 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token missing',
        });
      }

      // Ensure JWT_SECRET is configured on the server
      if (!process.env.JWT_SECRET) {
        res.status(500);
        return next(
          new Error('JWT_SECRET is not configured in the server environment')
        );
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID and exclude password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token has expired',
        });
      }

      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'NotBeforeError'
      ) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token',
        });
      }

      // Forward unexpected errors (e.g., database connection issues) to centralized error handler
      return next(error);
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized, no token provided',
  });
};

/**
 * Restrict routes to Admin role only
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Admin privileges required',
  });
};

module.exports = {
  protect,
  admin,
};
