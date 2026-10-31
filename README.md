# iMovies Application 🎬

A modern, full-stack movie ticket booking and cinema management platform built with the MERN stack (MongoDB, Express.js, React, Node.js) and Vite. Features a dark cinema aesthetic, real-time seat selection, safe demo payment simulation, customer reviews, user watchlists, and an administrative control panel for managing movies, theatres, and showtimes.

---

## 📋 Table of Contents

- [Overview & Key Features](#-overview--key-features)
- [Architecture & MVC Flow](#-architecture--mvc-flow)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Starting MongoDB Community Server](#-starting-mongodb-community-server)
- [Running the Application](#-running-the-application)
- [Local URLs & Endpoints](#-local-urls--endpoints)
- [Admin Access & Promotion Procedure](#-admin-access--promotion-procedure)
- [Demo Payment Simulation](#-demo-payment-simulation)
- [Production Build](#-production-build)
- [Database Seeding Scripts & Warnings](#-database-seeding-scripts--warnings)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview & Key Features

### User & Cinema Booking Features
- **Movie Catalog & Exploration**: Browse movies categorized as *Now Showing* or *Upcoming*. Filter by language, genre, or free-text search (matching title, director, cast, or genre).
- **Rich Movie Details**: View synopsis, cast, director, music director, runtime, certificate, formats (2D, 3D, IMAX 3D, 4DX), and audience ratings.
- **Audience Reviews & Ratings**: Submit, edit, and delete star ratings (1–5) and written reviews with real-time community rating recalculation.
- **User Watchlist**: Add and remove upcoming or current movies to personal watchlists with one click.
- **Interactive Seat Selection Grid**: Visual seating layout organized by tiers (Silver, Gold, Platinum) with real-time seat status tracking (Available, Selected, Booked).
- **Safe Demo Payment Simulation**: Multi-step checkout sandbox supporting simulated UPI, Card, and Net Banking with explicit **Success** and **Failure** options for testing (no real currency or bank accounts are ever charged).
- **Booking Management**: View past and active reservations with unique booking references (`IMOV-...`), format details, and live booking cancellation with simulated refund status.
- **Live Health Status Drawer**: Real-time database readiness indicator connected to `/api/health` that surfaces MongoDB connectivity status gracefully.

### Administrative Control Panel (`/admin`)
- **Cinema Metrics & Financial Overview**: Visual summary of total movies, active theatres, scheduled shows, confirmed bookings, and simulated demo revenue.
- **Movie Management**: Create new movies, edit existing movie metadata, and delete movies with **referential integrity safeguards** (prevents deletion if scheduled showtimes or customer bookings are linked).
- **Theatre Management**: Configure cinema halls with locations, screen counts, projection badges (e.g. 4K Laser), screening formats, and amenities (M-Ticket, Food Court, Dolby Atmos, Parking).
- **Showtime Scheduling**: Schedule movie screenings across theatres, dates, and times with schedule conflict detection and booking protection guards.
- **Recent Transactions Feed**: Live audit stream of recent customer bookings, ticket counts, and demo transaction statuses.

---

## 📐 Architecture & MVC Flow

The application follows the Model-View-Controller (MVC) architectural pattern with a decoupled client-server model:

```
[React Frontend Client] (Port 5173 - Vite)
       │
       ▼ (HTTP REST API / Axios + JWT Bearer Token)
[Express Server Routes] (backend/routes/*)
       │
       ▼ (Dispatches to Controllers & Middleware)
[Controllers & Middleware] (backend/controllers/* & backend/middleware/*)
       │
       ▼ (Mongoose Schema Validation & Business Logic)
[Mongoose Models] (backend/models/*)
       │
       ▼ (Database Driver)
[MongoDB Database] (mongodb://127.0.0.1:27017/imovies)
```

---

## 💻 Technologies Used

### Backend
- **Node.js**: Server runtime environment.
- **Express.js (v4.19.2)**: RESTful web framework and routing engine.
- **MongoDB & Mongoose (v8.3.1)**: Document database and object modeling schema layer.
- **jsonwebtoken (v9.0.2)**: Stateless authentication via signed JWTs.
- **bcryptjs (v2.4.3)**: Salted password hashing.
- **cors (v2.8.5)**: Cross-Origin Resource Sharing handling.
- **dotenv (v16.4.5)**: Environment variable configuration.
- **multer (v1.4.5-lts.1)**: Multipart file upload handling.
- **socket.io (v4.7.5)**: Real-time event handling.
- **nodemon (v3.1.0)**: Development auto-reloading utility.

### Frontend
- **React (v18.3.1)**: Component-driven UI library.
- **Vite (v5.2.11)**: Next-generation frontend build tool and dev server.
- **React Router DOM (v6.23.0)**: Declarative client-side routing.
- **Redux Toolkit (`@reduxjs/toolkit` v2.2.3 & `react-redux` v9.1.1)**: Centralized state management.
- **Axios (v1.6.8)**: Promise-based HTTP client with interceptors for JWT authorization headers.
- **Bootstrap (v5.3.3)**: Responsive grid, utility classes, and base components.
- **React Toastify (v10.0.5)**: Toast notification system.

### Database
- **MongoDB Community Server**: Running locally on port `27017`.
- **Default Database Name**: `imovies`

---

## 📁 Project Structure

```
IMovies application/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── adminController.js    # Cinema statistics and analytics
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── bookingController.js  # Reservations and demo payments
│   │   ├── healthController.js   # MongoDB readiness health check
│   │   ├── movieController.js    # Movie CRUD and integrity checks
│   │   ├── reviewController.js   # Ratings and reviews
│   │   ├── showtimeController.js # Showtime scheduling and conflict detection
│   │   ├── theatreController.js  # Theatre management
│   │   └── watchlistController.js# User watchlist operations
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token validation and admin check
│   │   └── errorMiddleware.js    # 404 handler and error response formatter
│   ├── models/
│   │   ├── Booking.js            # Booking schema and seat reservations
│   │   ├── Movie.js              # Movie schema with cast and metadata
│   │   ├── Review.js             # Review schema with compound uniqueness
│   │   ├── Showtime.js           # Showtime schema with seat mapping
│   │   ├── Theatre.js            # Theatre and screens schema
│   │   └── User.js               # User accounts and password hashing
│   ├── routes/                   # Express route definitions
│   ├── services/                 # Backend business services (booking calculations)
│   ├── utils/
│   │   ├── promoteAdmin.js       # Dedicated admin role promotion script
│   │   └── seedData.js           # Database seeder with safe preservation mode
│   ├── .env.example              # Environment variables template
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Server entry point
├── frontend/
│   ├── public/                   # Static assets (posters, banners, logos)
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, Modals, Cards)
│   │   ├── data/                 # Mock fallback datasets (for offline mode)
│   │   ├── features/             # Redux slices (authSlice, bookingSlice, etc.)
│   │   ├── pages/                # Route screens (HomePage, AdminDashboardPage, etc.)
│   │   ├── services/             # Axios API integration clients
│   │   ├── App.jsx               # App layout and route declarations
│   │   └── main.jsx              # React DOM entry point
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite configuration with /api proxy
└── README.md                     # Project documentation
```

---

## ⚙️ Prerequisites

Ensure the following tools are installed on your machine:

1. **Node.js**: Version 18.x or higher (verify via `node -v`).
2. **npm**: Version 9.x or higher (verify via `npm -v`).
3. **MongoDB Community Server**: Version 6.0 or higher running locally on port `27017`.
4. *(Optional)* **MongoDB Compass**: For visually viewing database collections.

---

## 📦 Installation & Setup

Clone or open the project folder in your terminal, then install dependencies for both the backend and the frontend:

### 1. Install Backend Dependencies
```powershell
cd backend
npm install
cd ..
```

### 2. Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

---

## 🔐 Environment Variables

The backend requires environment variables to connect to MongoDB and sign authentication tokens.

A template is provided in `backend/.env.example`. Create or verify your `backend/.env` file:

```powershell
# In the backend directory
Copy-Item .env.example .env
```

### Configuration Keys (`backend/.env`):

```env
# Port on which the Express server listens
PORT=5000

# Application environment mode (development | production)
NODE_ENV=development

# MongoDB connection URI (points to local MongoDB Community Server)
MONGO_URI=mongodb://127.0.0.1:27017/imovies

# Strong secret key used for signing JWT tokens (do not share publicly)
JWT_SECRET=your_custom_secret_key_here

# Frontend origin allowed by CORS
CLIENT_URL=http://localhost:5173
```

> [!IMPORTANT]
> Never commit real secrets, private keys, or credentials to version control. The `.env` file is included in `.gitignore`.

---

## 🗄️ Starting MongoDB Community Server

Before running the backend, MongoDB must be active on your machine.

### On Windows:
- **As a Windows Service** (Default installation):
  ```powershell
  net start MongoDB
  ```
  *(Or open `services.msc`, locate **MongoDB Server**, and click **Start**)*.

- **Manual command-line start**:
  ```powershell
  mongod --dbpath "C:\data\db"
  ```

### On macOS / Linux:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod
```

To verify MongoDB is running, you can connect using MongoDB Compass or the `mongosh` shell at `mongodb://127.0.0.1:27017/`.

---

## 🚀 Running the Application

Always run the backend and frontend in **two separate terminal windows**.

### Terminal 1: Backend Server

```powershell
cd backend
npm run dev
```

- Starts the Express API server with `nodemon` on **`http://localhost:5000`**.
- Verifies database connection: `[MongoDB] Successfully connected to: imovies`.

### Terminal 2: Frontend Client

```powershell
cd frontend
npm run dev
```

- Starts the Vite development server on **`http://localhost:5173`**.
- Opens or displays the local URL. Open **`http://localhost:5173`** in your browser.

---

## 🌐 Local URLs & Endpoints

| Resource | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Main user interface |
| **Admin Dashboard** | [http://localhost:5173/admin](http://localhost:5173/admin) | Cinema management control panel |
| **Backend API Root** | [http://localhost:5000](http://localhost:5000) | Express API welcome message |
| **Health Check Endpoint** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | MongoDB readiness status (200 / 503) |
| **Movies API** | [http://localhost:5000/api/movies](http://localhost:5000/api/movies) | Catalog endpoints |
| **Theatres API** | [http://localhost:5000/api/theatres](http://localhost:5000/api/theatres) | Cinema theatre listings |
| **Showtimes API** | [http://localhost:5000/api/shows](http://localhost:5000/api/shows) | Scheduled movie slots |

---

## 🛡️ Admin Access & Promotion Procedure

The application uses role-based access control (`user` vs `admin`). All public registrations are automatically assigned the default `user` role.

To access the **Admin Dashboard** (`/admin`), follow the verified promotion procedure:

### Step 1: Register an Account
1. Open the app in your browser at `http://localhost:5173`.
2. Click **Sign In** in the top navigation bar, then click **Register**.
3. Create your account with your name, email, and password.

### Step 2: Run the Admin Promotion Script
Open your backend terminal and run the project's dedicated promotion utility:

```powershell
cd backend
npm run promote-admin
```

This runs `backend/utils/promoteAdmin.js`. By default, this script:
1. Connects safely to your local MongoDB `imovies` database.
2. Queries the targeted user account.
3. Performs an atomic update modifying **only** the `role` field from `"user"` to `"admin"`.
4. Verifies the updated record and closes the database connection cleanly.

*(Note: To promote a different email address, open `backend/utils/promoteAdmin.js` and set the `TARGET_EMAIL` constant to your registered email address before running the script).*

### Step 3: Access the Admin Dashboard
1. Log in on the frontend with your promoted account credentials.
2. An **Admin** / **Admin Console** badge will now appear in the navigation bar.
3. Click the badge or navigate directly to `http://localhost:5173/admin`.

---

## 💳 Demo Payment Simulation

The iMovies platform includes a built-in **Demo Payment Sandbox** for testing cinema ticket bookings safely.

> [!NOTE]
> **No real payments are ever processed.** The application does not connect to real financial gateways, and no credit card or bank account will ever be charged.

### How the Demo Payment Flow Works:
1. **Seat Selection**: The user selects a movie, theatre, date, time, and seats.
2. **Review & Summary**: The user inspects the transparent price breakdown (ticket price, convenience fee, and GST).
3. **Demo Payment Sandbox**:
   - The user selects a simulated payment method (Demo UPI, Demo Card, or Demo Net Banking).
   - Two clear testing actions are provided:
     - **Simulate Success (Demo)**: Authorizes the transaction. The booking status becomes `confirmed`, payment status is set to `paid`, seats remain locked to that user, and a printable e-ticket with a unique reference number (`IMOV-...`) is generated.
     - **Simulate Failure (Demo)**: Emulates an authorization failure. The booking status is marked as `failed`, the temporarily reserved seats are immediately released back to the showtime for other users, and an informative retry alert is displayed.
     - **Cancel Demo & Release Seats**: Allows the user to abandon checkout and instantly release their held seats.

---

## 🏗️ Production Build

To create an optimized production build of the React frontend:

```powershell
cd frontend
npm run build
```

This command runs `vite build`, producing minified JavaScript, CSS, and HTML assets in the `frontend/dist/` directory.

### Preview Production Build Locally:
```powershell
cd frontend
npm run preview
```
This serves the contents of `dist/` on a local preview server (typically `http://localhost:4173`).

---

## ⚠️ Database Seeding Scripts & Warnings

The project includes an optional database seeding utility located at `backend/utils/seedData.js`.

```powershell
# From the backend directory:
npm run seed
```

### Safety Features of `seedData.js`:
- **Safe Preservation Mode (Default)**: By default, the script checks existing movies and theatres by their unique `slug`. If a record already exists, it is **preserved without modification**.
- **User Accounts Protected**: The `users` collection and customer bookings are **never** dropped or overwritten.
- **Showtimes Preservation**: Existing showtime slots and their `bookedSeats` are kept intact.

### ⚠️ Critical Warning Before Running Seeding:
> [!CAUTION]
> - **Always back up your database first** before running seed commands:
>   ```powershell
>   mongodump --db imovies --out ./backup
>   ```
> - Do not run `npm run seed -- --force-update` unless you intentionally wish to overwrite your movie catalog with the default presets.
> - Never run seed scripts against an active production database.

---

## 🔧 Troubleshooting

### 1. Database Connection Refused (`ECONNREFUSED 127.0.0.1:27017`)
- **Cause**: MongoDB Community Server is not running on your machine.
- **Solution**:
  - Run `net start MongoDB` in PowerShell as Administrator.
  - Or open `services.msc` and ensure **MongoDB Server** is in the "Running" state.
  - Check that the `MONGO_URI` in `backend/.env` is set to `mongodb://127.0.0.1:27017/imovies`.

### 2. Health Endpoint Reports 503 (`Database Disconnected`)
- **Cause**: The backend server is running, but cannot reach MongoDB.
- **Solution**: Inspect your terminal logs. The frontend live status drawer will notify you when MongoDB is offline and switch to safe preview fallback mode until MongoDB is restarted.

### 3. Port Already in Use (`EADDRINUSE :::5000` or `:::5173`)
- **Cause**: A previous Node or Vite process is still running in the background.
- **Solution**:
  - Identify and terminate the occupying process on Windows:
    ```powershell
    netstat -ano | findstr :5000
    taskkill /PID <PID> /F
    ```
  - Alternatively, change `PORT=5001` in `backend/.env` and update the proxy target in `frontend/vite.config.js`.

### 4. Admin Dashboard Access Denied (HTTP 403 / "Administrator Authentication Required")
- **Cause**: The logged-in account does not possess the `"admin"` role in MongoDB.
- **Solution**:
  1. Ensure you have registered the account first.
  2. Run `npm run promote-admin` from the `backend/` folder.
  3. Log out and log back in on the website to receive an updated JWT authentication token with administrative claims.

### 5. CORS Errors in Browser Console
- **Cause**: The frontend client URL does not match `CLIENT_URL` in `backend/.env`.
- **Solution**: Verify that `CLIENT_URL=http://localhost:5173` in `backend/.env`.

---

## 📄 License & Academic Attribution
Developed as part of the Skill Wallet academic capstone curriculum. Built for learning full-stack MERN architecture, secure authentication, relational integrity safeguards, and reactive state management.
