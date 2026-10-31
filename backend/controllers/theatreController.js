const mongoose = require('mongoose');
const Theatre = require('../models/Theatre');

/**
 * @desc    Get all theatres with optional city filter
 * @route   GET /api/theatres
 * @access  Public
 */
const getTheatres = async (req, res, next) => {
  try {
    const { city } = req.query;
    const filter = {};

    if (city && typeof city === 'string' && city.trim() !== '') {
      filter.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    const theatres = await Theatre.find(filter).sort({ city: 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: theatres.length,
      data: theatres,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single theatre by ObjectId or slug
 * @route   GET /api/theatres/:id
 * @access  Public
 */
const getTheatreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let theatre;

    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findById(id);
    } else {
      theatre = await Theatre.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: `Theatre not found with identifier '${id}'.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new theatre
 * @route   POST /api/theatres
 * @access  Private (Admin only)
 */
const createTheatre = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      city,
      location,
      badge,
      formats,
      facilities,
      screens,
    } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Theatre name is required.',
      });
    }

    if (!city || typeof city !== 'string' || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City is required.',
      });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Street address / location is required.',
      });
    }

    // 2. Generate or sanitize slug
    let theatreSlug =
      slug && typeof slug === 'string' && slug.trim()
        ? slug.trim().toLowerCase()
        : `${name.trim()}-${city.trim()}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

    if (!theatreSlug) {
      theatreSlug = `theatre-${Date.now()}`;
    }

    // Check slug uniqueness
    const existingTheatre = await Theatre.findOne({ slug: theatreSlug });
    if (existingTheatre) {
      return res.status(400).json({
        success: false,
        message: `A theatre with slug "${theatreSlug}" already exists. Please choose a different name or slug.`,
      });
    }

    // 3. Process formats array
    let processedFormats = ['2D'];
    if (Array.isArray(formats) && formats.length > 0) {
      processedFormats = formats.map((f) => String(f).trim()).filter(Boolean);
    } else if (typeof formats === 'string' && formats.trim()) {
      processedFormats = formats.split(',').map((f) => f.trim()).filter(Boolean);
    }
    if (processedFormats.length === 0) {
      processedFormats = ['2D'];
    }

    // 4. Process facilities array
    let processedFacilities = ['M-Ticket'];
    if (Array.isArray(facilities) && facilities.length > 0) {
      processedFacilities = facilities.map((f) => String(f).trim()).filter(Boolean);
    } else if (typeof facilities === 'string' && facilities.trim()) {
      processedFacilities = facilities.split(',').map((f) => f.trim()).filter(Boolean);
    }
    if (processedFacilities.length === 0) {
      processedFacilities = ['M-Ticket'];
    }

    // 5. Screens count
    const screenCount = Number(screens) > 0 ? Math.floor(Number(screens)) : 1;

    // 6. Create theatre
    const theatre = await Theatre.create({
      name: name.trim(),
      slug: theatreSlug,
      city: city.trim(),
      location: location.trim(),
      badge: badge && typeof badge === 'string' ? badge.trim() : '',
      formats: processedFormats,
      facilities: processedFacilities,
      screens: screenCount,
    });

    return res.status(201).json({
      success: true,
      message: 'Theatre created successfully.',
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing theatre
 * @route   PUT /api/theatres/:id
 * @access  Private (Admin only)
 */
const updateTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;
    let theatre;

    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findById(id);
    } else {
      theatre = await Theatre.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: `Theatre not found with identifier '${id}'.`,
      });
    }

    const {
      name,
      slug,
      city,
      location,
      badge,
      formats,
      facilities,
      screens,
    } = req.body;

    // Validate if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Theatre name cannot be empty.',
        });
      }
      theatre.name = name.trim();
    }

    if (city !== undefined) {
      if (!city || typeof city !== 'string' || !city.trim()) {
        return res.status(400).json({
          success: false,
          message: 'City cannot be empty.',
        });
      }
      theatre.city = city.trim();
    }

    if (location !== undefined) {
      if (!location || typeof location !== 'string' || !location.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Location cannot be empty.',
        });
      }
      theatre.location = location.trim();
    }

    if (badge !== undefined) {
      theatre.badge = typeof badge === 'string' ? badge.trim() : '';
    }

    if (screens !== undefined) {
      const parsedScreens = Number(screens);
      if (isNaN(parsedScreens) || parsedScreens < 1) {
        return res.status(400).json({
          success: false,
          message: 'Theatre must have at least 1 screen.',
        });
      }
      theatre.screens = Math.floor(parsedScreens);
    }

    if (formats !== undefined) {
      let processedFormats = [];
      if (Array.isArray(formats)) {
        processedFormats = formats.map((f) => String(f).trim()).filter(Boolean);
      } else if (typeof formats === 'string') {
        processedFormats = formats.split(',').map((f) => f.trim()).filter(Boolean);
      }
      if (processedFormats.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one screening format.',
        });
      }
      theatre.formats = processedFormats;
    }

    if (facilities !== undefined) {
      let processedFacilities = [];
      if (Array.isArray(facilities)) {
        processedFacilities = facilities.map((f) => String(f).trim()).filter(Boolean);
      } else if (typeof facilities === 'string') {
        processedFacilities = facilities.split(',').map((f) => f.trim()).filter(Boolean);
      }
      theatre.facilities = processedFacilities;
    }

    // Slug check if changing
    if (slug && typeof slug === 'string' && slug.trim()) {
      const sanitizedSlug = slug.trim().toLowerCase();
      if (sanitizedSlug !== theatre.slug) {
        const existing = await Theatre.findOne({
          slug: sanitizedSlug,
          _id: { $ne: theatre._id },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `A theatre with slug "${sanitizedSlug}" already exists.`,
          });
        }
        theatre.slug = sanitizedSlug;
      }
    }

    await theatre.save();

    return res.status(200).json({
      success: true,
      message: 'Theatre updated successfully.',
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
};

