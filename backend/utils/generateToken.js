const jwt = require('jsonwebtoken');

/**
 * Generate a JSON Web Token for authenticated users
 * @param {string|object} id - The MongoDB user ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
