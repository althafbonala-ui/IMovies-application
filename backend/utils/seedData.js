/**
 * Database Seeder for iMovies Application
 *
 * DEFAULT BEHAVIOR (Safe Preservation Mode):
 * - Checks each Movie and Theatre by unique `slug`. If it already exists in MongoDB,
 *   it is PRESERVED WITHOUT MODIFICATION.
 * - For Showtimes, checks if the unique slot (movie + theatre + date + time + format) exists.
 *   If it exists, it is PRESERVED, keeping any existing `bookedSeats` intact.
 * - The `users` collection and existing user accounts are NEVER dropped or touched.
 *
 * INTENTIONAL UPDATES (Force Mode):
 * - To intentionally update existing movie/theatre records with new seed properties:
 *   Run: `npm run seed -- --force-update` (or set environment variable `FORCE_UPDATE_SEED=true`)
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Showtime = require('../models/Showtime');

// Check if intentional force update mode is requested via flag or env var
const FORCE_UPDATE =
  process.argv.includes('--force-update') ||
  process.env.FORCE_UPDATE_SEED === 'true';

// Curated high-reliability movie posters & widescreen banners
const VALID_POSTER_URLS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=700&q=80',
];

const VALID_BANNER_URLS = [
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
];

const LOCAL_POSTERS = {
  'pushpa-2': '/posters/pushpa-2.jpg',
  'kalki-2898-ad': '/posters/kalki-2898-ad.jpg',
  'devara-part-1': '/posters/devara-part-1.jpg',
  'lucky-baskhar': '/posters/lucky-baskhar.jpg',
  'amaran': '/posters/amaran.jpg',
  'stree-2': '/posters/stree-2.jpg',
  'avengers-endgame': '/posters/avengers-endgame.jpg',
  'avengers-infinity-war': '/posters/avengers-infinity-war.jpg',
  'the-avengers': '/posters/the-avengers.jpg',
  'avengers-doomsday': '/posters/avengers-doomsday.png',
  'ramayana-part-1': '/posters/ramayana-part-1.jpg',
  'varanasi-epic': '/posters/varanasi-epic.jpg',
  'raaka': '/posters/raaka.jpg',
};

const CINEMATIC_HERO_BANNERS = {
  'pushpa-2': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85',
  'kalki-2898-ad': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2000&q=85',
  'devara-part-1': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
  'avengers-infinity-war': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85',
};

const SEED_MOVIES = [
  {
    slug: 'pushpa-2',
    title: 'Pushpa 2: The Rule',
    tagline: 'The worldwide rule begins',
    status: 'now_showing',
    isHero: true,
    rating: 9.4,
    voteCount: '248.6K',
    certification: 'UA 16+',
    languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada'],
    formats: ['2D', '3D', 'IMAX 3D', '4DX'],
    genres: ['Action', 'Thriller', 'Drama'],
    duration: '3h 15m',
    releaseDate: 'Dec 05, 2024',
    poster: LOCAL_POSTERS['pushpa-2'],
    banner: CINEMATIC_HERO_BANNERS['pushpa-2'],
    accentColor: '#e50914',
    director: 'Sukumar',
    musicDirector: 'Devi Sri Prasad (DSP)',
    cast: [
      { name: 'Allu Arjun', role: 'Pushpa Raj', initials: 'AA' },
      { name: 'Rashmika Mandanna', role: 'Srivalli', initials: 'RM' },
      { name: 'Fahadh Faasil', role: 'SP Bhanwar Singh', initials: 'FF' },
      { name: 'Jagapathi Babu', role: 'Dharma', initials: 'JB' },
      { name: 'Sunil', role: 'Mangalam Srinu', initials: 'SN' },
    ],
    synopsis: 'Pushpa Raj has cemented his supremacy over the red sandalwood smuggling cartel in the Seshachalam forests. However, ruthless retribution looms as SP Bhanwar Singh Shekhawat orchestrates an all-out war to dethrone him.',
    criticConsensus: 'An explosive, high-octane spectacle powered by Allu Arjun’s magnetic swagger and raw screen presence.',
  },
  {
    slug: 'kalki-2898-ad',
    title: 'Kalki 2898 AD',
    tagline: 'The future of Indian epic cinema',
    status: 'now_showing',
    isHero: true,
    rating: 9.2,
    voteCount: '315.2K',
    certification: 'UA',
    languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
    formats: ['2D', '3D', 'IMAX 3D'],
    genres: ['Sci-Fi', 'Mythology', 'Action'],
    duration: '3h 01m',
    releaseDate: 'June 27, 2024',
    poster: LOCAL_POSTERS['kalki-2898-ad'],
    banner: CINEMATIC_HERO_BANNERS['kalki-2898-ad'],
    accentColor: '#f59e0b',
    director: 'Nag Ashwin',
    musicDirector: 'Santhosh Narayanan',
    cast: [
      { name: 'Prabhas', role: 'Bhairava', initials: 'PB' },
      { name: 'Amitabh Bachchan', role: 'Ashwatthama', initials: 'AB' },
      { name: 'Deepika Padukone', role: 'SUM-80', initials: 'DP' },
      { name: 'Kamal Haasan', role: 'Supreme Yaskin', initials: 'KH' },
      { name: 'Disha Patani', role: 'Roxie', initials: 'DP' },
    ],
    synopsis: 'In a dystopian 2898 AD, Kasi is the last surviving city on Earth, dominated by the totalitarian Complex. Ancient prophetic destinies intertwine when the immortal Ashwatthama rises to shield a mother bearing hope for humanity.',
    criticConsensus: 'A visual marvel that boldly blends Indian mythology with grand futuristic world-building.',
  },
  {
    slug: 'devara-part-1',
    title: 'Devara: Part 1',
    tagline: 'The sea does not forgive',
    status: 'now_showing',
    isHero: true,
    rating: 8.8,
    voteCount: '182.4K',
    certification: 'A',
    languages: ['Telugu', 'Hindi', 'Tamil', 'Kannada'],
    formats: ['2D', '3D', 'Dolby Atmos'],
    genres: ['Action', 'Drama', 'Period'],
    duration: '2h 58m',
    releaseDate: 'Sept 27, 2024',
    poster: LOCAL_POSTERS['devara-part-1'],
    banner: CINEMATIC_HERO_BANNERS['devara-part-1'],
    accentColor: '#0ea5e9',
    director: 'Koratala Siva',
    musicDirector: 'Anirudh Ravichander',
    cast: [
      { name: 'Jr. NTR', role: 'Devara / Vara', initials: 'NTR' },
      { name: 'Janhvi Kapoor', role: 'Thangam', initials: 'JK' },
      { name: 'Saif Ali Khan', role: 'Bhaira', initials: 'SK' },
      { name: 'Prakash Raj', role: 'Singappa', initials: 'PR' },
      { name: 'Srikanth', role: 'Rayappa', initials: 'SR' },
    ],
    synopsis: 'A brave coastal leader vows to stop the illicit smuggling ring using his waters. When betrayals arise within his clan, he must take ruthless measures to safeguard his legacy across generations.',
    criticConsensus: 'Jr. NTR commands the ocean with fierce intensity backed by Anirudh’s thumping background score.',
  },
  {
    slug: 'lucky-baskhar',
    title: 'Lucky Baskhar',
    tagline: 'Ordinary man, extraordinary scheme',
    status: 'now_showing',
    isHero: false,
    rating: 8.9,
    voteCount: '84.1K',
    certification: 'UA',
    languages: ['Telugu', 'Malayalam', 'Tamil', 'Hindi'],
    formats: ['2D'],
    genres: ['Drama', 'Thriller', 'Crime'],
    duration: '2h 30m',
    releaseDate: 'Oct 31, 2024',
    poster: LOCAL_POSTERS['lucky-baskhar'],
    banner: VALID_BANNER_URLS[0],
    accentColor: '#10b981',
    director: 'Venky Atluri',
    musicDirector: 'GV Prakash Kumar',
    cast: [
      { name: 'Dulquer Salmaan', role: 'Baskhar Kumar', initials: 'DQ' },
      { name: 'Meenakshi Chaudhary', role: 'Sumathi', initials: 'MC' },
      { name: 'Ramki', role: 'Anthony', initials: 'RK' },
      { name: 'Kishore', role: 'CBI Officer', initials: 'KS' },
    ],
    synopsis: 'An underpaid bank cashier in 1990s Bombay gets caught in a labyrinth of financial scams, greed, and money laundering when he exploits loop holes in the stock market boom.',
    criticConsensus: 'A smart, engaging period financial thriller with Dulquer Salmaan at his charming best.',
  },
  {
    slug: 'amaran',
    title: 'Amaran',
    tagline: 'Major Mukund Varadarajan AC biography',
    status: 'now_showing',
    isHero: false,
    rating: 9.1,
    voteCount: '112.5K',
    certification: 'UA 16+',
    languages: ['Tamil', 'Telugu', 'Hindi'],
    formats: ['2D', 'Dolby Atmos'],
    genres: ['Action', 'Biography', 'War'],
    duration: '2h 47m',
    releaseDate: 'Oct 31, 2024',
    poster: LOCAL_POSTERS['amaran'],
    banner: VALID_BANNER_URLS[1],
    accentColor: '#ef4444',
    director: 'Rajkumar Periasamy',
    musicDirector: 'GV Prakash Kumar',
    cast: [
      { name: 'Sivakarthikeyan', role: 'Major Mukund', initials: 'SK' },
      { name: 'Sai Pallavi', role: 'Indu Rebecca Varghese', initials: 'SP' },
      { name: 'Bhuvan Arora', role: 'Sepoy Vikram Singh', initials: 'BA' },
    ],
    synopsis: 'The moving, true-to-life chronicle of Ashok Chakra awardee Major Mukund Varadarajan and his unit in the 44 Rashtriya Rifles during counter-insurgency operations in Kashmir.',
    criticConsensus: 'Deeply emotional and authentic military drama elevated by Sivakarthikeyan and Sai Pallavi’s tear-jerking performances.',
  },
  {
    slug: 'stree-2',
    title: 'Stree 2: Sarkate Ka Aatank',
    tagline: 'O Stree kal mat aana, aaj hi aana',
    status: 'now_showing',
    isHero: false,
    rating: 8.7,
    voteCount: '198.3K',
    certification: 'UA',
    languages: ['Hindi', 'Telugu'],
    formats: ['2D', '4DX'],
    genres: ['Comedy', 'Horror'],
    duration: '2h 29m',
    releaseDate: 'Aug 15, 2024',
    poster: LOCAL_POSTERS['stree-2'],
    banner: VALID_BANNER_URLS[2],
    accentColor: '#a855f7',
    director: 'Amar Kaushik',
    musicDirector: 'Sachin-Jigar',
    cast: [
      { name: 'Shraddha Kapoor', role: 'Mystery Woman', initials: 'SK' },
      { name: 'Rajkummar Rao', role: 'Vicky', initials: 'RR' },
      { name: 'Pankaj Tripathi', role: 'Rudra Bhaiya', initials: 'PT' },
      { name: 'Aparshakti Khurana', role: 'Bittu', initials: 'AK' },
      { name: 'Abhishek Banerjee', role: 'Jana', initials: 'AB' },
    ],
    synopsis: 'The town of Chanderi is terrorized by a headless ghost named Sarkata who abducts modern independent women. The local gang re-summons Stree to combat this horrific menace.',
    criticConsensus: 'A laugh-out-loud horror comedy with terrific punchlines and seamless universe tie-ins.',
  },
  {
    slug: 'avengers-endgame',
    title: 'Avengers: Endgame',
    tagline: 'Part of the journey is the end',
    status: 'now_showing',
    isHero: true,
    rating: 9.6,
    voteCount: '492.5K',
    certification: 'UA 13+',
    languages: ['English', 'Telugu', 'Hindi', 'Tamil'],
    formats: ['IMAX 3D', '3D', '4DX', '2D'],
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '3h 01m',
    releaseDate: 'Special IMAX Re-Release',
    poster: LOCAL_POSTERS['avengers-endgame'],
    banner: LOCAL_POSTERS['avengers-endgame'],
    accentColor: '#8b5cf6',
    director: 'Anthony Russo, Joe Russo',
    musicDirector: 'Alan Silvestri',
    cast: [
      { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', initials: 'RDJ' },
      { name: 'Chris Evans', role: 'Steve Rogers / Captain America', initials: 'CE' },
      { name: 'Chris Hemsworth', role: 'Thor', initials: 'CH' },
      { name: 'Scarlett Johansson', role: 'Natasha Romanoff', initials: 'SJ' },
      { name: 'Josh Brolin', role: 'Thanos', initials: 'JB' },
    ],
    synopsis: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions and restore balance to the universe.',
    criticConsensus: 'An epic, emotional, and satisfying culmination of Marvel Studios’ decade-long Infinity Saga.',
  },
  {
    slug: 'avengers-infinity-war',
    title: 'Avengers: Infinity War',
    tagline: 'An entire universe. Once and for all.',
    status: 'now_showing',
    isHero: true,
    rating: 9.5,
    voteCount: '418.1K',
    certification: 'UA',
    languages: ['English', 'Telugu', 'Hindi', 'Tamil'],
    formats: ['IMAX 3D', '3D', '2D'],
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '2h 29m',
    releaseDate: 'Marvel Festival Showcase',
    poster: LOCAL_POSTERS['avengers-infinity-war'],
    banner: CINEMATIC_HERO_BANNERS['avengers-infinity-war'],
    accentColor: '#f59e0b',
    director: 'Anthony Russo, Joe Russo',
    musicDirector: 'Alan Silvestri',
    cast: [
      { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', initials: 'RDJ' },
      { name: 'Chris Hemsworth', role: 'Thor', initials: 'CH' },
      { name: 'Mark Ruffalo', role: 'Bruce Banner / Hulk', initials: 'MR' },
      { name: 'Benedict Cumberbatch', role: 'Doctor Strange', initials: 'BC' },
      { name: 'Tom Holland', role: 'Peter Parker / Spider-Man', initials: 'TH' },
    ],
    synopsis: 'The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos before his blitz of devastation and ruin puts an end to the universe.',
    criticConsensus: 'A jaw-dropping, high-stakes superhero spectacle with an unforgettable climax.',
  },
  {
    slug: 'the-avengers',
    title: 'The Avengers',
    tagline: 'Earth\'s Mightiest Heroes assemble',
    status: 'now_showing',
    isHero: false,
    rating: 9.3,
    voteCount: '372.4K',
    certification: 'UA',
    languages: ['English', 'Telugu', 'Hindi', 'Tamil'],
    formats: ['3D', '2D'],
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: '2h 23m',
    releaseDate: 'Marvel Classics Night',
    poster: LOCAL_POSTERS['the-avengers'],
    banner: LOCAL_POSTERS['the-avengers'],
    accentColor: '#3b82f6',
    director: 'Joss Whedon',
    musicDirector: 'Alan Silvestri',
    cast: [
      { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', initials: 'RDJ' },
      { name: 'Chris Evans', role: 'Steve Rogers / Captain America', initials: 'CE' },
      { name: 'Scarlett Johansson', role: 'Natasha Romanoff / Black Widow', initials: 'SJ' },
      { name: 'Tom Hiddleston', role: 'Loki', initials: 'TH' },
      { name: 'Samuel L. Jackson', role: 'Nick Fury', initials: 'SLJ' },
    ],
    synopsis: 'When an unexpected enemy emerges that threatens global safety and security, Nick Fury finds himself in need of a team to pull the world back from the brink of disaster.',
    criticConsensus: 'The groundbreaking blockbuster that defined the modern superhero genre.',
  },
  {
    slug: 'avengers-doomsday',
    title: 'Avengers: Doomsday',
    tagline: 'Doomsday is coming',
    status: 'upcoming',
    isHero: false,
    rating: null,
    expectedRating: '9.8/10',
    certification: 'UA 13+',
    languages: ['English', 'Telugu', 'Hindi', 'Tamil'],
    formats: ['IMAX 3D', '3D', '4DX', '2D'],
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    duration: 'TBA',
    releaseDate: 'December 18, 2026',
    poster: LOCAL_POSTERS['avengers-doomsday'],
    banner: LOCAL_POSTERS['avengers-doomsday'],
    accentColor: '#10b981',
    director: 'Anthony Russo, Joe Russo',
    musicDirector: 'Alan Silvestri',
    cast: [
      { name: 'Robert Downey Jr.', role: 'Doctor Victor von Doom', initials: 'RDJ' },
      { name: 'Pedro Pascal', role: 'Reed Richards / Mr. Fantastic', initials: 'PP' },
      { name: 'Vanessa Kirby', role: 'Sue Storm / Invisible Woman', initials: 'VK' },
      { name: 'Joseph Quinn', role: 'Johnny Storm / Human Torch', initials: 'JQ' },
      { name: 'Ebon Moss-Bachrach', role: 'Ben Grimm / The Thing', initials: 'EMB' },
    ],
    synopsis: 'Earth\'s mightiest heroes and allies from across the multiverse face their ultimate existential reckoning against Doctor Victor von Doom in Marvel Studios\' seismic next chapter.',
    criticConsensus: 'The highly anticipated fifth Avengers blockbuster bringing Robert Downey Jr. back in a chilling turn as Doctor Doom.',
  },
  {
    slug: 'varanasi-epic',
    title: 'Varanasi',
    tagline: 'Filmed for IMAX • In Cinemas April 2027',
    status: 'upcoming',
    isHero: false,
    rating: null,
    expectedRating: '9.9/10',
    certification: 'UA',
    languages: ['Telugu', 'Hindi', 'Tamil', 'English', 'Malayalam'],
    formats: ['IMAX 1.43:1', 'IMAX 3D', 'Dolby Cinema', '2D'],
    genres: ['Adventure', 'Action', 'Mythology'],
    duration: 'TBA',
    releaseDate: 'April 07, 2027 (Ugadi)',
    poster: LOCAL_POSTERS['varanasi-epic'],
    banner: LOCAL_POSTERS['varanasi-epic'],
    accentColor: '#38bdf8',
    director: 'S. S. Rajamouli',
    musicDirector: 'M. M. Keeravani',
    cast: [
      { name: 'Mahesh Babu', role: 'Rudhra', initials: 'MB' },
      { name: 'Priyanka Chopra Jonas', role: 'Mandakini', initials: 'PC' },
      { name: 'Prithviraj Sukumaran', role: 'Kumbha', initials: 'PS' },
    ],
    synopsis: 'A globetrotting mythological action-adventure epic from director S. S. Rajamouli. The first Indian film shot natively in the giant 1.43:1 IMAX format, taking audiences on an unprecedented journey.',
    criticConsensus: 'S. S. Rajamouli’s monumental cinematic masterwork starring Superstar Mahesh Babu, shot natively for the world\'s largest IMAX screens.',
  },
  {
    slug: 'raaka',
    title: 'Raaka',
    tagline: 'An Atlee Film • Sun Pictures',
    status: 'upcoming',
    isHero: false,
    rating: null,
    expectedRating: '9.7/10',
    certification: 'UA',
    languages: ['Telugu', 'Tamil', 'Hindi', 'Malayalam', 'Kannada'],
    formats: ['2D', '3D', 'IMAX'],
    genres: ['Action', 'Sci-Fi', 'Fantasy'],
    duration: 'TBA',
    releaseDate: 'Late 2025 / 2026',
    poster: LOCAL_POSTERS['raaka'],
    banner: LOCAL_POSTERS['raaka'],
    accentColor: '#d97706',
    director: 'Atlee',
    musicDirector: 'Anirudh Ravichander',
    cast: [
      { name: 'Allu Arjun', role: 'Raaka', initials: 'AA' },
      { name: 'Deepika Padukone', role: 'Tara', initials: 'DP' },
      { name: 'Trisha Krishnan', role: 'Meera', initials: 'TK' },
    ],
    synopsis: 'An intense pan-Indian sci-fi action fantasy chronicling an ancient warrior\'s ferocious spirit reborn in a futuristic high-stakes clash. Directed by Atlee and produced by Sun Pictures.',
    criticConsensus: 'Icon Star Allu Arjun joins forces with blockbuster director Atlee in a fierce, never-before-seen warrior avatar.',
  },
  {
    slug: 'ramayana-part-1',
    title: 'Ramayana Part 1: Rise of a Legend',
    tagline: 'The Eternal Epic • Directed by Nitesh Tiwari',
    status: 'upcoming',
    isHero: false,
    rating: null,
    expectedRating: '9.9/10',
    certification: 'UA',
    languages: ['Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'],
    formats: ['IMAX 3D', 'Dolby Cinema', '3D', '2D', '4DX'],
    genres: ['Mythology', 'Action', 'Adventure'],
    duration: 'TBA',
    releaseDate: 'Diwali 2026 / 2027',
    poster: LOCAL_POSTERS['ramayana-part-1'],
    banner: LOCAL_POSTERS['ramayana-part-1'],
    accentColor: '#f59e0b',
    director: 'Nitesh Tiwari',
    musicDirector: 'A. R. Rahman & Hans Zimmer',
    cast: [
      { name: 'Ranbir Kapoor', role: 'Lord Rama', initials: 'RK' },
      { name: 'Sai Pallavi', role: 'Mata Sita', initials: 'SP' },
      { name: 'Yash', role: 'Ravana', initials: 'Y' },
      { name: 'Sunny Deol', role: 'Lord Hanuman', initials: 'SD' },
      { name: 'Arun Govil', role: 'King Dasharatha', initials: 'AG' },
    ],
    synopsis: 'An epic cinematic rendition of the monumental Indian saga directed by Nitesh Tiwari. Tracing the divine birth, righteous journey, and heroic exile of Lord Rama (Ranbir Kapoor), alongside Sita (Sai Pallavi) and the legendary clash against the mighty demon king Ravana (Yash), scored by Oscar-winners A.R. Rahman and Hans Zimmer.',
    criticConsensus: 'India\'s most grand and ambitious cinematic epic bringing together an extraordinary pan-Indian ensemble with music by A.R. Rahman and Hans Zimmer.',
  },
];

const SEED_THEATRES = [
  {
    slug: 'th-sudha',
    name: 'Sudha Complex 4K Dolby Atmos',
    city: 'Anantapur',
    location: 'Subhash Road, Near Clock Tower, Anantapur',
    badge: '4K Laser Projection',
    formats: ['2D', '3D', 'Dolby Atmos'],
    facilities: ['M-Ticket', 'Food & Beverages', 'Recliner Seats', 'Parking'],
    screens: 2,
    rawShows: [
      { time: '10:45 AM', format: 'Telugu 2D', price: 180, status: 'filling' },
      { time: '02:00 PM', format: 'Telugu 2D', price: 180, status: 'available' },
      { time: '06:15 PM', format: 'Telugu 3D Atmos', price: 220, status: 'almost_full' },
      { time: '09:45 PM', format: 'Telugu 3D Atmos', price: 220, status: 'available' },
    ],
  },
  {
    slug: 'th-gowri',
    name: 'Gowri Cineplex & A/C Cinema',
    city: 'Anantapur',
    location: 'Arts College Road, Anantapur',
    badge: 'Dolby 7.1 Sound',
    formats: ['2D', 'Dolby 7.1'],
    facilities: ['M-Ticket', 'Snack Bar', 'Wheelchair Access'],
    screens: 1,
    rawShows: [
      { time: '11:15 AM', format: 'Telugu 2D', price: 150, status: 'available' },
      { time: '02:30 PM', format: 'Telugu 2D', price: 150, status: 'available' },
      { time: '06:45 PM', format: 'Telugu 2D', price: 170, status: 'filling' },
      { time: '10:00 PM', format: 'Hindi 2D', price: 170, status: 'available' },
    ],
  },
  {
    slug: 'th-sv',
    name: 'SV Multiplex: Screen 1 & 2',
    city: 'Anantapur',
    location: 'Sapthagiri Circle, Anantapur',
    badge: 'RGB Laser & Atmos',
    formats: ['2D', '3D', 'IMAX Experience'],
    facilities: ['M-Ticket', 'Gourmet Food', 'Executive Lounges'],
    screens: 2,
    rawShows: [
      { time: '10:00 AM', format: 'Telugu 3D', price: 200, status: 'almost_full' },
      { time: '01:30 PM', format: 'Hindi 2D', price: 190, status: 'available' },
      { time: '05:30 PM', format: 'Telugu 3D', price: 240, status: 'almost_full' },
      { time: '09:15 PM', format: 'Telugu 3D', price: 240, status: 'filling' },
    ],
  },
  {
    slug: 'th-triveni',
    name: 'Triveni Deluxe A/C Theatre',
    city: 'Anantapur',
    location: 'RTC Bus Stand Road, Anantapur',
    badge: 'Digital 4K Sound',
    formats: ['2D'],
    facilities: ['M-Ticket', 'Affordable Canteen', 'Bike Parking'],
    screens: 1,
    rawShows: [
      { time: '11:00 AM', format: 'Telugu 2D', price: 130, status: 'available' },
      { time: '02:15 PM', format: 'Telugu 2D', price: 130, status: 'available' },
      { time: '06:00 PM', format: 'Telugu 2D', price: 150, status: 'filling' },
      { time: '09:30 PM', format: 'Telugu 2D', price: 150, status: 'available' },
    ],
  },
];

// Helper: Generates ISO date strings (YYYY-MM-DD) for today and next 3 days
const getIsoDates = () => {
  const dates = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
};

// Safe helper: sanitizes connection string to never leak passwords or credentials to logs
const getSanitizedHost = (uri) => {
  try {
    const parsed = new URL(uri);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return '127.0.0.1:27017/imovies';
  }
};

const seedDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies';

  console.log(`[iMovies Seeder] Initializing connection to database (${getSanitizedHost(mongoUri)})...`);
  await mongoose.connect(mongoUri);
  console.log(`[iMovies Seeder] Connected to database: ${mongoose.connection.name} on ${mongoose.connection.host}`);

  console.log('[iMovies Seeder] Ensuring schema indexes are built and synchronized in MongoDB...');
  await Movie.init();
  await Theatre.init();
  await Showtime.init();
  console.log('✓ All schema indexes verified.');

  console.log(`[iMovies Seeder] Execution Mode: ${FORCE_UPDATE ? 'FORCE UPDATE (--force-update enabled)' : 'SAFE PRESERVATION (default)'}`);

  // 1. Seed Movies: Preserve existing records by default
  console.log(`[iMovies Seeder] Processing ${SEED_MOVIES.length} movies...`);
  const movieMap = new Map();
  let moviesCreated = 0;
  let moviesPreserved = 0;
  let moviesUpdated = 0;

  for (const m of SEED_MOVIES) {
    const existingMovie = await Movie.findOne({ slug: m.slug });

    if (existingMovie && !FORCE_UPDATE) {
      movieMap.set(existingMovie.slug, existingMovie);
      moviesPreserved++;
    } else if (existingMovie && FORCE_UPDATE) {
      const updatedMovie = await Movie.findOneAndUpdate(
        { slug: m.slug },
        { $set: m },
        { new: true, runValidators: true }
      );
      movieMap.set(updatedMovie.slug, updatedMovie);
      moviesUpdated++;
    } else {
      const createdMovie = await Movie.create(m);
      movieMap.set(createdMovie.slug, createdMovie);
      moviesCreated++;
    }
  }

  console.log(`✓ Movies summary: ${moviesCreated} created, ${moviesPreserved} preserved, ${moviesUpdated} updated.`);

  // 2. Seed Theatres: Preserve existing records by default
  console.log(`[iMovies Seeder] Processing ${SEED_THEATRES.length} theatres...`);
  const theatreMap = new Map();
  let theatresCreated = 0;
  let theatresPreserved = 0;
  let theatresUpdated = 0;

  for (const t of SEED_THEATRES) {
    const theatrePayload = {
      slug: t.slug,
      name: t.name,
      city: t.city,
      location: t.location,
      badge: t.badge,
      formats: t.formats,
      facilities: t.facilities,
      screens: t.screens,
    };

    const existingTheatre = await Theatre.findOne({ slug: t.slug });

    if (existingTheatre && !FORCE_UPDATE) {
      theatreMap.set(existingTheatre.slug, { doc: existingTheatre, rawShows: t.rawShows });
      theatresPreserved++;
    } else if (existingTheatre && FORCE_UPDATE) {
      const updatedTheatre = await Theatre.findOneAndUpdate(
        { slug: t.slug },
        { $set: theatrePayload },
        { new: true, runValidators: true }
      );
      theatreMap.set(updatedTheatre.slug, { doc: updatedTheatre, rawShows: t.rawShows });
      theatresUpdated++;
    } else {
      const createdTheatre = await Theatre.create(theatrePayload);
      theatreMap.set(createdTheatre.slug, { doc: createdTheatre, rawShows: t.rawShows });
      theatresCreated++;
    }
  }

  console.log(`✓ Theatres summary: ${theatresCreated} created, ${theatresPreserved} preserved, ${theatresUpdated} updated.`);

  // 3. Seed Showtimes idempotently
  // Stable compound unique key: { movie, theatre, date, time, format }
  // Uses $setOnInsert for bookedSeats so existing reservations are NEVER reset or wiped out!
  console.log('[iMovies Seeder] Processing showtimes for now_showing movies & theatres...');
  const isoDates = getIsoDates();
  let showsCreated = 0;
  let showsPreserved = 0;
  let showsUpdated = 0;

  const nowShowingMovies = Array.from(movieMap.values()).filter(
    (m) => m.status === 'now_showing'
  );

  for (const movieDoc of nowShowingMovies) {
    for (const [_, { doc: theatreDoc, rawShows }] of theatreMap.entries()) {
      for (const isoDate of isoDates) {
        for (const st of rawShows) {
          const filter = {
            movie: movieDoc._id,
            theatre: theatreDoc._id,
            date: isoDate,
            time: st.time,
            format: st.format,
          };

          const existingShow = await Showtime.findOne(filter);

          if (existingShow && !FORCE_UPDATE) {
            showsPreserved++;
            continue;
          }

          try {
            if (existingShow && FORCE_UPDATE) {
              // Update existing showtime without overwriting bookedSeats
              await Showtime.updateOne(filter, {
                $set: {
                  price: st.price,
                  status: st.status,
                  totalSeats: 60,
                },
              });
              showsUpdated++;
            } else {
              // Create new showtime slot with default initial bookedSeats
              await Showtime.create({
                ...filter,
                price: st.price,
                status: st.status,
                totalSeats: 60,
                bookedSeats: ['A2', 'A3', 'B4', 'B5', 'B6'],
              });
              showsCreated++;
            }
          } catch (err) {
            if (err.code === 11000) {
              // Gracefully handle duplicate-key error if slot already exists
              showsPreserved++;
            } else {
              throw err;
            }
          }
        }
      }
    }
  }

  console.log(`✓ Showtimes summary: ${showsCreated} created, ${showsPreserved} preserved, ${showsUpdated} updated.`);
  console.log('[iMovies Seeder] Execution finished successfully.');
};

// Reliable execution with guaranteed cleanup on both success and failure
const run = async () => {
  let exitCode = 0;
  try {
    await seedDatabase();
  } catch (error) {
    console.error('[iMovies Seeder] Error during seeding:', error.message);
    exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close();
        console.log('[iMovies Seeder] MongoDB connection closed safely.');
      } catch (closeErr) {
        console.error('[iMovies Seeder] Error closing MongoDB connection:', closeErr.message);
      }
    }
    process.exit(exitCode);
  }
};

run();
