/**
 * scheduleFutureShows.js
 * 
 * Dedicated, idempotent, non-destructive showtime scheduler for iMovies.
 * 
 * Safeguards:
 * 1. Never deletes, overwrites, resets, or re-seeds existing records.
 * 2. Checks each showtime before insertion; skips existing matching records.
 * 3. Enforces compound unique index: { movie, theatre, date, time, format }.
 * 4. Respects each movie's actual languages and formats (no blind Telugu/Hindi assignment).
 * 5. Dry-run mode by default. Requires explicit `--execute` flag to apply changes.
 * 6. Validates all movie and theatre ObjectIds; halts immediately on inconsistency.
 * 
 * Usage:
 *   node backend/utils/scheduleFutureShows.js           (Dry Run - No database changes)
 *   node backend/utils/scheduleFutureShows.js --dry-run (Dry Run - No database changes)
 *   node backend/utils/scheduleFutureShows.js --execute (Executes insertion safely)
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');

// Check CLI execution flags
const IS_EXECUTE = process.argv.includes('--execute');
const IS_DRY_RUN = !IS_EXECUTE || process.argv.includes('--dry-run');

// Target 18-day window: 2026-10-29 through 2026-11-15 inclusive
const START_DATE = '2026-10-29';
const END_DATE = '2026-11-15';

// Generate array of ISO dates (YYYY-MM-DD)
function generateDateRange(startStr, endStr) {
  const dates = [];
  const current = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);

  while (current <= end) {
    const yyyy = current.getUTCFullYear();
    const mm = String(current.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

// Master Theatre Slot Templates (4 standard daily showtimes per theatre)
const THEATRE_SLOT_TEMPLATES = {
  'th-sudha': [
    { time: '10:45 AM', format: 'Telugu 2D', price: 180, defaultStatus: 'filling' },
    { time: '02:00 PM', format: 'Telugu 2D', price: 180, defaultStatus: 'available' },
    { time: '06:15 PM', format: 'Telugu 3D Atmos', price: 220, defaultStatus: 'almost_full' },
    { time: '09:45 PM', format: 'Telugu 3D Atmos', price: 220, defaultStatus: 'available' },
  ],
  'th-gowri': [
    { time: '11:15 AM', format: 'Telugu 2D', price: 150, defaultStatus: 'available' },
    { time: '02:30 PM', format: 'Telugu 2D', price: 150, defaultStatus: 'available' },
    { time: '06:45 PM', format: 'Telugu 2D', price: 170, defaultStatus: 'filling' },
    { time: '10:00 PM', format: 'Hindi 2D', price: 170, defaultStatus: 'available' },
  ],
  'th-sv': [
    { time: '10:00 AM', format: 'Telugu 3D', price: 200, defaultStatus: 'almost_full' },
    { time: '01:30 PM', format: 'Hindi 2D', price: 190, defaultStatus: 'available' },
    { time: '05:30 PM', format: 'Telugu 3D', price: 240, defaultStatus: 'almost_full' },
    { time: '09:15 PM', format: 'Telugu 3D', price: 240, defaultStatus: 'filling' },
  ],
  'th-triveni': [
    { time: '11:00 AM', format: 'Telugu 2D', price: 130, defaultStatus: 'available' },
    { time: '02:15 PM', format: 'Telugu 2D', price: 130, defaultStatus: 'available' },
    { time: '06:00 PM', format: 'Telugu 2D', price: 150, defaultStatus: 'filling' },
    { time: '09:30 PM', format: 'Telugu 2D', price: 150, defaultStatus: 'available' },
  ],
};

/**
 * Intelligent Movie-Specific Format & Price Resolver
 * Ensures movies receive appropriate language versions and real visual formats
 */
function resolveShowtimeFormatAndPrice(movie, theatre, rawSlot, slotIndex) {
  const langs = Array.isArray(movie.languages) && movie.languages.length > 0 ? movie.languages : ['Telugu'];
  const movieFormats = Array.isArray(movie.formats) && movie.formats.length > 0 ? movie.formats : ['2D'];
  const supports3D = movieFormats.some((f) => f.includes('3D'));

  // 1. Language Resolution
  let chosenLang = langs[0];

  const isEnglishOriginal = langs.includes('English');
  const isHindiOriginal = movie.slug === 'stree-2' || (langs[0] === 'Hindi' && !langs.includes('Telugu'));
  const isTamilOriginal = movie.slug === 'amaran' || langs[0] === 'Tamil';

  if (isEnglishOriginal) {
    // Hollywood releases (e.g. Avengers)
    if (slotIndex === 0 || slotIndex === 2) {
      chosenLang = 'English'; // Original English for morning and prime evening shows
    } else if (slotIndex === 1) {
      chosenLang = langs.includes('Telugu') ? 'Telugu' : 'English'; // Telugu dub for matinee
    } else {
      chosenLang = langs.includes('Hindi') ? 'Hindi' : (langs.includes('Telugu') ? 'Telugu' : 'English'); // Hindi dub for night
    }
  } else if (isHindiOriginal) {
    // Bollywood releases (e.g. Stree 2)
    if (slotIndex === 1 && langs.includes('Telugu')) {
      chosenLang = 'Telugu'; // Telugu dub for matinee
    } else {
      chosenLang = 'Hindi'; // Hindi original for morning, evening, and night
    }
  } else if (isTamilOriginal) {
    // Kollywood releases (e.g. Amaran)
    if (slotIndex === 1 && langs.includes('Tamil')) {
      chosenLang = 'Tamil'; // Tamil original for matinee
    } else if (langs.includes('Telugu')) {
      chosenLang = 'Telugu'; // Telugu dub for local AP audience
    } else {
      chosenLang = langs[0];
    }
  } else {
    // Tollywood releases (e.g. Pushpa 2, Kalki 2898 AD, Devara, Lucky Baskhar)
    if ((rawSlot.format.includes('Hindi') || slotIndex === 3) && langs.includes('Hindi') && theatre.slug === 'th-gowri') {
      chosenLang = 'Hindi'; // Gowri night Hindi dub slot
    } else if (rawSlot.format.includes('Hindi') && langs.includes('Hindi') && theatre.slug === 'th-sv') {
      chosenLang = 'Hindi'; // SV Multiplex matinee Hindi dub slot
    } else {
      chosenLang = 'Telugu'; // Telugu original
    }
  }

  // 2. Visual / Audio Experience Resolution
  const theatreHasAtmos = theatre.badge?.includes('Atmos') || theatre.name?.includes('Atmos') || rawSlot.format.includes('Atmos');
  let formatName = '2D';
  let price = rawSlot.price;

  if (supports3D && rawSlot.format.includes('3D')) {
    formatName = theatreHasAtmos ? '3D Atmos' : '3D';
    price = rawSlot.price;
  } else {
    // Movie does not support 3D
    if (theatreHasAtmos && (rawSlot.format.includes('Atmos') || movieFormats.includes('Dolby Atmos'))) {
      formatName = '2D Atmos';
      price = rawSlot.price;
    } else {
      formatName = '2D';
      if (rawSlot.format.includes('3D')) {
        // Adjust 3D slot price to standard 2D pricing
        price = rawSlot.price > 200 ? 220 : 190;
      } else {
        price = rawSlot.price;
      }
    }
  }

  return {
    format: `${chosenLang} ${formatName}`,
    price,
  };
}

async function runScheduler() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

  console.log('='.repeat(70));
  console.log('  iMovies Dedicated Showtime Scheduler');
  console.log(`  Mode: ${IS_EXECUTE ? '⚡ EXECUTE (Applying changes)' : '🔍 DRY RUN (Audit only, no DB writes)'}`);
  console.log('='.repeat(70));

  await mongoose.connect(mongoUri);
  console.log(`✓ Connected to MongoDB: ${mongoose.connection.name} on ${mongoose.connection.host}`);

  // Step 1: Verify Schema Indexes & Compound Unique Index
  await Showtime.init();
  const indexes = await Showtime.collection.indexes();
  const uniqueCompoundIdx = indexes.find(
    (idx) => idx.name === 'uniq_movie_theatre_date_time_format' ||
             (idx.key && idx.key.movie && idx.key.theatre && idx.key.date && idx.key.time && idx.key.format)
  );

  if (!uniqueCompoundIdx) {
    console.error('❌ ERROR: Compound unique index { movie, theatre, date, time, format } is MISSING!');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`✓ Verified compound unique index: "${uniqueCompoundIdx.name}" (Unique: ${Boolean(uniqueCompoundIdx.unique)})`);

  // Step 2: Baseline Database State Inspection
  const initialShowCount = await Showtime.countDocuments();
  const initialBookingsCount = await Booking.countDocuments();
  const existingDates = (await Showtime.distinct('date')).sort();

  console.log('\n--- Baseline Database Inspection ---');
  console.log(`Total Existing Showtimes: ${initialShowCount}`);
  console.log(`Existing Show Dates: [${existingDates.join(', ')}]`);
  console.log(`Total Existing Customer Bookings: ${initialBookingsCount} (Strictly preserved)`);

  // Step 3: Fetch Target Movies & Theatres
  const nowShowingMovies = await Movie.find({ status: 'now_showing' });
  const allTheatres = await Theatre.find();

  console.log(`Now Showing Movies: ${nowShowingMovies.length}`);
  console.log(`Registered Theatres: ${allTheatres.length}`);

  if (nowShowingMovies.length === 0 || allTheatres.length === 0) {
    console.error('❌ ERROR: No active movies or theatres found in database. Halting.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Step 4: Validate Date Range
  const dateRange = generateDateRange(START_DATE, END_DATE);
  console.log(`\nProposed Scheduling Window: ${START_DATE} to ${END_DATE} (${dateRange.length} calendar days)`);

  // Step 5: Plan Records & Perform Idempotency Check
  const proposedRecords = [];
  const samplePlansPerMovie = new Map();
  let invalidReferences = 0;
  let recordsToSkip = 0;
  let recordsToInsert = 0;

  for (const movie of nowShowingMovies) {
    if (!movie._id || !mongoose.Types.ObjectId.isValid(movie._id)) {
      console.error(`❌ Invalid Movie ID: ${movie.slug}`);
      invalidReferences++;
      continue;
    }

    const movieSamples = [];

    for (const theatre of allTheatres) {
      if (!theatre._id || !mongoose.Types.ObjectId.isValid(theatre._id)) {
        console.error(`❌ Invalid Theatre ID: ${theatre.slug}`);
        invalidReferences++;
        continue;
      }

      const slotTemplates = THEATRE_SLOT_TEMPLATES[theatre.slug];
      if (!slotTemplates || slotTemplates.length === 0) {
        console.error(`❌ Missing slot template for theatre: ${theatre.slug}`);
        invalidReferences++;
        continue;
      }

      for (let slotIdx = 0; slotIdx < slotTemplates.length; slotIdx++) {
        const rawSlot = slotTemplates[slotIdx];
        const { format: resolvedFormat, price: resolvedPrice } = resolveShowtimeFormatAndPrice(
          movie,
          theatre,
          rawSlot,
          slotIdx
        );

        if (movieSamples.length < 4) {
          movieSamples.push({
            theatre: theatre.name,
            time: rawSlot.time,
            format: resolvedFormat,
            price: resolvedPrice,
          });
        }

        for (const isoDate of dateRange) {
          const filter = {
            movie: movie._id,
            theatre: theatre._id,
            date: isoDate,
            time: rawSlot.time,
            format: resolvedFormat,
          };

          proposedRecords.push({
            filter,
            docPayload: {
              movie: movie._id,
              theatre: theatre._id,
              date: isoDate,
              time: rawSlot.time,
              format: resolvedFormat,
              price: resolvedPrice,
              status: rawSlot.defaultStatus || 'available',
              totalSeats: 60,
              bookedSeats: [],
            },
          });
        }
      }
    }

    samplePlansPerMovie.set(movie.slug, {
      title: movie.title,
      languages: movie.languages,
      formats: movie.formats,
      samples: movieSamples,
    });
  }

  // Safety check on reference consistency
  if (invalidReferences > 0) {
    console.error(`❌ Inconsistency detected: ${invalidReferences} invalid references. Stopping scheduler.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Check which records already exist in MongoDB
  console.log('\nChecking existing records in MongoDB for idempotency...');
  const existingMatches = await Showtime.find({
    date: { $gte: START_DATE, $lte: END_DATE },
  }).select('movie theatre date time format');

  const existingKeySet = new Set(
    existingMatches.map((st) => `${st.movie}_${st.theatre}_${st.date}_${st.time}_${st.format}`)
  );

  const recordsReadyToInsert = [];
  for (const item of proposedRecords) {
    const key = `${item.filter.movie}_${item.filter.theatre}_${item.filter.date}_${item.filter.time}_${item.filter.format}`;
    if (existingKeySet.has(key)) {
      recordsToSkip++;
    } else {
      recordsToInsert++;
      recordsReadyToInsert.push(item.docPayload);
    }
  }

  // Step 6: Print Dry-Run Summary Report
  console.log('\n' + '='.repeat(70));
  console.log('              DRY-RUN AUDIT & SCHEDULING REPORT');
  console.log('='.repeat(70));
  console.log(`Proposed Date Range: ${START_DATE} through ${END_DATE} (${dateRange.length} days)`);
  console.log(`Now Showing Movies Target: ${nowShowingMovies.length}`);
  console.log(`Theatres Target: ${allTheatres.length} (4 daily slots each = 16 slots/day)`);
  console.log(`Total Planned Showtimes: ${proposedRecords.length}`);
  console.log(`Records to Insert: ${recordsToInsert}`);
  console.log(`Records to Skip (Already existing): ${recordsToSkip}`);
  console.log(`Invalid References / Data Errors: ${invalidReferences}`);

  console.log('\n--- Movie Format & Language Preservation Sample ---');
  for (const [slug, info] of samplePlansPerMovie.entries()) {
    console.log(`\n• [${info.title}] (Languages: ${info.languages.join(', ')} | Formats: ${info.formats.join(', ')})`);
    for (const sample of info.samples) {
      console.log(`    ${sample.time} @ ${sample.theatre}: "${sample.format}" • ₹${sample.price}`);
    }
  }

  console.log('\n' + '='.repeat(70));

  if (!IS_EXECUTE) {
    console.log('\n[DRY RUN COMPLETE] Zero database records were modified or inserted.');
    console.log('To execute this plan and insert records, run with `--execute`:');
    console.log('   node backend/utils/scheduleFutureShows.js --execute');
    await mongoose.disconnect();
    return {
      dryRun: true,
      startDate: START_DATE,
      endDate: END_DATE,
      totalPlanned: proposedRecords.length,
      recordsToInsert,
      recordsToSkip,
      invalidReferences,
    };
  }

  // Step 7: Execute Insertion Safely
  console.log(`\n⚡ EXECUTING INSERTION: Inserting ${recordsReadyToInsert.length} showtimes into MongoDB...`);

  // Insert in batches of 500 for optimal memory and connection stability
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < recordsReadyToInsert.length; i += BATCH_SIZE) {
    const batch = recordsReadyToInsert.slice(i, i + BATCH_SIZE);
    const result = await Showtime.insertMany(batch, { ordered: false });
    insertedCount += result.length;
    process.stdout.write(`  Inserted ${insertedCount} / ${recordsReadyToInsert.length} showtimes...\r`);
  }

  console.log(`\n✓ Successfully inserted ${insertedCount} new showtimes.`);

  // Step 8: Post-Execution Verification
  const postShowCount = await Showtime.countDocuments();
  const postBookingsCount = await Booking.countDocuments();
  const postDates = (await Showtime.distinct('date')).sort();

  console.log('\n--- Post-Execution Verification ---');
  console.log(`Previous Showtime Count: ${initialShowCount}`);
  console.log(`New Showtime Count: ${postShowCount} (Expected: ${initialShowCount + insertedCount})`);
  console.log(`Bookings Count: ${postBookingsCount} (Preserved unchanged: ${initialBookingsCount === postBookingsCount})`);
  console.log(`Earliest Date: ${postDates[0]}`);
  console.log(`Latest Date: ${postDates[postDates.length - 1]}`);
  console.log(`Total Active Dates in MongoDB: ${postDates.length}`);
  console.log('='.repeat(70));

  await mongoose.disconnect();
  return {
    dryRun: false,
    insertedCount,
    initialShowCount,
    postShowCount,
    postBookingsCount,
  };
}

// Execute if run directly
if (require.main === module) {
  runScheduler().catch((err) => {
    console.error('❌ Scheduler Error:', err);
    process.exit(1);
  });
}

module.exports = { runScheduler };

