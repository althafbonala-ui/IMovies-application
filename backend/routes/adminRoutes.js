const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getAdminStats } = require('../controllers/adminController');

// All admin routes strictly require JWT authentication and admin role
router.use(protect, admin);

// @route   GET /api/admin/stats
// @desc    Retrieve aggregated cinema and demo revenue statistics
// @access  Private (Admin only)
router.get('/stats', getAdminStats);

module.exports = router;
