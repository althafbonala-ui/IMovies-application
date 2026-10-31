/**
 * One-Time Targeted Admin Promotion Script
 *
 * PURPOSE:
 * Explicitly promotes only the existing user account `althafbonala@gmail.com`
 * to the `admin` role in MongoDB.
 *
 * SAFETY GUARANTEES:
 * 1. Targeted: Strictly queries and updates only `althafbonala@gmail.com`.
 * 2. Pre-condition verification: Validates that exactly ONE user matches this email.
 * 3. Minimal atomic update: Uses `$set: { role: 'admin' }` to modify ONLY the role field.
 * 4. Data preservation: Does NOT alter name, email, password hash, phone, createdAt, or bookings.
 * 5. Idempotent: Checks if the user is already an admin and exits safely if so.
 *
 * USAGE:
 * Run manually from the `backend` directory:
 *   node utils/promoteAdmin.js
 * or via npm:
 *   npm run promote-admin
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const TARGET_EMAIL = 'althafbonala@gmail.com'.toLowerCase().trim();

async function promoteTargetUserToAdmin() {
  console.log('========================================================');
  console.log('  iMovies - Targeted Administrator Promotion Script');
  console.log('========================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

  try {
    // 1. Connect to MongoDB
    console.log(`[1/4] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log(`      ✓ Connected successfully to database: "${mongoose.connection.name}"\n`);

    // 2. Query target account and verify exactly one user matches
    console.log(`[2/4] Verifying account existence for target: "${TARGET_EMAIL}"...`);
    const matchedUsers = await User.find({ email: TARGET_EMAIL });

    if (matchedUsers.length === 0) {
      console.error(`      ✕ ERROR: No user found with email "${TARGET_EMAIL}".`);
      console.error('      Aborting operation without making any modifications.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (matchedUsers.length > 1) {
      console.error(
        `      ✕ ERROR: Integrity check failed! Found ${matchedUsers.length} users with email "${TARGET_EMAIL}". Expected exactly 1.`
      );
      console.error('      Aborting operation without making any modifications.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    const targetUser = matchedUsers[0];
    console.log('      ✓ Exactly one matching account found:');
    console.log(`        - User ID:      ${targetUser._id}`);
    console.log(`        - Name:         ${targetUser.name}`);
    console.log(`        - Email:        ${targetUser.email}`);
    console.log(`        - Current Role: "${targetUser.role}"`);
    console.log(`        - Created At:   ${targetUser.createdAt}\n`);

    // 3. Idempotency check: verify if already admin
    if (targetUser.role === 'admin') {
      console.log('      ℹ User is already configured with role "admin".');
      console.log('      No update necessary. All records preserved.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 4. Perform atomic update restricted ONLY to the role field
    console.log(`[3/4] Updating role from "${targetUser.role}" -> "admin"...`);
    const updateResult = await User.updateOne(
      { _id: targetUser._id, email: TARGET_EMAIL },
      { $set: { role: 'admin' } }
    );

    if (updateResult.modifiedCount !== 1) {
      console.error('      ✕ ERROR: Update did not modify exactly 1 record.');
      console.error('      Update result:', updateResult);
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log('      ✓ Database update acknowledged.\n');

    // 5. Post-update verification
    console.log('[4/4] Verifying updated record from database...');
    const verifiedUser = await User.findById(targetUser._id).lean();

    if (!verifiedUser || verifiedUser.role !== 'admin') {
      console.error('      ✕ ERROR: Post-update verification failed!');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('      ✓ Verification successful:');
    console.log(`        - User ID:    ${verifiedUser._id}`);
    console.log(`        - Name:       ${verifiedUser.name} (preserved)`);
    console.log(`        - Email:      ${verifiedUser.email} (preserved)`);
    console.log(`        - Phone:      ${verifiedUser.phone || 'N/A'} (preserved)`);
    console.log(`        - New Role:   "${verifiedUser.role}" (promoted)`);
    console.log(`        - Updated At: ${verifiedUser.updatedAt}\n`);

    console.log('========================================================');
    console.log('  SUCCESS: Account althafbonala@gmail.com promoted to admin');
    console.log('========================================================\n');

    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n✕ UNEXPECTED ERROR during admin promotion:', error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

// Execute only when directly invoked via CLI
if (require.main === module) {
  promoteTargetUserToAdmin();
}

module.exports = promoteTargetUserToAdmin;
