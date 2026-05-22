# DevPulse – B7A2

> A collaborative backend for software teams to report bugs, suggest features and track resolutions.

Live API: will add later here.

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

Fill in your `.env` with a PostgreSQL connection string and a JWT secret, then run:

```bash
npm run dev
```
