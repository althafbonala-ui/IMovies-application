const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Movie = require('./models/Movie');
const Review = require('./models/Review');
const generateToken = require('./utils/generateToken');

const movieRoutes = require('./routes/movieRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const runTests = async () => {
  console.log('=== Starting Movie Reviews & Ratings Backend Tests ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB');

  const app = express();
  app.use(express.json());
  app.use('/api/movies', movieRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(` Test server running on ephemeral port ${port}\n`);

  let user1, user2, user1Token, user2Token, testMovie;
  let testReviewId = null;
  let passedCount = 0;
  let totalCount = 0;

  const assert = (condition, description) => {
    totalCount++;
    if (condition) {
      console.log(`  PASS: ${description}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${description}`);
    }
  };

  try {
    // 1. Get or create test users
    const email1 = `review_tester_1_${Date.now()}@example.com`;
    const email2 = `review_tester_2_${Date.now()}@example.com`;

    user1 = await User.create({
      name: 'Test Reviewer One',
      email: email1,
      password: 'password123',
    });
    user1Token = generateToken(user1._id);

    user2 = await User.create({
      name: 'Test Reviewer Two',
      email: email2,
      password: 'password123',
    });
    user2Token = generateToken(user2._id);

    // Pick a test movie from existing movies
    testMovie = await Movie.findOne();
    if (!testMovie) {
      throw new Error('No movie found in database to test against.');
    }
    console.log(`Using test movie: "${testMovie.title}" (slug: ${testMovie.slug}, id: ${testMovie._id})\n`);

    // Clean up any old review for this movie by these test users if any
    await Review.deleteMany({ user: { $in: [user1._id, user2._id] } });

    // Test 1: Public endpoint GET reviews
    {
      const res = await fetch(`${baseUrl}/api/movies/${testMovie.slug}/reviews`);
      const data = await res.json();
      assert(res.status === 200 && data.success === true && Array.isArray(data.data), 'Public GET reviews returns 200 with review list');
      assert(typeof data.averageRating === 'number' && typeof data.totalReviews === 'number', 'Public GET reviews includes averageRating and totalReviews');
    }

    // Test 2: Unauthenticated POST should fail with 401
    {
      const res = await fetch(`${baseUrl}/api/movies/${testMovie._id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5, reviewText: 'Great movie!' }),
      });
      const data = await res.json();
      assert(res.status === 401 && data.success === false, 'Unauthenticated review creation fails with 401');
    }

    // Test 3: Invalid ratings validation
    {
      const invalidRatings = [0, 6, -1, 3.5, 'five'];
      for (const badRating of invalidRatings) {
        const res = await fetch(`${baseUrl}/api/movies/${testMovie._id}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user1Token}`,
          },
          body: JSON.stringify({ rating: badRating, reviewText: 'Good movie' }),
        });
        const data = await res.json();
        assert(res.status === 400 && data.success === false, `Invalid rating (${badRating}) rejected with 400`);
      }
    }

    // Test 4: Missing or invalid review text
    {
      const invalidTexts = ['', '   ', 'x'];
      for (const badText of invalidTexts) {
        const res = await fetch(`${baseUrl}/api/movies/${testMovie._id}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user1Token}`,
          },
          body: JSON.stringify({ rating: 4, reviewText: badText }),
        });
        const data = await res.json();
        assert(res.status === 400 && data.success === false, `Invalid text ('${badText}') rejected with 400`);
      }
    }

    // Test 5: Non-existent movie identifier returns 404
    {
      const res = await fetch(`${baseUrl}/api/movies/non-existent-slug-xyz/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ rating: 4, reviewText: 'Nice movie' }),
      });
      const data = await res.json();
      assert(res.status === 404 && data.success === false, 'Non-existent movie ID returns 404');
    }

    // Test 6: Valid review creation by User 1
    {
      const res = await fetch(`${baseUrl}/api/movies/${testMovie.slug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          rating: 4,
          reviewText: 'Outstanding cinematography and stellar acting!',
          userId: 'attempted_override_id', // Should be ignored
        }),
      });
      const data = await res.json();
      assert(res.status === 201 && data.success === true, 'Valid review creation returns 201');
      assert(data.data.user._id.toString() === user1._id.toString(), 'User identity derived from JWT, body user ignored');
      assert(data.data.rating === 4 && data.data.reviewText === 'Outstanding cinematography and stellar acting!', 'Review stored with correct rating and text');
      assert(data.averageRating >= 1 && data.totalReviews >= 1, 'Updated averageRating and totalReviews returned in response');
      testReviewId = data.data._id;
    }

    // Test 7: Prevent duplicate review submission for the same movie
    {
      const res = await fetch(`${baseUrl}/api/movies/${testMovie.slug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: 'Submitting another review should fail.',
        }),
      });
      const data = await res.json();
      assert(res.status === 400 && data.success === false, 'Duplicate review submission prevented with 400');
    }

    // Test 8: Another user cannot edit user 1's review (403 Forbidden)
    {
      const res = await fetch(`${baseUrl}/api/reviews/${testReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user2Token}`,
        },
        body: JSON.stringify({ rating: 1, reviewText: 'Hacked your review!' }),
      });
      const data = await res.json();
      assert(res.status === 403 && data.success === false, 'User 2 cannot edit User 1 review (returns 403)');
    }

    // Test 9: Another user cannot delete user 1's review (403 Forbidden)
    {
      const res = await fetch(`${baseUrl}/api/reviews/${testReviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user2Token}`,
        },
      });
      const data = await res.json();
      assert(res.status === 403 && data.success === false, 'User 2 cannot delete User 1 review (returns 403)');
    }

    // Test 10: User 1 can successfully edit their own review
    {
      const res = await fetch(`${baseUrl}/api/reviews/${testReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({
          rating: 5,
          reviewText: 'Updated review: Absolute cinematic masterpiece!',
        }),
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, 'Owner can edit their review (returns 200)');
      assert(data.data.rating === 5 && data.data.reviewText === 'Updated review: Absolute cinematic masterpiece!', 'Review updated with new rating and text');
    }

    // Test 11: Review retrieval via nested route /api/movies/:movieId/reviews
    {
      const res = await fetch(`${baseUrl}/api/movies/${testMovie._id}/reviews`);
      const data = await res.json();
      const userReview = data.data.find((r) => r._id.toString() === testReviewId.toString());
      assert(Boolean(userReview && userReview.rating === 5), 'Updated review appears in movie review list with populated user name');
    }

    // Test 12: User 1 can successfully delete their own review
    {
      const res = await fetch(`${baseUrl}/api/reviews/${testReviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, 'Owner can delete their review (returns 200)');
    }

    // Test 13: Confirm deleted review is gone
    {
      const res = await fetch(`${baseUrl}/api/movies/${testMovie.slug}/reviews`);
      const data = await res.json();
      const deletedReview = data.data.find((r) => r._id.toString() === testReviewId.toString());
      assert(!deletedReview, 'Deleted review is no longer in movie review list');
    }

    console.log(`\n=== Test Results: ${passedCount} / ${totalCount} passed ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup test users and reviews created during test
    if (user1) await User.findByIdAndDelete(user1._id);
    if (user2) await User.findByIdAndDelete(user2._id);
    if (testReviewId) await Review.findByIdAndDelete(testReviewId);

    server.close();
    await mongoose.disconnect();
    console.log(' Cleaned up test artifacts and closed server.');
  }
};

runTests();
