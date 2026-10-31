const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Public Authentication Routes
 */
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

/**
 * Protected Profile Routes
 */
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
