const mongoose = require('mongoose');

/**
 * Connect to Local MongoDB Community Server
 * Database name: imovies
 * Loaded from MONGO_URI in .env
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern Mongoose defaults are optimal
    });

    console.log(`[iMovies Backend] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[iMovies Backend] MongoDB Connection Error: ${error.message}`);
    console.error(
      '-> Please ensure MongoDB Community Server is installed and running locally on port 27017.'
    );
    // Don't kill the server process immediately during development so health check can still be verified
  }
};

module.exports = connectDB;
