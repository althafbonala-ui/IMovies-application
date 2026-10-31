const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    // Validate request body before destructuring
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const { name, email, password, phone } = req.body;

    // Validate required fields and string types
    if (
      !name ||
      !email ||
      !password ||
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty',
      });
    }

    // Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Validate phone type if provided
    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Phone must be a valid string',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const formattedPhone = phone && typeof phone === 'string' ? phone.trim() : '';

    // Create user (default role: 'user' enforces privilege separation)
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      phone: formattedPhone,
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    // Validate request body before destructuring
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const { email, password } = req.body;

    // Validate inputs and string types (email must be a non-empty trimmed string; password is untrimmed)
    if (
      !email ||
      !password ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly select password field for verification since select: false
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password with bcryptjs
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out user / clear session
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private (Protected by authMiddleware)
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private (Protected by authMiddleware)
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    // Validate and update name if provided
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string',
        });
      }
      user.name = req.body.name.trim();
    }

    // Validate and update phone if provided
    if (req.body.phone !== undefined && req.body.phone !== null) {
      if (typeof req.body.phone !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Phone must be a valid string',
        });
      }
      user.phone = req.body.phone.trim();
    }

    // Validate and update email if provided
    if (req.body.email !== undefined) {
      if (typeof req.body.email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const normalizedEmail = req.body.email.trim().toLowerCase();
      const emailRegex = /^\S+@\S+\.\S+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      if (normalizedEmail !== user.email) {
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Email address is already in use by another account',
          });
        }
        user.email = normalizedEmail;
      }
    }

    // Validate and update password if provided
    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        token: generateToken(updatedUser._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
