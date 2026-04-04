# SK Properties CRM

A full-stack property CRM for SK Properties, Mohan Garden, Delhi.

**Stack:** Next.js 14 · Node.js + Express · MongoDB · TanStack Query · Zustand · Tailwind CSS · Framer Motion

---

## Project Structure

```
sk-properties/
├── backend/          Node.js + Express API
└── frontend/         Next.js 14 app
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017 (or a MongoDB Atlas connection string)
- npm

---

## Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
node seed.js
npm run dev
# Runs on http://localhost:5000
```

**Seed creates these login accounts:**

| Role     | Phone           | Password   |
|----------|----------------|------------|
| Admin    | +919999999999  | admin123   |
| Operator | +919999999998  | father123  |

---

## Setup — Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# Runs on http://localhost:3000
```

Open http://localhost:3000, login with Father's account: `+919999999998` / `father123`

---

## Key API Endpoints

```
POST   /api/auth/login
GET    /api/dashboard
GET    /api/leads                    ?leadType= &status= &overdueOnly= &search=
POST   /api/leads
PATCH  /api/leads/:id                followUpDate + status + note
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id/matches
POST   /api/deals
POST   /api/deals/:id/payments
PUT    /api/deals/:id/close
PUT    /api/deals/:id/lost
POST   /api/investments
PUT    /api/investments/:id/sell
GET    /api/wealth
GET    /api/agents
POST   /api/agents
```

---

## Business Logic

- Floor price on a deal is **locked at creation** — never changes
- agreedPrice is **locked after bayana** stage
- Bayana payment **auto-advances** deal stage
- Commission with `verified: true` **auto-creates WealthEntry**
- Soft deletes throughout — nothing hard deleted
- Matching engine: `/properties/:id/matches` finds buyers by location + type + budget
