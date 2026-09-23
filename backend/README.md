# Campus Commute — Backend API

REST API built with **Node.js · Express · MongoDB (Mongoose)**

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET
```

### 4. Run in development
```bash
npm run dev
# Server starts on http://localhost:5000
```

### 5. Run in production
```bash
npm start
```

---

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login, receive JWT |
| POST | `/logout` | ✓ | Logout (client clears token) |
| GET | `/me` | ✓ | Get current user |
| PUT | `/change-password` | ✓ | Change password |

### Users — `/api/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:id` | — | Public profile |
| PUT | `/me` | ✓ | Update own profile |
| GET | `/me/rides` | ✓ | My ride history |
| GET | `/me/stats` | ✓ | My stats |
| POST | `/me/verify` | ✓ | Submit verification docs |

### Rides — `/api/rides`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Search rides (query: from, to, date, preference, sortBy) |
| GET | `/:id` | — | Get ride details |
| POST | `/` | ✓ Verified | Create / offer a ride |
| PUT | `/:id` | ✓ Driver | Update ride |
| DELETE | `/:id` | ✓ Driver | Cancel ride |
| GET | `/driver/me` | ✓ | My offered rides |
| PATCH | `/:id/start` | ✓ Driver | Start ride |
| PATCH | `/:id/complete` | ✓ Driver | Complete ride |

### Bookings — `/api/bookings`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✓ Verified | Request seat (supports counter offer) |
| GET | `/me` | ✓ | My bookings |
| GET | `/:id` | ✓ | Booking details |
| PATCH | `/:id/verify-otp` | ✓ | Verify OTP to start ride |
| PATCH | `/:id/cancel` | ✓ | Cancel booking |
| PATCH | `/:id/counter-offer` | ✓ Driver | Accept/reject counter offer |
| POST | `/:id/rate` | ✓ | Rate the ride |

### Admin — `/api/admin` *(admin role required)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard stats |
| GET | `/verifications` | Pending verifications |
| PATCH | `/verifications/:userId` | Approve / reject |
| GET | `/users` | All users |
| PATCH | `/users/:id/toggle-status` | Activate / deactivate user |
| GET | `/rides` | All rides |
| GET | `/reports` | All reports |
| POST | `/reports` | File a report |
| PATCH | `/reports/:id` | Resolve / escalate report |

---

## Project Structure

```
backend/
├── app.js                  # Express app setup
├── server.js               # Entry point
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── ride.controller.js
│   ├── booking.controller.js
│   └── admin.controller.js
├── middleware/
│   ├── auth.middleware.js   # JWT protect, requireVerified, requireAdmin, requireFemale
│   ├── error.middleware.js  # Global error handler
│   ├── validate.middleware.js
│   └── upload.middleware.js # Multer file uploads
├── models/
│   ├── User.model.js
│   ├── Ride.model.js
│   ├── Booking.model.js
│   └── Report.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── ride.routes.js
│   ├── booking.routes.js
│   └── admin.routes.js
├── utils/
│   └── token.util.js        # JWT generation, OTP generation, sanitizeUser
├── uploads/                 # Auto-created on first upload
├── .env.example
├── .gitignore
└── README.md
```

---

## Key Design Decisions

- **JWT auth** — stateless, 7-day expiry, sent as `Authorization: Bearer <token>`
- **Verified-only actions** — creating/booking rides requires `isVerified: true`
- **Women-only rides** — enforced at the booking level via gender check
- **Counter offers** — passenger proposes a price; driver accepts/rejects; OTP issued only on acceptance
- **OTP flow** — generated on booking confirmation, verified at ride start
- **Rate limiting** — 100 req/15min globally, 10 req/15min on auth endpoints
- **File uploads** — Multer stores college ID and selfie locally under `/uploads/`; swap `storage` for S3 in production
