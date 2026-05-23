# DevPulse – B7A2

> A collaborative backend for software teams to report bugs, suggest features and track resolutions.

**Live API**: https://ph-l2-b7-asnmnt-2.vercel.app

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server and routing |
| TypeScript | Strict typing throughout |
| PostgreSQL (via `pg`) | Relational database, raw SQL only |
| bcrypt | Password hashing (10 salt rounds) |
| jsonwebtoken | Auth token generation and verification |

---

## Features

- User registration and login with JWT authentication
- Two roles: `contributor` and `maintainer` with separate permissions
- Full issue lifecycle: create, read, update, delete
- Filter and sort issues by type, status and date
- No ORMs, no JOINs; just clean raw SQL

---

## Local Setup

```bash
git clone https://github.com/MS-Jahan/ph-l2-b7-asnmnt-2
cd devpulse
npm install
cp .env.example .env
```

Fill in your `.env` with a PostgreSQL connection string and a JWT secret. Then run the database setup:

```bash
psql -d devpulse_db -f schema.sql
```

Start the dev server:

```bash
npm run dev
```

---

## Database Schema

### `users`

```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

### `issues`

```sql
CREATE TABLE issues (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(150) NOT NULL,
  description  TEXT NOT NULL,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
  status       VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  reporter_id  INTEGER NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and get JWT |

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/issues` | Authenticated | Create a new issue |
| GET | `/api/issues` | Public | Get all issues (supports sort, type, status filters) |
| GET | `/api/issues/:id` | Public | Get a single issue |
| PATCH | `/api/issues/:id` | Authenticated | Update an issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete an issue |

#### Query Parameters for `GET /api/issues`

| Param | Values | Default |
|---|---|---|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | - |
| `status` | `open`, `in_progress`, `resolved` | - |

#### Authorization header format

```
Authorization: <JWT_TOKEN>
```

---

## Folder Structure

```
src/
├── config/
│   └── db.ts               # PostgreSQL pool
├── middleware/
│   ├── auth.ts             # JWT verification, role check
│   └── errorHandler.ts     # Global error handler
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   └── issues/
│       ├── issues.controller.ts
│       └── issues.routes.ts
├── types/
│   └── index.ts            # Shared interfaces
├── utils/
│   └── response.ts         # sendSuccess / sendError helpers
└── app.ts
```

---

## Permissions Summary

| Action | Contributor | Maintainer |
|---|---|---|
| Register / Login | ✅ | ✅ |
| Create issue | ✅ | ✅ |
| View all issues | ✅ | ✅ |
| Edit own open issue | ✅ | ✅ |
| Edit any issue / change status | ❌ | ✅ |
| Delete any issue | ❌ | ✅ |
