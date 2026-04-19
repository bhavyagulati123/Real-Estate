# SK Properties CRM

Internal CRM for SK Properties, Mohan Garden, Delhi. Manages leads, properties, deals, investments, and wealth tracking.

**Stack:** Next.js 14 · Node.js + Express · MongoDB · TanStack Query · Zustand · Tailwind CSS · Framer Motion · Docker

---

## Project Structure

```
Real Estate/
├── backend/               Express.js REST API
│   ├── middleware/
│   │   └── auth.js        JWT cookie verification
│   ├── models/
│   │   ├── index.js       Mongoose schemas (User, Investment, WealthEntry)
│   │   ├── Lead.js
│   │   ├── Property.js
│   │   └── Deal.js
│   ├── routes/            One file per resource
│   ├── services/
│   │   └── engines.js     Buyer matching + follow-up aggregation logic
│   ├── seed.js            Seeds login accounts
│   └── index.js           Express app entry point
├── frontend/              Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/login/  Login page (no layout)
│   │   ├── (dashboard)/   All protected pages share the dashboard layout
│   │   │   ├── layout.tsx         Sidebar + MobileNav + all global Sheets
│   │   │   ├── error.tsx          Error boundary for dashboard crashes
│   │   │   ├── dashboard/         /dashboard home page
│   │   │   ├── leads/             List + [id] detail
│   │   │   ├── properties/        List + [id] detail
│   │   │   ├── deals/             List + [id] detail
│   │   │   ├── investments/       List + [id] detail
│   │   │   ├── wealth/
│   │   │   └── settings/
│   │   ├── error.tsx              Global error boundary
│   │   ├── not-found.tsx          404 page
│   │   └── page.tsx               Root redirect → /dashboard
│   ├── components/
│   │   ├── ui/index.tsx   Design system (Button, Input, Sheet, KpiCard, Skeleton …)
│   │   ├── forms/         All create/edit forms (Lead, Property, Deal, Payment, Investment)
│   │   ├── Navigation.tsx Sidebar + MobileNav
│   │   ├── LeadCard.tsx
│   │   ├── LeadListItem.tsx
│   │   └── ToastProvider.tsx
│   ├── hooks/
│   │   ├── useData.ts     All TanStack Query hooks (properties, deals, investments, dashboard)
│   │   └── useLeads.ts    Lead-specific queries + mutations
│   ├── store/
│   │   ├── useAuthStore.ts  Zustand — user session
│   │   └── useUIStore.ts    Zustand — sheet open/close state + active filters
│   ├── lib/
│   │   ├── api.ts         Fetch wrapper (credentials: include, 401 → redirect to /login)
│   │   ├── queryKeys.ts   Centralised TanStack Query key factory
│   │   ├── utils.ts       formatRupees, formatDate, LEAD_STATUSES …
│   │   ├── motion.ts      Framer Motion variants
│   │   └── cn.ts          clsx helper
│   └── middleware.ts      Route protection (reads sk_token cookie)
├── mongodb/Dockerfile     mongo:7 with --quiet --logpath /dev/null
└── docker-compose.yml
```

---

## Quick Start (Local Dev)

### Option A — Docker (recommended, zero setup)

```bash
docker compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:5000  |
| MongoDB  | localhost:27017        |

### Option B — Manual

**1. MongoDB**
```bash
docker compose up mongodb -d
```

**2. Backend**
```bash
cd backend
cp .env.example .env          # fill in secrets (see below)
npm install
node seed.js                  # optional — creates login accounts
npm run dev                   # http://localhost:5000
```

**3. Frontend**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

**Seed login accounts:**

| Role     | Phone           | Password  |
|----------|-----------------|-----------|
| Admin    | +919311796190   | admin123  |
| Operator | +919311796191   | admin123  |

---

## Environment Variables

### `backend/.env`

| Variable             | Description                                | Example                             |
|----------------------|--------------------------------------------|-------------------------------------|
| `PORT`               | API server port                            | `5000`                              |
| `MONGODB_URI`        | MongoDB connection string                  | `mongodb://localhost:27017/sk-properties` |
| `JWT_SECRET`         | Secret for 7-day access tokens             | any long random string              |
| `JWT_REFRESH_SECRET` | Secret for 30-day refresh tokens           | different long random string        |
| `FRONTEND_URL`       | CORS allowed origin                        | `http://localhost:3000`             |

### `frontend/.env.local`

| Variable              | Description       | Example                    |
|-----------------------|-------------------|----------------------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL  | `http://localhost:5000`    |

---

## Authentication Flow (end-to-end)

```
Browser                     Next.js middleware          Backend
  │                                │                       │
  │  Visit any page                │                       │
  │ ──────────────────────────────>│                       │
  │                         Read sk_token cookie           │
  │                         No cookie? → redirect /login   │
  │                                │                       │
  │  Submit phone + password       │                       │
  │ ─────────────────────────────────────────────────────>│
  │                                │   bcrypt verify       │
  │                                │   jwt.sign (7d)       │
  │<──────────────── Set-Cookie: sk_token (HTTP-only) ────│
  │<──────────────── Set-Cookie: sk_refresh_token (HTTP-only, 30d)
  │  Store user in Zustand         │                       │
  │  router.push('/dashboard')     │                       │
  │ ──────────────────────────────>│                       │
  │                         Cookie present → allow         │
  │                                │                       │
  │  Any API call (auto sends cookie via credentials:include)
  │ ─────────────────────────────────────────────────────>│
  │                                │   auth middleware     │
  │                                │   req.cookies.sk_token│
  │                                │   jwt.verify()        │
  │<────────────────────── JSON response ─────────────────│
  │                                │                       │
  │  Logout → POST /api/auth/logout│                       │
  │ ─────────────────────────────────────────────────────>│
  │<──────────────── Clear-Cookie headers ────────────────│
  │  Clear Zustand, redirect /login│                       │
```

**Token never touches JavaScript** — it lives exclusively in an HTTP-only cookie, so it cannot be read by `document.cookie` or XSS attacks.

---

## Pages & Features

### `/login`
Phone + password form. On success the backend sets cookies; frontend stores the `user` object in Zustand (persisted to localStorage for the display name/role).

### `/dashboard`
Business snapshot:
- KPI cards — active leads, pipeline deals, expected commission this month, investments holding value
- **Overdue follow-ups** (red banner) — leads whose `followUpDate` is in the past
- **Due today** — leads scheduled for today
- **Active deals** — deals not yet closed or lost
- **Upcoming follow-ups** — next 2 days

### `/leads` + `/leads/[id]`

**List:** Search by name/phone, filter by type (buyer/seller), status, block, overdue-only toggle. Shows follow-up status colour coding.

Leads are always buyers by default. Seller leads are created automatically when adding a property with a new seller.

**Detail:**
- Profile card — name, phone (tap to call), WhatsApp quick link, current status badge, overdue/today alert
- **Reschedule follow-up** — preset buttons (1d / 3d / 7d / 14d / 30d) or custom date picker
- **Move stage** — one-tap stage transition buttons
- **Add note** — free-text note attached to this interaction
- **Interaction history** — full timeline of every note + stage change
- **Related deals** — all deals where this lead is buyer or seller

### `/properties` + `/properties/[id]`

**List:** Filter by ownership status and deal type. Shows listing price and status badges.

**Detail:**
- Full specs — size, block, building age, configuration
- Price grid — listed / floor / asking
- **Seller card** — linked seller lead with call + WhatsApp actions and "View lead" link
- **Matched buyers** — auto-matched leads whose budget is within ±20% of the asking price and whose location overlaps. One-click "Deal" opens the create-deal sheet pre-filled with this property + buyer.
- **Deal activity** — all deals for this property
- **Change status** — pill buttons to switch `ownershipStatus` between Available / Under Negotiation / Owner Owned / Sold (e.g. when a sold property comes back on the market)
- **Delete property** — soft delete with inline confirmation; blocked by backend if active deals exist

**Add property form:** Includes inline seller — choose an existing person from leads or create a new seller on the spot (name + phone required). New sellers are automatically saved as `leadType: seller`.

### `/deals` + `/deals/[id]`

**List:** Stage filter tabs — All / negotiation / bayana / papers / closed / lost.

**Detail:**
- Payment progress bar (paid vs remaining amount)
- Buyer + seller party cards with navigation to their lead profiles
- **Advance stage** — moves through `negotiation → bayana → papers` only; closing is a separate action
- **Payment history** — all recorded payments (token, bayana, full payment, commission) with paidBy / receivedBy / verified status
- **Stage history** — full audit trail of when each stage was entered and any notes
- **Close deal** — records closed date + commission received; commission amount auto-creates a `WealthEntry` of category `commission`
- **Mark lost** — requires a reason; freezes the deal

### `/investments` + `/investments/[id]`

**List:** KPI summary (total holding value, total realised profit). Each card is clickable.

**Detail:**
- Investment breakdown — purchase price, my share %, holding costs, target sale price, days holding
- Co-investor table — name, phone, share %; amounts are auto-calculated (`purchasePrice × sharePercent / 100`)
- **Mark sold flow:**
  1. Click "Mark sold"
  2. Enter actual sale price → live P&L preview (my share %, less investment, less holding costs, net profit)
  3. Confirm → backend calculates `myProfit`, creates a `WealthEntry` of category `investmentProfit`, marks the property as `sold`

### `/wealth`
Income and expense ledger. Entries are created automatically on deal commission close and investment sale. Manual entries can also be added.

### `/settings`
- **Profile** — change display name or password (requires current password)

---

## Three Revenue Models

| Model | How it works | Where tracked |
|---|---|---|
| **Brokerage** | You broker a deal between buyer and seller. Commission is your income. | Deal page — record commission on close; auto-creates WealthEntry |
| **Inflated** | You buy a property and sell it at a higher price. Profit = sale − purchase. | Investment section (you own 100%, no co-investors) |
| **Co-investment** | You co-own a property with partners. Profit is split by share %. | Investment section with co-investors; your share % drives all calculations |

---

## API Reference

All endpoints except `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh` require the `sk_token` cookie (set by login).

### Auth `/api/auth`

| Method | Path        | Description                                      |
|--------|-------------|--------------------------------------------------|
| POST   | `/login`    | Authenticate; sets `sk_token` + `sk_refresh_token` HTTP-only cookies |
| POST   | `/logout`   | Clears both cookies                              |
| POST   | `/refresh`  | Issues new `sk_token` from `sk_refresh_token` cookie |
| PATCH  | `/me`       | Update own name or password                      |
| POST   | `/register` | Create a new user account (first-time setup)     |

### Leads `/api/leads`

| Method | Path    | Query params                                          |
|--------|---------|-------------------------------------------------------|
| GET    | `/`     | `leadType`, `status`, `block`, `search`, `overdueOnly`, `page`, `limit` |
| POST   | `/`     | Create lead (`leadType` defaults to `buyer`)          |
| GET    | `/:id`  | Full lead with `interactionHistory`                   |
| PATCH  | `/:id`  | Update `followUpDate`, `status`, append `note`        |
| PUT    | `/:id`  | Full edit                                             |
| DELETE | `/:id`  | Delete                                                |

### Properties `/api/properties`

| Method | Path           | Description                                    |
|--------|----------------|------------------------------------------------|
| GET    | `/`            | List; filters: `ownershipStatus`, `dealType`, `block`, `search` |
| POST   | `/`            | Create                                         |
| GET    | `/:id`         | Full property (populates `sellerId`)           |
| PUT    | `/:id`         | Edit (including `ownershipStatus` change)      |
| DELETE | `/:id`         | Delete (blocked if active deals exist)         |
| GET    | `/:id/matches` | Buyer leads matched by budget + location       |

### Deals `/api/deals`

| Method | Path               | Description                                                        |
|--------|--------------------|--------------------------------------------------------------------|
| GET    | `/`                | List; filter by `stage`                                            |
| POST   | `/`                | Create deal                                                        |
| GET    | `/:id`             | Full deal with payments + stage history                            |
| POST   | `/:id/payments`    | Record payment                                                     |
| PUT    | `/:id/stage`       | Advance stage (`negotiation → bayana → papers`); rejects `closed` |
| PUT    | `/:id/close`       | Mark closed; accepts `commissionAmount`; auto-creates WealthEntry  |
| PUT    | `/:id/lost`        | Mark lost (requires `lostReason`)                                  |

### Investments `/api/investments`

| Method | Path        | Description                                              |
|--------|-------------|----------------------------------------------------------|
| GET    | `/`         | List; filter by `status` (holding/sold)                  |
| POST   | `/`         | Record investment; marks property `ownerOwned`; auto-calculates co-investor amounts |
| GET    | `/:id`      | Full investment with co-investors                        |
| PUT    | `/:id`      | Edit                                                     |
| DELETE | `/:id`      | Delete investment                                        |
| PUT    | `/:id/sell` | Mark sold; calculates profit; creates WealthEntry; marks property `sold` |

### Wealth `/api/wealth`

| Method | Path | Description                                   |
|--------|------|-----------------------------------------------|
| GET    | `/`  | Entries + summary totals; filter by `type`, `category`, `dateFrom`, `dateTo` |
| POST   | `/`  | Create manual entry                           |

### Dashboard `/api/dashboard`

| Method | Path | Description                                                  |
|--------|------|--------------------------------------------------------------|
| GET    | `/`  | Aggregated stats + overdue/dueToday/upcoming leads + active deals |

---

## Key Business Rules

| Rule | Detail |
|------|--------|
| Leads are buyers by default | `leadType` defaults to `buyer` on creation. Seller leads are auto-created when a property is added with a new seller. |
| Floor price locked | Set at deal creation, never updated |
| Agreed price locked after bayana | Cannot change once bayana stage is reached |
| Advance stage blocked at closed | `PUT /:id/stage` rejects `stage: 'closed'`; use `PUT /:id/close` instead |
| Commission auto-creates wealth | `PUT /:id/close` with `commissionAmount > 0` creates a verified `WealthEntry` of category `commission` |
| Investment sell auto-creates wealth | Marking sold creates `investmentProfit` WealthEntry for `myProfit` only |
| Investment sell marks property sold | `ownershipStatus` on the property is set to `sold` |
| Co-investor amounts auto-calculated | `amountInvested = purchasePrice × sharePercent / 100`; no manual entry needed |
| Profit formula | `gross = salePrice × (myShare%)` · `profit = gross − myAmount − holdingCosts × (myShare%)` |
| Buyer matching | Budget within ±20% of asking price AND location/block overlap |
| Property status is editable | Any status (`available`, `underNegotiation`, `ownerOwned`, `sold`) can be changed manually from the property detail page |
| Follow-up colours | Red = overdue, Amber = due today, no colour = future |

---

## Error Handling

**Frontend:**
- `app/error.tsx` — global boundary; catches any unhandled React error, shows "Try again" button
- `app/(dashboard)/error.tsx` — scoped to dashboard layout; keeps sidebar visible
- `app/not-found.tsx` — custom 404 page for unknown routes
- `lib/api.ts` — 401 responses automatically redirect to `/login`

**Backend:**
- All routes wrapped in try/catch; uniform `{ success: false, error: string, code: number }` response shape
- Global Express error handler as final middleware

---

## Roles

| Role       | Description                               |
|------------|-------------------------------------------|
| `admin`    | Full access to all data                   |
| `operator` | Same as admin (intended for office staff) |

Role-based route guards (`requireRole()` middleware) are available in `backend/middleware/auth.js` and can be applied to any route.
