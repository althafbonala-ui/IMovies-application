/**
 * Mock Indian Movies & Theatres Data for iMovies
 * Curated for BookMyShow-style experience in Anantapur & Andhra Pradesh
 */

// High-reliability curated set of movie poster images
export const VALID_POSTER_URLS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80', // Cinema camera / reel
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80', // Theatre auditorium
  'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=700&q=80', // Classic cinema
  'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=700&q=80', // Dramatic neon cinema
];

// High-reliability curated set of widescreen hero banner images
export const VALID_BANNER_URLS = [
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80', // Wide cinema hall
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80', // Wide epic landscape
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80', // Wide cinematic atmosphere
];

// Self-contained, guaranteed fallback SVG placeholders
// Self-contained, guaranteed attractive movie-specific SVG poster
export const getPosterPlaceholder = (movieOrTitle = 'Movie') => {
  const isObj = typeof movieOrTitle === 'object' && movieOrTitle !== null;
  const rawTitle = isObj ? movieOrTitle.title : movieOrTitle;
  const safeTitle = (rawTitle || 'iMovies Cinema')
    .replace(/[<>&"']/g, '')
    .trim();
  const accent = (isObj && movieOrTitle.accentColor) ? movieOrTitle.accentColor : '#f84464';
  const rawTagline = (isObj && movieOrTitle.tagline) ? movieOrTitle.tagline : 'Official Theatrical Release';
  const safeTagline = rawTagline.replace(/[<>&"']/g, '').slice(0, 52);
  const rawGenre = isObj && Array.isArray(movieOrTitle.genres) ? movieOrTitle.genres.slice(0, 3).join(' • ') : 'Action • Cinema';
  const safeGenre = rawGenre.replace(/[<>&"']/g, '');
  const cert = (isObj && movieOrTitle.certification) ? movieOrTitle.certification : 'UA';
  const formats = (isObj && Array.isArray(movieOrTitle.formats)) ? movieOrTitle.formats.slice(0, 2).join(' • ') : '2D • Atmos';
  const languages = (isObj && Array.isArray(movieOrTitle.languages)) ? movieOrTitle.languages.slice(0, 3).join(', ') : 'Telugu, Hindi';

  // Safe unique ID for SVG gradients to prevent collision between posters
  const idPrefix = 'p_' + safeTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

  // Split title into 1 or 2 lines for balanced poster typography
  const words = safeTitle.split(/\s+/).filter(Boolean);
  let line1 = safeTitle;
  let line2 = '';
  if (safeTitle.length > 15) {
    const colonIdx = safeTitle.indexOf(':');
    if (colonIdx > 0 && colonIdx < safeTitle.length - 2) {
      line1 = safeTitle.slice(0, colonIdx + 1).trim();
      line2 = safeTitle.slice(colonIdx + 1).trim();
    } else {
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    }
  }

  // Generate monogram (e.g., P2 for Pushpa 2, K for Kalki, D for Devara)
  let monogram = '';
  if (words.length >= 2) {
    monogram = (words[0][0] + words[1][0]).toUpperCase();
    if (words.length >= 3 && words[2][0]) {
      monogram += words[2][0].toUpperCase();
    }
  } else if (words.length === 1) {
    monogram = safeTitle.slice(0, 3).toUpperCase();
  } else {
    monogram = 'MOV';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="${idPrefix}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070b14"/>
        <stop offset="35%" stop-color="#0f172a"/>
        <stop offset="70%" stop-color="#0d1527"/>
        <stop offset="100%" stop-color="#04070d"/>
      </linearGradient>
      <radialGradient id="${idPrefix}_glow" cx="50%" cy="32%" r="50%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
        <stop offset="60%" stop-color="${accent}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${idPrefix}_accent_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <!-- Background Canvas -->
    <rect width="100%" height="100%" fill="url(#${idPrefix}_bg)"/>
    <rect width="100%" height="100%" fill="url(#${idPrefix}_glow)"/>
    
    <!-- Outer Decorative Borders -->
    <rect x="20" y="20" width="560" height="860" rx="20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    <rect x="30" y="30" width="540" height="840" rx="14" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.2"/>

    <!-- Top Cinema Header Branding -->
    <rect x="180" y="55" width="240" height="30" rx="15" fill="rgba(0,0,0,0.65)" stroke="${accent}" stroke-width="1.2"/>
    <text x="300" y="75" fill="${accent}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="3">iMOVIES ORIGINAL</text>

    <!-- Top Corner Accents -->
    <circle cx="50" cy="50" r="4" fill="${accent}" opacity="0.6"/>
    <circle cx="550" cy="50" r="4" fill="${accent}" opacity="0.6"/>

    <!-- Central Cinematic Hero Emblem -->
    <g transform="translate(300, 255)">
      <circle cx="0" cy="0" r="115" fill="none" stroke="${accent}" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="8,6"/>
      <circle cx="0" cy="0" r="96" fill="${accent}" fill-opacity="0.14"/>
      <circle cx="0" cy="0" r="80" fill="rgba(8, 13, 24, 0.9)" stroke="${accent}" stroke-opacity="0.7" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="66" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <text x="0" y="16" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" text-anchor="middle" letter-spacing="2">${monogram}</text>
    </g>

    <!-- Genre & Certification Pill Badge -->
    <rect x="120" y="415" width="360" height="30" rx="15" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
    <text x="300" y="435" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1.5">${safeGenre.toUpperCase()}</text>

    <!-- Movie Title -->
    ${line2 ? `
      <text x="300" y="515" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" text-anchor="middle" letter-spacing="-0.5">${line1}</text>
      <text x="300" y="560" fill="${accent}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="800" text-anchor="middle" letter-spacing="-0.5">${line2}</text>
    ` : `
      <text x="300" y="535" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="900" text-anchor="middle" letter-spacing="-0.5">${line1}</text>
    `}

    <!-- Tagline in Quotes -->
    <text x="300" y="625" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-style="italic" font-weight="500" text-anchor="middle">"${safeTagline}"</text>

    <!-- Decorative Divider Line with Diamond -->
    <line x1="200" y1="660" x2="400" y2="660" stroke="${accent}" stroke-opacity="0.4" stroke-width="1.5"/>
    <polygon points="300,655 305,660 300,665 295,660" fill="${accent}"/>

    <!-- Formats & Languages -->
    <text x="300" y="698" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="2">${formats.toUpperCase()} • ${cert}</text>
    <text x="300" y="726" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" text-anchor="middle">${languages}</text>

    <!-- Bottom Release Ribbon with Play Button -->
    <rect x="45" y="775" width="510" height="56" rx="14" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="85" cy="803" r="15" fill="${accent}"/>
    <polygon points="81,795 81,811 93,803" fill="#ffffff"/>
    <text x="115" y="808" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="1">OFFICIAL THEATRICAL RELEASE</text>
    <text x="525" y="808" fill="${accent}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" text-anchor="end">4K DOLBY</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getBannerPlaceholder = (movieOrTitle = 'Featured Blockbuster') => {
  const isObj = typeof movieOrTitle === 'object' && movieOrTitle !== null;
  const rawTitle = isObj ? movieOrTitle.title : movieOrTitle;
  const safeTitle = (rawTitle || 'Featured Blockbuster').replace(/[<>&"']/g, '').trim();
  const accent = (isObj && movieOrTitle.accentColor) ? movieOrTitle.accentColor : '#f84464';
  const rawTagline = (isObj && movieOrTitle.tagline) ? movieOrTitle.tagline : 'Experience the Ultimate Cinema Phenomenon';
  const safeTagline = rawTagline.replace(/[<>&"']/g, '').slice(0, 68);
  const rawGenre = isObj && Array.isArray(movieOrTitle.genres) ? movieOrTitle.genres.join(' • ') : 'Action • Thriller';
  const safeGenre = rawGenre.replace(/[<>&"']/g, '');
  const cert = (isObj && movieOrTitle.certification) ? movieOrTitle.certification : 'UA';
  const formats = (isObj && Array.isArray(movieOrTitle.formats)) ? movieOrTitle.formats.join(' • ') : 'IMAX 3D • Dolby Atmos • 4K';

  const idPrefix = 'b_' + safeTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="600" viewBox="0 0 1400 600">
    <defs>
      <linearGradient id="${idPrefix}_bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#050811"/>
        <stop offset="50%" stop-color="#0d1527"/>
        <stop offset="100%" stop-color="#04060c"/>
      </linearGradient>
      <radialGradient id="${idPrefix}_radial" cx="75%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.38"/>
        <stop offset="60%" stop-color="${accent}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Background Canvas -->
    <rect width="100%" height="100%" fill="url(#${idPrefix}_bg)"/>
    <rect width="100%" height="100%" fill="url(#${idPrefix}_radial)"/>
    
    <!-- Atmospheric Ambient Shapes & Rings -->
    <circle cx="1060" cy="280" r="200" fill="${accent}" fill-opacity="0.07"/>
    <circle cx="1060" cy="280" r="145" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="8,6"/>
    <circle cx="1060" cy="280" r="90" fill="rgba(10, 16, 28, 0.8)" stroke="${accent}" stroke-opacity="0.55" stroke-width="2.5"/>
    <polygon points="1050,255 1050,305 1085,280" fill="#ffffff"/>

    <!-- Subtle Border -->
    <line x1="0" y1="590" x2="1400" y2="590" stroke="${accent}" stroke-opacity="0.4" stroke-width="3"/>
    <rect x="35" y="35" width="1330" height="530" rx="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>

    <!-- Left Header Badges -->
    <rect x="80" y="100" width="220" height="32" rx="16" fill="rgba(248, 68, 100, 0.15)" stroke="#f84464" stroke-width="1.2"/>
    <text x="190" y="121" fill="#f84464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="2">FEATURED PREMIERE</text>
    
    <rect x="315" y="100" width="70" height="32" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="350" y="121" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${cert}</text>

    <!-- Large Title -->
    <text x="80" y="230" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="58" font-weight="900" letter-spacing="-1">${safeTitle}</text>
    
    <!-- Tagline & Genre -->
    <text x="80" y="290" fill="${accent}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700">"${safeTagline}"</text>
    <text x="80" y="335" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500">${safeGenre} • ${formats}</text>
    
    <!-- Branding Badge Bottom Left -->
    <rect x="80" y="415" width="260" height="42" rx="21" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="1.5"/>
    <text x="210" y="441" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1.5">🎟️ BOOK TICKETS ON iMOVIES</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const DEFAULT_POSTER = getPosterPlaceholder('iMovies');
export const DEFAULT_BANNER = getBannerPlaceholder('Featured Blockbuster');

export const CITIES = [
  { id: 'anantapur', name: 'Anantapur', state: 'Andhra Pradesh', isDefault: true, popular: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', popular: true },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', popular: true },
  { id: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', popular: true },
  { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', popular: true },
  { id: 'tirupati', name: 'Tirupati', state: 'Andhra Pradesh', popular: true },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', popular: true },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', popular: true },
  { id: 'kurnool', name: 'Kurnool', state: 'Andhra Pradesh', popular: false },
  { id: 'guntur', name: 'Guntur', state: 'Andhra Pradesh', popular: false },
];

export const THEATRES_ANANTAPUR = [
  {
    id: 'th-sudha',
    name: 'Sudha Complex 4K Dolby Atmos',
    location: 'Subhash Road, Near Clock Tower, Anantapur',
    badge: '4K Laser Projection',
    formats: ['2D', '3D', 'Dolby Atmos'],
    facilities: ['M-Ticket', 'Food & Beverages', 'Recliner Seats', 'Parking'],
    showtimes: [
      { time: '10:45 AM', format: 'Telugu 2D', price: 180, status: 'filling' },
      { time: '02:00 PM', format: 'Telugu 2D', price: 180, status: 'available' },
      { time: '06:15 PM', format: 'Telugu 3D Atmos', price: 220, status: 'almost_full' },
      { time: '09:45 PM', format: 'Telugu 3D Atmos', price: 220, status: 'available' },
    ],
  },
  {
    id: 'th-gowri',
    name: 'Gowri Cineplex & A/C Cinema',
    location: 'Arts College Road, Anantapur',
    badge: 'Dolby 7.1 Sound',
    formats: ['2D', 'Dolby 7.1'],
    facilities: ['M-Ticket', 'Snack Bar', 'Wheelchair Access'],
    showtimes: [
      { time: '11:15 AM', format: 'Telugu 2D', price: 150, status: 'available' },
      { time: '02:30 PM', format: 'Telugu 2D', price: 150, status: 'available' },
      { time: '06:45 PM', format: 'Telugu 2D', price: 170, status: 'filling' },
      { time: '10:00 PM', format: 'Hindi 2D', price: 170, status: 'available' },
    ],
  },
  {
    id: 'th-sv',
    name: 'SV Multiplex: Screen 1 & 2',
    location: 'Sapthagiri Circle, Anantapur',
    badge: 'RGB Laser & Atmos',
    formats: ['2D', '3D', 'IMAX Experience'],
    facilities: ['M-Ticket', 'Gourmet Food', 'Executive Lounges'],
    showtimes: [
      { time: '10:00 AM', format: 'Telugu 3D', price: 200, status: 'almost_full' },
      { time: '01:30 PM', format: 'Hindi 2D', price: 190, status: 'available' },
      { time: '05:30 PM', format: 'Telugu 3D', price: 240, status: 'almost_full' },
      { time: '09:15 PM', format: 'Telugu 3D', price: 240, status: 'filling' },
    ],
  },
  {
    id: 'th-triveni',
    name: 'Triveni Deluxe A/C Theatre',
    location: 'RTC Bus Stand Road, Anantapur',
    badge: 'Digital 4K Sound',
    formats: ['2D'],
    facilities: ['M-Ticket', 'Affordable Canteen', 'Bike Parking'],
    showtimes: [
      { time: '11:00 AM', format: 'Telugu 2D', price: 130, status: 'available' },
      { time: '02:15 PM', format: 'Telugu 2D', price: 130, status: 'available' },
      { time: '06:00 PM', format: 'Telugu 2D', price: 150, status: 'filling' },
      { time: '09:30 PM', format: 'Telugu 2D', price: 150, status: 'available' },
    ],
  },
];

const RAW_MOVIES = [
  {
    id: 'pushpa-2',
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
    poster: VALID_POSTER_URLS[0],
    banner: VALID_BANNER_URLS[0],
    posterUrl: VALID_POSTER_URLS[0],
    image: VALID_POSTER_URLS[0],
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
    id: 'kalki-2898-ad',
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
    poster: VALID_POSTER_URLS[1],
    banner: VALID_BANNER_URLS[1],
    posterUrl: VALID_POSTER_URLS[1],
    image: VALID_POSTER_URLS[1],
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
    id: 'devara-part-1',
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
    poster: VALID_POSTER_URLS[2],
    banner: VALID_BANNER_URLS[2],
    posterUrl: VALID_POSTER_URLS[2],
    image: VALID_POSTER_URLS[2],
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
    id: 'lucky-baskhar',
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
    poster: VALID_POSTER_URLS[3],
    banner: VALID_BANNER_URLS[0],
    posterUrl: VALID_POSTER_URLS[3],
    image: VALID_POSTER_URLS[3],
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
    id: 'amaran',
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
    poster: VALID_POSTER_URLS[1],
    banner: VALID_BANNER_URLS[1],
    posterUrl: VALID_POSTER_URLS[1],
    image: VALID_POSTER_URLS[1],
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
    id: 'stree-2',
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
    poster: VALID_POSTER_URLS[0],
    banner: VALID_BANNER_URLS[2],
    posterUrl: VALID_POSTER_URLS[0],
    image: VALID_POSTER_URLS[0],
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
    id: 'avengers-endgame',
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
    poster: '/posters/avengers-endgame.jpg',
    banner: '/posters/avengers-endgame.jpg',
    posterUrl: '/posters/avengers-endgame.jpg',
    image: '/posters/avengers-endgame.jpg',
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
    id: 'avengers-infinity-war',
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
    poster: '/posters/avengers-infinity-war.jpg',
    banner: '/posters/avengers-infinity-war.jpg',
    posterUrl: '/posters/avengers-infinity-war.jpg',
    image: '/posters/avengers-infinity-war.jpg',
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
    id: 'the-avengers',
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
    poster: '/posters/the-avengers.jpg',
    banner: '/posters/the-avengers.jpg',
    posterUrl: '/posters/the-avengers.jpg',
    image: '/posters/the-avengers.jpg',
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
  // Upcoming Movies
  {
    id: 'avengers-doomsday',
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
    poster: '/posters/avengers-doomsday.png',
    banner: '/posters/avengers-doomsday.png',
    posterUrl: '/posters/avengers-doomsday.png',
    image: '/posters/avengers-doomsday.png',
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
    id: 'varanasi-epic',
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
    poster: '/posters/varanasi-epic.jpg',
    banner: '/posters/varanasi-epic.jpg',
    posterUrl: '/posters/varanasi-epic.jpg',
    image: '/posters/varanasi-epic.jpg',
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
    id: 'raaka',
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
    poster: '/posters/raaka.jpg',
    banner: '/posters/raaka.jpg',
    posterUrl: '/posters/raaka.jpg',
    image: '/posters/raaka.jpg',
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
    id: 'ramayana-part-1',
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
    poster: '/posters/ramayana-part-1.jpg',
    banner: '/posters/ramayana-part-1.jpg',
    posterUrl: '/posters/ramayana-part-1.jpg',
    image: '/posters/ramayana-part-1.jpg',
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

// Curated map of real, local poster image paths stored in frontend/public/posters/
export const LOCAL_POSTERS = {
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

// Curated high-resolution widescreen cinematic backdrops for Hero Banner
export const CINEMATIC_HERO_BANNERS = {
  'pushpa-2': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85',
  'kalki-2898-ad': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2000&q=85',
  'devara-part-1': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
  'avengers-infinity-war': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85',
};

// Enrich each movie with real local posters and robust fallback assets
export const MOVIES = RAW_MOVIES.map((movie) => {
  const localPoster = LOCAL_POSTERS[movie.id] || `/posters/${movie.id}.jpg`;
  const fallbackSvg = getPosterPlaceholder(movie);
  const bannerSvg = getBannerPlaceholder(movie);
  const wideBanner = CINEMATIC_HERO_BANNERS[movie.id] || movie.banner || bannerSvg;

  return {
    ...movie,
    poster: localPoster,
    posterUrl: localPoster,
    image: localPoster,
    banner: wideBanner,
    bannerUrl: wideBanner,
    fallbackPoster: fallbackSvg,
    fallbackBanner: bannerSvg,
  };
});


