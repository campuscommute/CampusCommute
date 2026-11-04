# Campus Commute 🚗

> A student-only ride-sharing platform built for college commuters — verified, safe, and affordable.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=nodedotjs)](https://nodejs.org)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Technology Usage Table](#technology-usage-table)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)

---

## Overview

Campus Commute connects students who share the same college route. Drivers offer seats on their daily commute; passengers find and book verified rides. Every user is verified via college ID, making the platform inherently safer than generic ride-sharing apps.

**Core flow:**
1. Student signs up with phone + PIN → submits college ID + selfie
2. Admin verifies the student
3. Verified driver posts a ride with route, time, seats, and price
4. Passenger searches, books, and receives a 4-digit OTP
5. Driver verifies passenger OTP before starting the ride
6. Live GPS tracking is shared with passengers during the ride
7. Both sides rate each other after completion

---

## Features

| Feature | Description |
|---|---|
| Phone + PIN auth | No passwords — sign in with 10-digit mobile + 4-digit PIN |
| Student verification | College ID + selfie submitted; reviewed by admin |
| Offer a ride | Drivers post route, date, time, seats, price, vehicle details |
| Find a ride | Search by location with geo-radius, date picker, time filter |
| Booking + OTP | Passenger books → gets 4-digit OTP → driver scans to start ride |
| Live GPS tracking | Driver shares location via browser geolocation → Supabase Realtime |
| Women-only rides | Female drivers can restrict riders to women only |
| Messaging | Real-time in-app chat between driver and passenger |
| Rating system | Post-ride star ratings for both driver and passenger |
| SOS button | Emergency alert on live ride screen |
| Admin panel | Dashboard, verification review, user/ride/report management, support tickets |
| Help & Support | FAQ accordion, ticket submission, admin reply system |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser / PWA)                      │
│                                                                     │
│   React 19  ──  React Router v7  ──  Framer Motion  ──  Tailwind   │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │  Pages   │  │Components│  │ Context  │  │    Services      │  │
│   │ /find    │  │ RideCard │  │ AuthCtx  │  │ ridesService.js  │  │
│   │ /offer   │  │ BookingM │  │          │  │ bookingsService  │  │
│   │ /my-rides│  │ LiveMap  │  │          │  │ messagesService  │  │
│   │ /admin   │  │ BottomNav│  │          │  │ supportService   │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTPS / Supabase JS SDK
          ┌──────────────────┼──────────────────────┐
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────┐ ┌────────────────┐  ┌──────────────────────┐
│   Supabase BaaS │ │  Express REST  │  │   Supabase Realtime  │
│                 │ │  (Node.js)     │  │                      │
│  ┌───────────┐  │ │  /api/auth     │  │  • Live ride GPS     │
│  │PostgreSQL │  │ │  /api/rides    │  │  • Chat messages     │
│  │ profiles  │  │ │  /api/bookings │  │  • Booking updates   │
│  │ rides     │  │ │  /api/users    │  │                      │
│  │ bookings  │  │ │  /api/admin    │  └──────────────────────┘
│  │ messages  │  │ │               │
│  │ reports   │  │ │  Helmet + CORS │
│  │ tickets   │  │ │  Rate Limiting │
│  └───────────┘  │ │  JWT / bcrypt  │
│                 │ └────────────────┘
│  ┌───────────┐  │
│  │  Storage  │  │
│  │  avatars/ │  │
│  │  college- │  │
│  │  ids/     │  │
│  │  selfies/ │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │    RLS    │  │
│  │  Policies │  │
│  └───────────┘  │
└─────────────────┘
```

### Data Flow — Ride Booking

```
Passenger                    Supabase DB                    Driver
    │                             │                            │
    │── searchRides() ──────────► │                            │
    │◄─ rides[] ─────────────────  │                            │
    │                             │                            │
    │── requestBooking() ───────► │                            │
    │◄─ { bookingId, OTP } ──────  │                            │
    │                             │                            │
    │   [ride day]                │                            │
    │                             │ ◄── getMyOfferedRides() ── │
    │                             │  ──► rides + bookings[] ── │
    │                             │                            │
    │   Show OTP to driver ──────►│◄─── driverVerifyOTP() ──── │
    │                             │  ──► booking.status=active  │
    │                             │                            │
    │                             │ ◄── startRide() ─────────── │
    │                             │  ──► ride.status=active      │
    │                             │                            │
    │◄─ Realtime GPS update ──────│◄─── updateRideLocation() ── │
    │   LiveRidePage shows map    │                            │
    │                             │                            │
    │                             │ ◄── completeRide() ──────── │
    │◄─ Realtime status=completed │                            │
    │── rateBooking() ──────────► │                            │
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI component framework |
| **Vite** | 8 | Build tool and dev server with HMR |
| **React Router** | v7 | Client-side routing with nested routes |
| **Tailwind CSS** | v4 | Utility-first styling with custom design tokens |
| **Framer Motion** | 13 | Page transitions, micro-animations, spring physics |
| **Lucide React** | 1.38 | Consistent icon library (stroke-based SVGs) |
| **Supabase JS** | 2 | Database queries, auth, storage, Realtime subscriptions |

### Backend (Express REST API)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥18 | JavaScript runtime |
| **Express** | 4 | HTTP routing and middleware |
| **Mongoose** | 8 | MongoDB ODM for schema modeling |
| **JWT (jsonwebtoken)** | 9 | Stateless auth token generation/verification |
| **bcryptjs** | 2 | PIN hashing |
| **Helmet** | 7 | HTTP security headers |
| **express-rate-limit** | 7 | API rate limiting (100 req/15 min; 10 for auth) |
| **Multer** | 1.4 | File upload handling (profile images) |
| **Morgan** | 1 | HTTP request logging |
| **dotenv** | 16 | Environment variable management |
| **express-validator** | 7 | Request body validation |

### Database & BaaS

| Technology | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Primary database — all tables, indexes, triggers |
| **Supabase Auth** | Anonymous + custom auth session management |
| **Supabase Storage** | File storage for avatars, college IDs, selfies |
| **Supabase Realtime** | Live GPS updates, instant chat message delivery |
| **Row Level Security** | Per-table access control policies |
| **MongoDB** | Secondary store used by Express REST API layer |

### DevOps & Tooling

| Technology | Purpose |
|---|---|
| **Vercel** | Frontend deployment (vercel.json included) |
| **GitHub** | Source control |
| **OxLint** | Fast Rust-based JavaScript linter |
| **Nodemon** | Auto-restart dev server on file change |

---

## Technology Usage Table

> A breakdown of every technology and exactly what it does inside this project.

| Technology | Used For | Where in Codebase |
|---|---|---|
| **React 19** | Building all UI — pages, modals, cards, forms | `src/pages/`, `src/components/` |
| **React Router v7** | URL routing, protected routes, page transitions | `src/App.jsx` |
| **Vite 8** | Dev server, HMR, production build, module bundling | `vite.config.js` |
| **Tailwind CSS v4** | All styling — layout, spacing, colors, responsive design | `src/index.css`, all `.jsx` files |
| **Framer Motion** | Page slide-in/out, card animations, OTP digit springs, map car movement | `src/pages/LiveRidePage.jsx`, `src/components/rides/BookingModal.jsx` |
| **Lucide React** | All icons throughout the app (Home, Car, MapPin, etc.) | Every component |
| **Supabase JS SDK** | All DB reads/writes, file uploads, Realtime subscriptions | `src/services/*.js`, `src/lib/supabase.js` |
| **Supabase PostgreSQL** | Stores profiles, rides, bookings, messages, reports, support tickets | `supabase/schema.sql` |
| **Supabase Auth** | Anonymous session creation, `auth.uid()` for RLS | `src/context/AuthContext.jsx` |
| **Supabase Storage** | Avatar photos, college ID images, selfie images | `src/services/usersService.js` → `uploadAvatar`, `submitVerification` |
| **Supabase Realtime** | Driver GPS position broadcast → passenger LiveRidePage map, live chat | `src/services/ridesService.js` → `subscribeToRideLocation`, `src/services/messagesService.js` → `subscribeToConversation` |
| **Row Level Security** | Ensures users can only read/write their own data; admin bypass via role claim | `supabase/schema.sql` — all `create policy` blocks |
| **Browser Geolocation API** | Driver shares live GPS position during active ride | `src/pages/LiveRidePage.jsx` → `navigator.geolocation.watchPosition` |
| **bcryptjs (frontend)** | PIN hash stored in profile (`btoa(pin:phone)` scheme) | `src/context/AuthContext.jsx` → `hashPin` |
| **React Context API** | Global auth state — user, profile, isAdmin, isVerified | `src/context/AuthContext.jsx` |
| **LocalStorage** | Profile cache for instant first render without spinner | `src/context/AuthContext.jsx` → `readCachedProfile` / `writeCachedProfile` |
| **Express.js** | REST API routing — auth, users, rides, bookings, admin | `backend/app.js`, `backend/routes/` |
| **Mongoose** | MongoDB models for User, Ride, Booking, Report | `backend/models/` |
| **JWT** | Stateless access tokens for REST API authentication | `backend/utils/token.util.js`, `backend/middleware/auth.middleware.js` |
| **Helmet** | Sets secure HTTP headers (CSP, HSTS, X-Frame-Options) | `backend/app.js` |
| **express-rate-limit** | 100 req/15 min globally; 10 req/15 min on `/api/auth` | `backend/app.js` |
| **Multer** | Parses multipart form data for file uploads in REST API | `backend/middleware/upload.middleware.js` |
| **Morgan** | Logs every HTTP request in dev mode | `backend/app.js` |
| **OxLint** | Lints all JS/JSX files for errors and code quality | `.oxlintrc.json`, `npm run lint` |
| **Vercel** | Hosts the frontend; `vercel.json` rewrites all paths to `index.html` for SPA | `vercel.json` |

---

## Project Structure

```
campus-commute/
│
├── src/                          # React frontend
│   ├── App.jsx                   # Root — router, route guards
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Tailwind theme tokens + base styles
│   │
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state, signUp, signIn, profile
│   │
│   ├── lib/
│   │   └── supabase.js           # Supabase client singleton
│   │
│   ├── services/                 # All Supabase queries
│   │   ├── ridesService.js       # CRUD rides, start/complete, GPS, Realtime
│   │   ├── bookingsService.js    # Book, OTP verify, offered rides
│   │   ├── messagesService.js    # Send, fetch, Realtime chat
│   │   ├── usersService.js       # Profile CRUD, verification, admin stats
│   │   └── supportService.js     # Support tickets CRUD
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── FindRidePage.jsx      # Search rides with date picker + geo filter
│   │   ├── OfferRidePage.jsx     # Post a ride with vehicle details
│   │   ├── MyRidesPage.jsx       # Passenger + Driver mode; OTP verification
│   │   ├── LiveRidePage.jsx      # Real-time GPS map for active rides
│   │   ├── MessagesPage.jsx      # In-app chat
│   │   ├── ProfilePage.jsx       # Edit profile, preferences, settings
│   │   ├── VerificationPage.jsx  # College ID + selfie submission
│   │   ├── AdminPage.jsx         # Full admin dashboard
│   │   ├── SupportPage.jsx       # Help, FAQs, ticket submission
│   │   └── WomenOnlyPage.jsx
│   │
│   └── components/
│       ├── auth/                 # AuthModal, PinPad
│       ├── layout/               # Navbar, BottomNav, Footer
│       ├── rides/                # RideCard, BookingModal, RideDetailsModal
│       └── ui/                   # Button, Badge, Avatar, Modal, Toast, Toggle…
│
├── backend/                      # Express REST API (secondary layer)
│   ├── app.js                    # Express app — middleware, routes
│   ├── server.js                 # HTTP server entry point
│   ├── config/db.js              # MongoDB connection
│   ├── routes/                   # auth, user, ride, booking, admin routes
│   ├── controllers/              # Business logic per domain
│   ├── models/                   # Mongoose schemas
│   ├── middleware/               # auth, error, upload, validate
│   └── utils/token.util.js       # JWT helpers
│
├── supabase/
│   ├── schema.sql                # Full DB schema — tables, triggers, RLS
│   └── migrations/
│       ├── fix_rls_auth_id.sql   # RLS patch for auth_id bridge
│       ├── set_admin_role.sql    # Promote account to admin
│       └── support_tickets.sql  # Support tickets table + RLS
│
├── public/                       # Static assets
├── vercel.json                   # SPA rewrite rules for Vercel
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com) project

### 1 — Clone and install

```bash
git clone https://github.com/campuscommute/CampusCommute.git
cd CampusCommute

# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### 2 — Set up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor → New Query** and run `supabase/schema.sql`
3. Run `supabase/migrations/support_tickets.sql`
4. Copy your **Project URL** and **anon public key** from Project Settings → API

### 3 — Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` — see [Environment Variables](#environment-variables) below.

### 4 — Run

```bash
# Frontend (http://localhost:5173)
npm run dev

# Backend (http://localhost:5000)
cd backend && npm run dev
```

---

## Environment Variables

### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/campus-commute
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

---

## Database Schema

All tables live in Supabase PostgreSQL. Run `supabase/schema.sql` to create them.

| Table | Description | Key Columns |
|---|---|---|
| `profiles` | Every registered user | `id`, `name`, `phone`, `role`, `is_verified`, `gender`, `pin_hash` |
| `rides` | Posted rides | `driver_id`, `from_label`, `to_label`, `date`, `time`, `status`, `current_lat/lng` |
| `bookings` | Ride bookings | `ride_id`, `passenger_id`, `otp`, `otp_verified`, `status` |
| `messages` | In-app chat | `sender_id`, `receiver_id`, `content`, `read` |
| `reports` | User reports | `reporter_id`, `reported_user_id`, `type`, `status` |
| `support_tickets` | Help desk tickets | `user_id`, `category`, `subject`, `message`, `admin_reply`, `priority` |

---

## API Endpoints

The Express REST API runs on `http://localhost:5000`.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check | Public |
| `POST` | `/api/auth/signup` | Register new user | Public |
| `POST` | `/api/auth/login` | Login with phone + PIN | Public |
| `GET` | `/api/users/profile` | Get current user profile | JWT |
| `PUT` | `/api/users/profile` | Update profile | JWT |
| `GET` | `/api/rides` | Search/list rides | Public |
| `POST` | `/api/rides` | Create a ride | JWT |
| `GET` | `/api/rides/:id` | Get ride details | Public |
| `PUT` | `/api/rides/:id` | Update ride (driver only) | JWT |
| `POST` | `/api/bookings` | Book a seat | JWT |
| `GET` | `/api/bookings/my` | Get my bookings | JWT |
| `PUT` | `/api/bookings/:id` | Update booking status | JWT |
| `GET` | `/api/admin/stats` | Platform statistics | JWT + Admin |
| `GET` | `/api/admin/users` | All users list | JWT + Admin |
| `PUT` | `/api/admin/verify/:id` | Approve/reject verification | JWT + Admin |

> **Note:** The primary data layer is **Supabase** (used directly from the frontend via the JS SDK). The Express backend is a secondary layer for operations requiring server-side JWT validation or file processing.

---

## Making Yourself Admin

After creating your account, run in **Supabase → SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE phone = '9220612315';
```

Then sign out, clear localStorage, and sign back in. Navigate to `/admin`.

---

## License

MIT © Campus Commute
