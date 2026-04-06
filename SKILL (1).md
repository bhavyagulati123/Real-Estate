# SK Properties — Application Build Reference
**Version:** 1.0  
**Author:** Bhavya Gulati  
**Purpose:** Complete reference for building the SK Properties CRM system. Use this file with Codex or any AI coding assistant to generate accurate, business-logic-aware code.

---

## 1. Business Context

SK Properties is a local property brokerage in Mohan Garden, Delhi. Run by a single experienced broker (referred to as "Owner" or "Operator") with 15 years of local goodwill. The system replaces a physical notebook and memory-driven workflow.

### Revenue Models (Critical — All Three Must Be Supported)

**Type A — Pure Brokerage**
- Owner connects buyer and seller
- Earns commission (usually 1%) from one or both parties
- Commission is separate from the deal price
- If two agents are involved, each earns commission from their respective party

**Type B — Price Inflation**
- Owner knows seller's actual floor price (minimum they will accept)
- Owner lists the property at a higher price to buyers
- The spread between floor price and listed price is Owner's margin
- No separate commission discussed — margin IS the revenue
- margin = listedPrice - floorPrice

**Type C — Co-Investment**
- Owner (sometimes with other agents or financers) buys the property outright
- Sells it later for profit
- Revenue = profit on sale, not commission
- Co-investors split profit proportionally by share percentage
- Tracked in the Investment collection, not the Deal commission fields

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Backend | Node.js with Express |
| Database | MongoDB with Mongoose |
| State Management | Zustand (auth + UI) + TanStack Query (server state) |
| Styling | Tailwind CSS + Framer Motion |
| Deployment | Docker Compose (all services containerised) |
| Auth | JWT stored in HTTP-only cookies (sk_token 7d, sk_refresh_token 30d) |

---

## 3. Database Schemas

### 3.1 Lead Schema

A Lead is a person — buyer or seller — who has shown interest.

```javascript
const LeadSchema = new mongoose.Schema({

  // Identity
  name: { type: String, required: true },
  phone: { type: String, required: true },
  // String not Number — preserve +91, leading zeros
  alternatePhone: { type: String },
  source: {
    type: String,
    enum: ['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral'],
    required: true
  },
  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  // Which external agent brought this lead to us
  // Used to track which agent relationships produce real business

  leadType: { type: String, enum: ['buyer', 'seller'], required: true },

  // What they want (buyer) / What they have (seller)
  budget: { type: Number },
  // In rupees — max budget for buyer, minimum acceptable for seller
  location: { type: String },
  // Area or lane in Mohan Garden
  block: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F', 'other'] },
  // Block preference — price varies significantly by block
  propertyType: {
    type: String,
    enum: ['residential', 'floor', 'office', 'rootFloor', 'fullBuilding', 'plot', 'commercial']
  },
  configuration: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA']
    // Only relevant when propertyType = residential
    // Set to NA for all commercial types
  },
  size: { type: Number },
  // Square yards — use this unit consistently across entire system
  buildingAge: { type: String },
  // e.g. "5 years", "new construction", "15+ years"

  // Qualification
  credibilityScore: { type: Number, min: 1, max: 5 },
  // Owner's gut judgment — 1=very doubtful, 3=seems genuine, 5=highly credible
  // This captures 15 years of instinct in a single field
  // Primary qualification signal — more reliable than payment timeline

  // Pipeline
  status: {
    type: String,
    enum: [
      'new',          // just came in, not yet contacted
      'contacted',    // reached out, had initial conversation
      'interested',   // confirmed interest, gathering details
      'visit',        // site visit scheduled or done
      'negotiation',  // price discussion ongoing
      'bayana',       // token/advance paid — deal is binding
      'papers',       // paperwork/registry in progress
      'closed',       // deal completed successfully
      'lost'          // deal fell through
    ],
    default: 'new'
  },

  // Follow-up engine — operationally the most important fields
  followUpDate: { type: Date },
  // System queries this daily — any lead where this is today or past = alert
  followUpNotes: { type: String },
  // What to discuss on next call — replaces the notebook

  notes: { type: String },
  // General notes, Owner's gut feeling, any context

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
```

**Matching Query — runs when a new property is added:**
```javascript
Lead.find({
  leadType: 'buyer',
  status: { $nin: ['closed', 'lost'] },
  budget: { $gte: property.floorPrice * 0.9 },
  location: property.location,
  propertyType: property.propertyType,
  // add configuration match for residential
})
```

**Follow-up engine query — runs on dashboard load:**
```javascript
Lead.find({
  status: { $nin: ['closed', 'lost'] },
  followUpDate: { $lte: new Date() }
}).sort({ followUpDate: 1 })
```

---

### 3.2 Property Schema

A Property is a physical property — available, under negotiation, or owned by Owner.

```javascript
const PropertySchema = new mongoose.Schema({

  title: { type: String, required: true },
  // Human-readable e.g. "2BHK Floor, Block C, Mohan Garden"

  location: { type: String, required: true },
  block: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'other']
    // Dropdown in UI — block is a major price factor
  },
  propertyType: {
    type: String,
    enum: ['residential', 'floor', 'office', 'rootFloor', 'fullBuilding', 'plot', 'commercial'],
    required: true
  },
  configuration: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA']
  },
  size: { type: Number },
  buildingAge: { type: String },
  buildingCredibility: { type: Number, min: 1, max: 5 },
  // Is building legally clean? Good construction? Owner's assessment.

  // PRICING — three price fields, all serve different purposes
  floorPrice: { type: Number },
  // Seller's actual minimum — PRIVATE, never shown to buyers
  // Foundation of all margin calculations

  askingPrice: { type: Number },
  // What seller is publicly asking — usually above floor

  listedPrice: { type: Number },
  // What Owner shows buyers
  // In inflation deals: listedPrice > askingPrice
  // margin = listedPrice - floorPrice

  dealType: {
    type: String,
    enum: ['brokerage', 'inflated', 'coInvestment'],
    required: true
  },

  ownershipStatus: {
    type: String,
    enum: [
      'available',        // can be shown to buyers
      'underNegotiation', // active deal ongoing — do not bring new buyers
      'sold',             // completed
      'ownerOwned'        // Owner/group purchased — links to Investment
    ],
    default: 'available'
  },

  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  // Points to seller's Lead record — full contact history accessible

  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  // Which agent brought this property listing

  images: [{ type: String }],
  documents: [{ type: String }],
  notes: { type: String },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
```

---

### 3.3 Deal Schema

A Deal tracks a transaction from negotiation to closed — including every rupee movement.

```javascript
// Payment subdocument — tracks every money movement in the deal
const PaymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'token',        // small initial commitment to show seriousness
      'bayana',       // larger advance — legally binding milestone
      'partPayment',  // one of potentially multiple installments
      'fullPayment',  // final payment on registry/papers day
      'commission'    // Owner's commission — separate from deal price
    ],
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paidBy: { type: String },
  receivedBy: { type: String },
  notes: { type: String },
  // e.g. "paid via RTGS", "cheque pending clearance"
  verified: { type: Boolean, default: false }
  // When commission payment verified = true, auto-create WealthEntry
})

const DealSchema = new mongoose.Schema({

  // Core connections
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  sellerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },

  dealType: {
    type: String,
    enum: ['brokerage', 'inflated', 'coInvestment'],
    required: true
    // LOCKED at creation — never changes even if property record updates
  },

  // Pipeline
  stage: {
    type: String,
    enum: ['negotiation', 'bayana', 'papers', 'closed', 'lost'],
    default: 'negotiation'
  },
  stageHistory: [{
    stage: String,
    date: { type: Date, default: Date.now },
    notes: String
  }],
  // Every stage change logged — shows where deals stall over time

  // Key dates
  bayanaDate: { type: Date },
  papersDate: { type: Date },
  closedDate: { type: Date },
  lostDate: { type: Date },
  lostReason: { type: String },

  // MONEY — full flow from zero to closed
  agreedPrice: { type: Number, required: true },
  // Final price both parties agreed — what gets registered

  floorPrice: { type: Number },
  // LOCKED from Property.floorPrice at deal creation
  // Never updated after creation — protects against retrospective changes

  margin: { type: Number },
  // Auto-calculated: agreedPrice - floorPrice
  // In inflated deals this IS the revenue
  // Recalculates when agreedPrice changes, LOCKED after bayana stage

  // Commission — always separate from deal price, not included in agreedPrice
  commissionRate: { type: Number },
  // Percentage — usually 1. Negotiated per deal.
  expectedCommission: { type: Number },
  // agreedPrice x commissionRate / 100
  actualCommission: { type: Number },
  // What was actually received after papers
  // Gap between expected and actual = revenue leakage
  // Tracked over time to quantify last-minute commission cuts

  // PAYMENT FLOW TRACKER
  payments: [PaymentSchema],
  // Chronological array of every payment event:
  // token -> bayana -> partPayment(s) -> fullPayment -> commission
  // System calculates running total and remaining balance

  // Computed fields — recalculate whenever payments array changes
  totalPaid: { type: Number, default: 0 },
  // Sum of all non-commission payment amounts
  remainingAmount: { type: Number },
  // agreedPrice - totalPaid

  // Agent splits
  buyerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  sellerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  commissionSplitPercent: { type: Number },
  // Buyer agent's % of the total actualCommission
  // e.g. 60 = buyerAgent gets 60%, sellerAgent gets 40%
  // If not set, all commission goes to buyerAgent
  // Both agents' totalDeals and totalCommission auto-update on deal close

  // Risk
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  riskNotes: { type: String },
  // Free text: "buyer depends on selling his own property first"

  notes: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
```

**Full money flow example:**
```
agreedPrice  = 5,000,000
floorPrice   = 4,500,000
margin       = 500,000   (Owner's spread in inflated deal)
commission   = 50,000    (1% brokerage, separate)

payments array:
  token        50,000    verified
  bayana       200,000   verified
  partPayment  1,000,000 verified
  fullPayment  3,750,000 verified  <- totalPaid = 5,000,000 = agreedPrice
  commission   50,000    verified  <- triggers WealthEntry automatically
```

---

### 3.4 Investment Schema

Properties Owner has purchased — alone or with co-investors.

```javascript
const CoInvestorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  amountInvested: { type: Number, required: true },
  sharePercent: { type: Number, required: true },
  notes: { type: String }
})

const InvestmentSchema = new mongoose.Schema({

  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, required: true },
  mySharePercent: { type: Number, required: true },
  // 100 if fully owned, less if shared with co-investors
  myAmount: { type: Number },
  // Auto-calculated: purchasePrice x mySharePercent / 100

  coInvestors: [CoInvestorSchema],

  holdingCosts: { type: Number, default: 0 },
  // Maintenance, tax, loan interest while holding
  // Most brokers ignore this and overestimate returns — we track it

  targetSalePrice: { type: Number },
  actualSalePrice: { type: Number },
  // Populated when sold

  myProfit: { type: Number },
  // Auto-calculated on sale:
  // (actualSalePrice x mySharePercent / 100) - myAmount - (holdingCosts x mySharePercent / 100)

  status: { type: String, enum: ['holding', 'sold'], default: 'holding' },
  saleDate: { type: Date },

  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
})
```

---

### 3.5 Agent Schema

Internal users and external collaborators — both tracked here.

```javascript
const AgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  type: { type: String, enum: ['internal', 'external'], required: true },
  // internal = has system login
  // external = record only, no login, used for tracking splits and lead source

  totalDeals: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  // Auto-updated when deals close
  // Shows which external agents produce real business over time

  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
})
```

---

### 3.6 WealthEntry Schema

Income and expense ledger — auto-populated from verified commission payments.

```javascript
const WealthEntrySchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: [
      'commission',       // from brokerage deal
      'margin',           // from inflated deal
      'investmentProfit', // from property sale
      'officeExpense',
      'travelExpense',
      'agentPayout',      // commission paid out to external agent
      'other'
    ]
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  // Every income entry traces back to its source deal
  description: { type: String },
  // Auto-populated: "Commission — Block C Floor, Mohan Garden"

  createdAt: { type: Date, default: Date.now }
})
```

**Auto-trigger logic:**
When a payment entry of type `commission` with `verified: true` is added to a Deal, automatically create a WealthEntry with `type: income`, `category: commission`, `amount` from payment, `dealId` from deal.

---

## 4. Application Phases

### Phase 1 — CRM Foundation
Build this first. Everything else depends on it.

Screens to build:
- Lead list with filters: status, leadType, followUpDate overdue, credibilityScore
- Add/Edit Lead form with all fields
- Lead detail: interaction timeline, notes, followUp setter
- Property list with filters: status, block, propertyType, dealType
- Add/Edit Property form
- Property detail: matched buyers panel (runs matching query)
- Daily dashboard: follow-ups due today, overdue in red, upcoming in amber

APIs:
- GET /leads — filters + pagination
- POST /leads
- PUT /leads/:id
- GET /properties
- POST /properties
- PUT /properties/:id
- GET /properties/:id/matches — matching buyers

---

### Phase 2 — Deal Intelligence ✅ IMPLEMENTED

Screens built:
- Deal list with stage filter tabs (negotiation / bayana / papers / closed / lost)
- Deal detail: parties, payment progress bar, payment history, stage history
- Add payment form: type, amount, date, paidBy, receivedBy, notes, verify toggle
- Advance stage with optional notes
- Close deal (with date) and Mark lost (with required reason)
- Risk level visible on deal cards and detail

APIs:
- GET /deals — filters by stage, riskLevel, dealType
- POST /deals — creates deal, locks floorPrice at creation
- GET /deals/:id — full deal with payments + stageHistory
- PUT /deals/:id/stage — advance stage, log to stageHistory
- POST /deals/:id/payments — add payment; if type=commission & verified=true → auto WealthEntry
- PUT /deals/:id/payments/:pid/verify — retroactive verify; if commission → auto WealthEntry
- PUT /deals/:id/close — marks closed, updates agent totalDeals + totalCommission via split
- PUT /deals/:id/lost — requires lostReason, updates linked lead statuses

Commission split logic on close:
- buyerAgentShare = actualCommission × commissionSplitPercent / 100
- sellerAgentShare = actualCommission × (100 − commissionSplitPercent) / 100
- If commissionSplitPercent not set: all goes to buyerAgent

---

### Phase 3 — Investment Tracker ✅ IMPLEMENTED

Screens built:
- Investment list with KPI cards (holding value, realised profit); cards are clickable
- Add investment form with co-investor section
- Investment detail: purchase breakdown, co-investor table, days holding
- Mark sold flow: enter actual sale price → live profit preview (green/red) → confirm

APIs:
- GET /investments — list; filter by status (holding/sold)
- POST /investments — create; marks property ownerOwned
- GET /investments/:id — full investment with co-investors populated
- PUT /investments/:id — edit
- DELETE /investments/:id — delete
- PUT /investments/:id/sell — calculates myProfit, creates investmentProfit WealthEntry, marks property sold

Profit formula on sell:
  gross = actualSalePrice × (mySharePercent / 100)
  myProfit = gross − myAmount − (holdingCosts × mySharePercent / 100)

---

### Phase 4 — Social and Marketing

Screens to build:
- Listing composer: pick property, add images, write description
- Schedule post to WhatsApp/Instagram/Facebook
- Content calendar

APIs:
- Meta Graph API for Instagram/Facebook
- WhatsApp Business API for broadcasting

---

### Phase 5 — Website and Local SEO

Separate Next.js public site feeding from Property collection.

Pages:
- Home: Owner's credibility, 15 years, WhatsApp CTA
- Listings: available properties with filters
- Individual property: SEO-optimised with Mohan Garden keywords
- About: local trust signals for Google Business Profile
- Contact: inquiry form creates Lead in CRM automatically

SEO targets:
- property dealer in Mohan Garden
- flat for sale in Mohan Garden
- 2BHK in Mohan Garden
- property in Uttam Nagar

---

## 5. Business Rules — Enforce in Backend

1. Every lead must have followUpDate set before status moves past contacted
2. floorPrice on Deal is LOCKED at creation — no updates after deal created
3. Property with ownershipStatus underNegotiation cannot link to a new Deal
4. Commission WealthEntry only created when payment.verified = true
5. When Deal stage moves to lost, lostReason is required, linked Lead statuses update
6. margin auto-recalculates when agreedPrice changes — LOCKED after bayana stage
7. totalPaid and remainingAmount recalculate whenever payments array changes
8. A Lead linked to an active Deal cannot be hard deleted — only mark lost
9. Soft deletes only throughout — isDeleted + deletedAt on every collection
10. All monetary values stored as integers in rupees — no floats, no paise

---

## 6. User Roles

| Role | Access |
|---|---|
| Admin (Bhavya) | Full access, system config, all data, all collections |
| Operator (Owner) | Full CRM, deals, investments — no system config |
| Agent (future) | Own assigned leads only, no financial data |

---

## 7. Follow-up Engine

Runs on dashboard load and optionally on a daily cron.

```javascript
const today = new Date()
today.setHours(23, 59, 59, 999)

const dueFollowUps = await Lead.find({
  status: { $nin: ['closed', 'lost'] },
  followUpDate: { $lte: today },
  isDeleted: false
}).sort({ followUpDate: 1 }).populate('sourceAgentId')

// Display logic:
// followUpDate < today (past) → red — overdue
// followUpDate = today → amber — due today
// followUpDate within 2 days → blue — coming up
```

---

## 8. Matching Engine

Runs on property creation and when viewing property detail.

```javascript
async function findMatchingBuyers(property) {
  const query = {
    leadType: 'buyer',
    status: { $nin: ['closed', 'lost'] },
    isDeleted: false,
    location: property.location,
    propertyType: property.propertyType,
  }

  if (property.floorPrice) {
    query.budget = { $gte: property.floorPrice * 0.9 }
  }

  if (property.configuration && property.configuration !== 'NA') {
    query.configuration = property.configuration
  }

  if (property.block) {
    query.$or = [
      { block: property.block },
      { block: { $exists: false } },
      { block: null }
    ]
  }

  return Lead.find(query)
    .sort({ credibilityScore: -1 })
    .limit(10)
    .populate('sourceAgentId')
}
```

---

## 9. API Response Format

All endpoints return this structure:

```javascript
// Success
{ success: true, data: any, message: string }

// Error
{ success: false, error: string, code: number }

// List endpoints include pagination
{
  success: true,
  data: [...],
  pagination: { page: 1, limit: 20, total: 143, pages: 8 }
}
```

---

## 10. Environment Variables

**backend/.env**
```
MONGODB_URI=mongodb://localhost:27017/sk-properties
JWT_SECRET=<long random string>
JWT_REFRESH_SECRET=<different long random string>
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
META_ACCESS_TOKEN=
WHATSAPP_TOKEN=
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Auth notes:**
- Login sets two HTTP-only cookies: sk_token (7d) and sk_refresh_token (30d)
- All API calls must use `credentials: 'include'` — browser sends cookie automatically
- Next.js middleware at frontend/middleware.ts reads sk_token cookie to protect all routes
- Backend auth middleware reads req.cookies.sk_token (requires cookie-parser)

---

## 11. Notes for Codex

- Use Mongoose pre-save hooks for updatedAt on all schemas
- Phone numbers: normalise to +91XXXXXXXXXX format on input
- Dates: store UTC, display IST (UTC+5:30) — use date-fns or dayjs with timezone
- All rupee amounts: integers only, validate with custom Mongoose validator
- Pagination: page and limit query params on all GET list endpoints, default limit 20
- Populate references one level deep only — avoid deep nested populates for performance
- Index these fields for query performance: Lead.followUpDate, Lead.status, Lead.location, Lead.leadType, Property.ownershipStatus, Property.location, Deal.stage

---

## 12. UI Design System

### Philosophy
This CRM is used daily by a 50+ year old broker on a mobile phone while visiting properties, talking to clients, and making quick decisions. The UI must be:

- Mobile-first. Most usage happens on phone, not desktop. Every screen must work at 375px width.
- Fast to operate. The most common actions — reschedule follow-up, add a note, change stage — must be completable in under 30 seconds without navigating away from the lead card.
- No clutter. Owner does not need analytics dashboards with 20 charts. He needs to see: who to call today, what properties are available, and what deals are active.
- Forgiving. He will enter data inconsistently. The system must handle missing fields gracefully without crashing or blocking him.

### Tech: Tailwind CSS
Use Tailwind utility classes throughout. Do not write custom CSS files unless absolutely necessary. Use Tailwind's responsive prefixes (sm:, md:, lg:) for responsive layouts.

### Color tokens (map to Tailwind)

| Purpose | Tailwind class | When to use |
|---|---|---|
| Overdue alert | bg-red-50, text-red-700, border-red-200 | followUpDate is in the past |
| Due today | bg-amber-50, text-amber-700, border-amber-200 | followUpDate is today |
| Upcoming | bg-blue-50, text-blue-700, border-blue-200 | followUpDate within 2 days |
| Active/selected | bg-blue-600, text-white | selected stage pill, active nav |
| Success/closed | bg-green-50, text-green-700 | deal closed, commission received |
| Lost | bg-gray-100, text-gray-400 | lost leads, dead deals |
| Neutral surface | bg-white, border border-gray-200 | cards, panels |
| Page background | bg-gray-50 | overall page bg |

### Typography scale

| Element | Tailwind |
|---|---|
| Page heading | text-lg font-medium text-gray-900 |
| Card title (person name) | text-sm font-medium text-gray-900 |
| Body / field values | text-sm text-gray-900 |
| Secondary / labels | text-xs text-gray-500 |
| Badge text | text-xs font-medium |
| Muted hint | text-xs text-gray-400 |

### Card anatomy
Every lead, property, and deal is displayed as a card. Card structure is always:

```
┌─────────────────────────────────────┐
│  [Avatar]  Name          [Badge]    │  ← header row
│            Phone · type · block     │  ← subtitle row
├─────────────────────────────────────┤
│  [Alert banner if overdue]          │  ← conditional
├─────────────────────────────────────┤
│  Field label        Field value     │  ← detail rows
│  Field label        Field value     │
├─────────────────────────────────────┤
│  [Primary action]  [Secondary]      │  ← action row
└─────────────────────────────────────┘
```

Tailwind card wrapper:
```jsx
<div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
```

### Status badge colors

| Status | Tailwind |
|---|---|
| new | bg-gray-100 text-gray-600 |
| contacted | bg-blue-50 text-blue-700 |
| interested | bg-teal-50 text-teal-700 |
| visit | bg-purple-50 text-purple-700 |
| negotiation | bg-amber-50 text-amber-700 |
| bayana | bg-orange-50 text-orange-700 |
| papers | bg-yellow-50 text-yellow-700 |
| closed | bg-green-50 text-green-700 |
| lost | bg-gray-100 text-gray-400 |

Badge component:
```jsx
function StatusBadge({ status }) {
  const styles = {
    new: 'bg-gray-100 text-gray-600',
    contacted: 'bg-blue-50 text-blue-700',
    interested: 'bg-teal-50 text-teal-700',
    visit: 'bg-purple-50 text-purple-700',
    negotiation: 'bg-amber-50 text-amber-700',
    bayana: 'bg-orange-50 text-orange-700',
    papers: 'bg-yellow-50 text-yellow-700',
    closed: 'bg-green-50 text-green-700',
    lost: 'bg-gray-100 text-gray-400',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${styles[status]}`}>
      {status}
    </span>
  )
}
```

### Avatar initials component
Every person (lead, agent) gets an initials circle. No profile photos needed.

```jsx
function Avatar({ name, size = 'md' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={`${sizes[size]} rounded-full bg-blue-50 flex items-center justify-center font-medium text-blue-700 flex-shrink-0`}>
      {initials}
    </div>
  )
}
```

### Currency display
Always format rupees with Indian locale. Never show raw numbers.

```javascript
function formatRupees(amount) {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}
// 4500000 → ₹45,00,000
```

---

## 13. Lead Card Interaction Pattern

This is the most important UI pattern in the entire system. Owner uses this dozens of times per day.

### What it does
From a single lead card, without navigating to a separate edit screen, Owner can:
1. See who the lead is and their current overdue status at a glance
2. Reschedule the follow-up with one tap (quick presets) or a date picker
3. Add a note about what happened on the call
4. Move the lead to a new pipeline stage
5. Save everything in one API call

### Why this matters
The old workflow: Owner finishes a call, writes something in a notebook, tries to remember when to call back. Leads go cold because nobody followed up.

The new workflow: Owner finishes a call, opens the app, taps "next week", types one line about the call, taps "negotiation", hits save. Done in 20 seconds. The system reminds him automatically.

### The single API call on save
All three updates — followUpDate, status, and new note — are sent in one PATCH request. Do NOT make three separate API calls.

```javascript
// Frontend sends this on save
PATCH /api/leads/:id
{
  followUpDate: "2026-04-10",
  status: "negotiation",           // only if changed
  note: "Called — interested in Block C 2BHK, budget flexible to 48L"
}

// Backend handler
async function updateLead(req, res) {
  const { followUpDate, status, note } = req.body
  const update = { updatedAt: new Date() }

  if (followUpDate) update.followUpDate = new Date(followUpDate)
  if (status) update.status = status

  // Append note to interactionHistory array — never overwrite
  if (note && note.trim()) {
    update.$push = {
      interactionHistory: {
        note: note.trim(),
        stage: status || lead.status,
        createdAt: new Date()
      }
    }
  }

  const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true })
  res.json({ success: true, data: lead })
}
```

### Add interactionHistory to Lead schema
The Lead schema needs this field — append notes, never overwrite:

```javascript
interactionHistory: [{
  note: { type: String, required: true },
  stage: { type: String },        // what stage was active when note was written
  createdAt: { type: Date, default: Date.now }
}]
// Always prepend newest entry — display newest first
// This IS the notebook replacement — every call, visit, or message logged here
```

### Quick preset logic (frontend)
The quick preset buttons (Today, Tomorrow, In 3 days, Next week, Next month) just set the date input value. No magic needed.

```javascript
function getPresetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0] // YYYY-MM-DD for input[type=date]
}

const presets = [
  { label: 'Today',      days: 0  },
  { label: 'Tomorrow',   days: 1  },
  { label: 'In 3 days',  days: 3  },
  { label: 'Next week',  days: 7  },
  { label: 'Next month', days: 30 },
]
```

### Overdue banner logic
```javascript
function getFollowUpStatus(followUpDate) {
  if (!followUpDate) return null
  const now = new Date()
  const due = new Date(followUpDate)
  const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0)  return { type: 'overdue', label: `Overdue ${Math.abs(diffDays)} day(s)`, color: 'red' }
  if (diffDays === 0) return { type: 'today',   label: 'Due today', color: 'amber' }
  if (diffDays <= 2)  return { type: 'soon',    label: `Due in ${diffDays} day(s)`, color: 'blue' }
  return null // no banner needed
}
```

### Full LeadCard component structure (Next.js / React)

```jsx
// components/LeadCard.jsx
'use client'
import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { Avatar } from './Avatar'
import { formatRupees } from '@/lib/format'

const STAGES = ['new','contacted','interested','visit','negotiation','bayana','papers','closed','lost']

const PRESETS = [
  { label: 'Today',     days: 0  },
  { label: 'Tomorrow',  days: 1  },
  { label: '3 days',    days: 3  },
  { label: 'Next week', days: 7  },
  { label: 'Month',     days: 30 },
]

function getPresetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getFollowUpStatus(followUpDate) {
  if (!followUpDate) return null
  const diffDays = Math.floor((new Date(followUpDate) - new Date()) / 86400000)
  if (diffDays < 0)   return { label: `Overdue ${Math.abs(diffDays)}d`, color: 'red' }
  if (diffDays === 0) return { label: 'Due today', color: 'amber' }
  if (diffDays <= 2)  return { label: `Due in ${diffDays}d`, color: 'blue' }
  return null
}

export function LeadCard({ lead, onSave }) {
  const [followUpDate, setFollowUpDate] = useState(
    lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''
  )
  const [stage, setStage] = useState(lead.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [activePreset, setActivePreset] = useState(null)

  const followUpStatus = getFollowUpStatus(lead.followUpDate)

  async function handleSave() {
    if (!note.trim() && stage === lead.status && followUpDate === lead.followUpDate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate, status: stage, note })
      })
      const data = await res.json()
      if (data.success) {
        setNote('')
        onSave?.(data.data)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={lead.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{lead.name}</span>
            {followUpStatus?.color === 'red' && (
              <span className="text-xs font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-md">
                {followUpStatus.label}
              </span>
            )}
            <StatusBadge status={stage} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {lead.phone} · {lead.leadType} · {lead.configuration || lead.propertyType} · Block {lead.block}
          </div>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{formatRupees(lead.budget)}</div>
      </div>

      {/* Overdue banner */}
      {followUpStatus?.color === 'red' && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
          Follow-up was due {Math.abs(Math.floor((new Date(lead.followUpDate) - new Date()) / 86400000))} days ago
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-3">

        {/* Reschedule */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Reschedule follow-up</div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {PRESETS.map(p => (
              <button
                key={p.days}
                onClick={() => { setFollowUpDate(getPresetDate(p.days)); setActivePreset(p.days) }}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  activePreset === p.days
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={followUpDate}
            onChange={e => { setFollowUpDate(e.target.value); setActivePreset(null) }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900"
          />
        </div>

        {/* Note */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Add note</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What happened on this call? What to discuss next time..."
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900 resize-none placeholder-gray-400"
          />
        </div>

        {/* Stage */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Move stage</div>
          <div className="flex gap-1.5 flex-wrap">
            {STAGES.filter(s => s !== 'new').map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  stage === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : s === 'lost'
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

      </div>

      {/* Interaction history */}
      {lead.interactionHistory?.length > 0 && (
        <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
          {[...lead.interactionHistory].reverse().map((entry, i) => (
            <div key={i} className="text-sm text-gray-700">
              {entry.note}
              <div className="text-xs text-gray-400 mt-0.5">
                {entry.stage} · {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
```

---

## 14. Daily Dashboard Layout

This is the first screen Owner sees every morning. It must answer three questions instantly:
1. Who do I need to call today?
2. What deals are active right now?
3. Any urgent property situations?

### Screen sections (top to bottom on mobile)

```
┌─────────────────────────────┐
│  Good morning               │  ← greeting with today's date
│  3 follow-ups due today     │  ← summary count, tappable
├─────────────────────────────┤
│  OVERDUE (2)                │  ← red section
│  [Lead card]                │
│  [Lead card]                │
├─────────────────────────────┤
│  DUE TODAY (3)              │  ← amber section
│  [Lead card]                │
│  [Lead card]                │
│  [Lead card]                │
├─────────────────────────────┤
│  ACTIVE DEALS (4)           │  ← deal pipeline summary
│  [Deal mini card]           │
├─────────────────────────────┤
│  UPCOMING (next 2 days)     │  ← blue section, collapsed by default
└─────────────────────────────┘
```

### Dashboard API call
Single endpoint that returns everything needed for the dashboard in one request:

```javascript
GET /api/dashboard

// Response
{
  success: true,
  data: {
    overdue: [...leads],      // followUpDate < today, sorted oldest first
    dueToday: [...leads],     // followUpDate = today
    upcoming: [...leads],     // followUpDate within 2 days
    activeDeals: [...deals],  // stage not in [closed, lost], sorted by riskLevel desc
    stats: {
      totalActiveLeads: 24,
      dealsInNegotiation: 3,
      dealsAtBayana: 1,
      expectedCommissionThisMonth: 125000
    }
  }
}
```

---

## 15. Project Folder Structure

```
sk-properties/
├── frontend/                    # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.jsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.jsx       # sidebar + mobile nav
│   │   │   ├── page.jsx         # daily dashboard
│   │   │   ├── leads/
│   │   │   │   ├── page.jsx     # leads list with filters
│   │   │   │   └── [id]/page.jsx # lead detail
│   │   │   ├── properties/
│   │   │   │   ├── page.jsx
│   │   │   │   └── [id]/page.jsx
│   │   │   ├── deals/
│   │   │   │   ├── page.jsx     # kanban board
│   │   │   │   └── [id]/page.jsx
│   │   │   ├── investments/
│   │   │   │   └── page.jsx
│   │   │   └── wealth/
│   │   │       └── page.jsx
│   ├── components/
│   │   ├── LeadCard.jsx         # the main interaction component
│   │   ├── PropertyCard.jsx
│   │   ├── DealCard.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── Avatar.jsx
│   │   ├── FollowUpBanner.jsx
│   │   └── MatchedBuyers.jsx    # shown on property detail
│   ├── lib/
│   │   ├── format.js            # formatRupees, formatDate, formatPhone
│   │   ├── api.js               # fetch wrapper with auth headers
│   │   └── constants.js         # STAGES, PROPERTY_TYPES, BLOCKS etc
│   └── store/
│       └── useAppStore.js       # Zustand store
│
├── backend/                     # Node.js + Express
│   ├── models/
│   │   ├── Lead.js
│   │   ├── Property.js
│   │   ├── Deal.js
│   │   ├── Investment.js
│   │   ├── Agent.js
│   │   └── WealthEntry.js
│   ├── routes/
│   │   ├── leads.js
│   │   ├── properties.js
│   │   ├── deals.js
│   │   ├── investments.js
│   │   ├── agents.js
│   │   ├── wealth.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── rbac.js              # role-based access check
│   ├── services/
│   │   ├── matchingEngine.js    # findMatchingBuyers()
│   │   ├── followUpEngine.js    # getDueFollowUps()
│   │   └── wealthTrigger.js     # auto-create WealthEntry on commission
│   └── index.js
```

---

## 16. Constants (use everywhere — never hardcode strings)

```javascript
// lib/constants.js

export const LEAD_SOURCES = ['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral']

export const LEAD_STATUSES = ['new', 'contacted', 'interested', 'visit', 'negotiation', 'bayana', 'papers', 'closed', 'lost']

export const PROPERTY_TYPES = ['residential', 'floor', 'office', 'rootFloor', 'fullBuilding', 'plot', 'commercial']

export const CONFIGURATIONS = ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA']

export const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'other']

export const DEAL_TYPES = ['brokerage', 'inflated', 'coInvestment']

export const DEAL_STAGES = ['negotiation', 'bayana', 'papers', 'closed', 'lost']

export const PAYMENT_TYPES = ['token', 'bayana', 'partPayment', 'fullPayment', 'commission']

export const RISK_LEVELS = ['low', 'medium', 'high']

export const OWNERSHIP_STATUS = ['available', 'underNegotiation', 'sold', 'ownerOwned']

export const WEALTH_CATEGORIES = ['commission', 'margin', 'investmentProfit', 'officeExpense', 'travelExpense', 'agentPayout', 'other']

// Follow-up presets (days from today)
export const FOLLOWUP_PRESETS = [
  { label: 'Today',     days: 0  },
  { label: 'Tomorrow',  days: 1  },
  { label: '3 days',    days: 3  },
  { label: 'Next week', days: 7  },
  { label: 'Next month',days: 30 },
]
```

---

## 17. Design System

> Adapted from TidalVape OMS design directives. Apply these rules to every UI component in SK Properties CRM.
> Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Shadcn UI · Framer Motion

### 17.1 Core Visual Identity

SK Properties CRM is used by a single broker on mobile while actively working — visiting properties, calling clients, managing deals. The aesthetic must be:

- Clean and professional — this is a business tool, not a consumer app
- Fast to scan — Owner should know what needs attention in 3 seconds
- Mobile-first — most usage is on phone, not desktop
- Black and white palette with semantic color only for status signals

**Color Palette — Tailwind classes only:**

| Role | Tailwind Class | When to use |
|---|---|---|
| Page background | `bg-white` | Overall page |
| Surface / Card | `bg-zinc-50` | Card backgrounds |
| Elevated card | `bg-white shadow-sm` | Interactive cards |
| Primary text | `text-zinc-900` | Names, values, headings |
| Secondary text | `text-zinc-500` | Labels, subtitles |
| Muted text | `text-zinc-400` | Timestamps, hints |
| Border default | `border-zinc-200` | Cards, panels |
| Border subtle | `border-zinc-100` | Dividers, table rows |
| Hover row | `bg-zinc-50` | Table row hover |
| Active / selected | `bg-zinc-900 text-white` | Selected nav, active pill |
| CTA button | `bg-zinc-900 text-white` | Primary save/submit |

**Status colors — semantic only, used sparingly:**

| Status | Background | Text | When |
|---|---|---|---|
| Overdue follow-up | `bg-red-50` | `text-red-700` | followUpDate in past |
| Due today | `bg-amber-50` | `text-amber-700` | followUpDate = today |
| Upcoming | `bg-blue-50` | `text-blue-700` | followUpDate within 2 days |
| Closed / success | `bg-green-50` | `text-green-700` | Deal closed, commission received |
| Lost / inactive | `bg-zinc-100` | `text-zinc-400` | Lost lead, dead deal |

**NEVER use:** `bg-blue-500`, `bg-indigo-*`, `bg-gray-*` (use `bg-zinc-*`), colored shadows, `ring` without `ring-zinc-900`.

### 17.2 Typography Scale

```tsx
// Font setup — app/layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
// Apply: className={`${inter.variable} font-sans`} on <html>
```

| Element | Tailwind Classes | Usage |
|---|---|---|
| Page heading | `text-2xl font-semibold tracking-tight text-zinc-900` | Page titles |
| Section heading | `text-base font-semibold text-zinc-900` | Card titles |
| Body | `text-sm text-zinc-600` | Descriptions |
| Body strong | `text-sm font-medium text-zinc-900` | Names, values |
| Caption / meta | `text-xs text-zinc-400 uppercase tracking-widest` | Timestamps, labels |
| Form label | `text-xs font-medium text-zinc-400 uppercase tracking-widest` | Input labels |
| Money / KPI | `text-zinc-900 font-semibold tabular-nums` | Rupee amounts, counts |
| Mono / ID | `font-mono text-xs text-zinc-500` | Lead IDs, reference numbers |

### 17.3 Spacing & Layout

| Context | Classes |
|---|---|
| Page container | `px-4 py-6 md:px-8 md:py-10` |
| Between sections | `space-y-6` |
| Card internal padding | `p-4` (mobile), `p-5 md:p-6` (desktop) |
| Between form fields | `space-y-4` |
| Grid gap | `gap-3` (mobile), `gap-4` (desktop) |
| Table row height | `h-[52px]` minimum |

### 17.4 Border Radius

| Element | Class |
|---|---|
| Cards | `rounded-xl` (mobile), `rounded-2xl` (desktop) |
| Buttons | `rounded-lg` |
| Inputs | `rounded-lg` |
| Status badges / pills | `rounded-full` |
| Stage pills | `rounded-full` |
| Modals / sheets | `rounded-2xl` |
| Avatar circles | `rounded-full` |

### 17.5 Interactive States

| State | Pattern |
|---|---|
| Card hover | `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` |
| Button hover | `hover:opacity-90 transition-opacity duration-150` |
| Table row hover | `hover:bg-zinc-50 transition-colors duration-150` |
| Input focus | `focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1` |
| Disabled | `opacity-40 cursor-not-allowed pointer-events-none` |
| Active / selected nav | `bg-zinc-900 text-white` |

### 17.6 Shadcn CSS Variable Overrides

Place in `app/globals.css` — maps all Shadcn defaults to B&W palette:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 10% 3.9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 0% 15%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --radius: 0.75rem;
  }
}
```

---

## 18. Component Patterns

### 18.1 Page Layout Shell

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
```

Page wrapper inside any page:
```tsx
<div className="px-4 py-6 md:px-8 md:py-10 max-w-screen-xl">
  <div className="mb-6">
    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Leads</h1>
    <p className="mt-1 text-sm text-zinc-500">All buyers and sellers</p>
  </div>
  {children}
</div>
```

### 18.2 Sidebar Navigation

```tsx
// components/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Building2, Briefcase, TrendingUp, Wallet, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/leads',       icon: Users,           label: 'Leads'       },
  { href: '/properties',  icon: Building2,       label: 'Properties'  },
  { href: '/deals',       icon: Briefcase,       label: 'Deals'       },
  { href: '/investments', icon: TrendingUp,      label: 'Investments' },
  { href: '/wealth',      icon: Wallet,          label: 'Wealth'      },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="hidden md:flex h-screen w-60 flex-col border-r border-zinc-200 bg-white px-3 py-6 shrink-0">
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="h-7 w-7 rounded-lg bg-zinc-900 shrink-0" />
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">SK Properties</span>
      </div>
      <ul className="flex-1 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href}>
              <Link href={href} className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                isActive ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              )}>
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-zinc-400')} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-zinc-100 pt-4">
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors duration-150">
          <Settings className="h-4 w-4 text-zinc-400" />
          Settings
        </Link>
      </div>
    </nav>
  )
}
```

Mobile bottom navigation (replaces sidebar on mobile):
```tsx
// components/MobileNav.tsx — shown on md:hidden
const mobileNavItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Home'       },
  { href: '/leads',      icon: Users,           label: 'Leads'      },
  { href: '/properties', icon: Building2,       label: 'Properties' },
  { href: '/deals',      icon: Briefcase,       label: 'Deals'      },
]
// Fixed bottom bar, 4 items max, active = zinc-900 icon + label
```

### 18.3 StatusBadge Component

```tsx
// components/StatusBadge.tsx
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  new:         'bg-zinc-100 text-zinc-600',
  contacted:   'bg-blue-50 text-blue-700',
  interested:  'bg-teal-50 text-teal-700',
  visit:       'bg-purple-50 text-purple-700',
  negotiation: 'bg-amber-50 text-amber-700',
  bayana:      'bg-orange-50 text-orange-700',
  papers:      'bg-yellow-50 text-yellow-700',
  closed:      'bg-green-50 text-green-700',
  lost:        'bg-zinc-100 text-zinc-400',
  available:       'bg-green-50 text-green-700',
  underNegotiation:'bg-amber-50 text-amber-700',
  sold:            'bg-zinc-100 text-zinc-400',
  ownerOwned:      'bg-blue-50 text-blue-700',
  low:    'bg-green-50 text-green-700',
  medium: 'bg-amber-50 text-amber-700',
  high:   'bg-red-50 text-red-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusStyles[status] ?? 'bg-zinc-100 text-zinc-500')}>
      {status}
    </span>
  )
}
```

### 18.4 Avatar Component

```tsx
// components/Avatar.tsx
type AvatarSize = 'sm' | 'md' | 'lg'

export function Avatar({ name, size = 'md' }: { name: string; size?: AvatarSize }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={`${sizes[size]} rounded-full bg-blue-50 flex items-center justify-center font-medium text-blue-700 flex-shrink-0`}>
      {initials}
    </div>
  )
}
```

### 18.5 Currency Formatter

```tsx
// lib/format.ts
export function formatRupees(amount: number | undefined | null): string {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
  // 4500000 → ₹45,00,000
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatPhone(phone: string): string {
  // Normalise to +91XXXXXXXXXX
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  return phone
}
```

### 18.6 Form Pattern (react-hook-form + zod)

```tsx
// Example: Add Lead form
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const leadSchema = z.object({
  name:         z.string().min(1, 'Required'),
  phone:        z.string().min(10, 'Enter valid phone'),
  leadType:     z.enum(['buyer', 'seller']),
  source:       z.enum(['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral']),
  budget:       z.number().optional(),
  location:     z.string().optional(),
  block:        z.enum(['A','B','C','D','E','F','other']).optional(),
  propertyType: z.enum(['residential','floor','office','rootFloor','fullBuilding','plot','commercial']).optional(),
  configuration:z.enum(['1BHK','2BHK','3BHK','4BHK','villa','plot','NA']).optional(),
})
type LeadFormValues = z.infer<typeof leadSchema>

// Label pattern
<Label className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5 block">
  Full Name
</Label>

// Input pattern
<Input
  {...register('name')}
  className={cn(
    'h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400',
    'focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 transition-shadow duration-150',
    errors.name ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-300'
  )}
  placeholder="Rajesh Kumar"
/>

// Error — no red, italic zinc-500
{errors.name && <p className="mt-1 text-xs text-zinc-500 italic">{errors.name.message}</p>}

// Submit button
<button
  type="submit"
  className="h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity duration-150 px-6"
>
  Save Lead
</button>
```

### 18.7 Data Table Pattern

```tsx
// Use @tanstack/react-table + Shadcn Table components
// npm install @tanstack/react-table
// npx shadcn@latest add table

// Table wrapper
<div className="rounded-2xl border border-zinc-200 overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="border-b border-zinc-200 hover:bg-transparent">
        <TableHead className="h-11 bg-zinc-50 text-xs font-medium text-zinc-400 uppercase tracking-widest">
          Name
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody className="divide-y divide-zinc-100">
      <TableRow className="h-[52px] transition-colors duration-150 hover:bg-zinc-50 cursor-pointer">
        <TableCell className="text-sm font-medium text-zinc-900">Rajesh Kumar</TableCell>
        <TableCell className="text-sm text-zinc-400">+91 98110 45231</TableCell>
      </TableRow>
    </TableBody>
  </Table>
  {/* Pagination footer */}
  <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
    <p className="text-xs text-zinc-400">Showing 1–20 of 143 leads</p>
  </div>
</div>
```

### 18.8 KPI Card

```tsx
// components/KpiCard.tsx
interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function KpiCard({ label, value, sub, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-3">{label}</p>
      <p className="text-3xl font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

// KPI Grid usage
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
  <KpiCard label="Active Leads"     value={24}    sub="3 overdue" />
  <KpiCard label="Active Deals"     value={6}     sub="1 at bayana" />
  <KpiCard label="Expected"         value="₹1.8L" sub="this month" />
  <KpiCard label="Investments"      value={3}     sub="₹42L holding" />
</div>
```

### 18.9 Loading Skeletons

Add shimmer to `tailwind.config.ts`:
```ts
theme: {
  extend: {
    keyframes: {
      shimmer: {
        '0%':   { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    },
    animation: { shimmer: 'shimmer 1.5s infinite linear' },
  },
}
```

Skeleton component:
```tsx
// components/ui/Skeleton.tsx
import { cn } from '@/lib/utils'
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer',
      className
    )} />
  )
}

// Usage patterns
<Skeleton className="h-4 w-32" />          // text line
<Skeleton className="h-10 w-24" />         // KPI number
<Skeleton className="h-[120px] w-full" />  // card block
<Skeleton className="h-[52px] w-full" />   // table row
<Skeleton className="h-10 w-10 rounded-full" /> // avatar
```

---

## 19. Animations

> Uses Framer Motion for component-level animations, Tailwind for hover/focus states.

### 19.1 Setup

```bash
npm install framer-motion
```

### 19.2 Motion Variants — `lib/motion.ts`

```ts
import { Variants } from 'framer-motion'

// Single card / panel entrance
export const fadeSlideUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
}

// Staggered list parent
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}

// Staggered list child
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } },
}

// Page transition
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
}

// Modal
export const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
}

// Slide from right (sheet/drawer)
export const sheetVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 35 } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

// Accordion expand/collapse
// Wrap content in AnimatePresence + motion.div with height: 0 → 'auto'
```

### 19.3 Usage Patterns

Single card entrance:
```tsx
<motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
  <LeadCard lead={lead} />
</motion.div>
```

Staggered leads list:
```tsx
<motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
  {leads.map(lead => (
    <motion.li key={lead._id} variants={staggerItem}>
      <LeadCard lead={lead} />
    </motion.li>
  ))}
</motion.ul>
```

Page-level transition in layout:
```tsx
// app/(dashboard)/layout.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { pageVariants } from '@/lib/motion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 overflow-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  )
}
```

AnimatedNumber for KPI count-up:
```tsx
// components/ui/AnimatedNumber.tsx
'use client'
import { useEffect } from 'react'
import { useSpring, useTransform, motion } from 'framer-motion'

export function AnimatedNumber({
  value,
  formatter = (v: number) => Math.round(v).toLocaleString('en-IN'),
}: {
  value: number
  formatter?: (v: number) => string
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, formatter)
  useEffect(() => { spring.set(value) }, [spring, value])
  return <motion.span className="tabular-nums">{display}</motion.span>
}
```

---

## 20. Workflow Scenarios

Every workflow below describes the exact user journey, what the frontend shows at each step, what API call is made, and what the backend does. Use these to implement both frontend state and backend logic correctly.

---

### 20.1 New Lead Comes In (Call/WhatsApp/Walkin)

**Trigger:** Owner receives a call or someone walks in.

**User journey:**
1. Owner opens app → taps "+" or "Add Lead" on leads page
2. Form opens (sheet from right on mobile, modal on desktop)
3. Owner fills: name, phone, leadType (buyer/seller), source, location, block, propertyType, configuration (if residential), budget, credibilityScore, notes
4. Taps Save

**Frontend state:**
```
isAddLeadOpen: false → true (sheet opens)
formState: empty → filling
submitting: false → true → false
leads list: re-fetches after success
```

**API call:**
```
POST /api/leads
Body: { name, phone, leadType, source, budget, location, block, propertyType, configuration, credibilityScore, notes }
Response: { success: true, data: newLead }
```

**Backend logic:**
1. Validate required fields: name, phone, leadType, source
2. Normalise phone to +91XXXXXXXXXX
3. Set status = 'new', followUpDate = tomorrow (default), createdAt = now
4. Save to Lead collection
5. If sourceAgentId provided, verify agent exists
6. Return created lead

**After save:**
- Sheet closes with exit animation
- Leads list re-fetches (or optimistically prepends the new lead)
- Toast: "Lead added — follow up tomorrow"
- If leadType = buyer: run matching query against available properties silently, store results for when lead detail is opened

---

### 20.2 Morning Dashboard — Owner Opens App

**Trigger:** Owner opens CRM, first screen every morning.

**User journey:**
1. App loads → Dashboard screen
2. Sees: overdue leads (red), due today (amber), active deals summary, quick stats

**Frontend state:**
```
dashboardLoading: true → false
Shows skeleton cards while loading
Overdue section expands automatically if count > 0
```

**API call:**
```
GET /api/dashboard
Response: {
  success: true,
  data: {
    overdue: Lead[],        // followUpDate < today, sorted oldest first
    dueToday: Lead[],       // followUpDate = today
    upcoming: Lead[],       // within 2 days
    activeDeals: Deal[],    // stage not in [closed, lost]
    stats: {
      totalActiveLeads: number,
      dealsInNegotiation: number,
      dealsAtBayana: number,
      expectedCommissionThisMonth: number,
      overdueCount: number
    }
  }
}
```

**Backend logic:**
```javascript
const now = new Date()
const todayStart = new Date(now.setHours(0,0,0,0))
const todayEnd   = new Date(now.setHours(23,59,59,999))
const twoDaysOut = new Date(todayEnd.getTime() + 2 * 86400000)

const [overdue, dueToday, upcoming, activeDeals] = await Promise.all([
  Lead.find({ status: { $nin: ['closed','lost'] }, followUpDate: { $lt: todayStart }, isDeleted: false }).sort({ followUpDate: 1 }),
  Lead.find({ status: { $nin: ['closed','lost'] }, followUpDate: { $gte: todayStart, $lte: todayEnd }, isDeleted: false }),
  Lead.find({ status: { $nin: ['closed','lost'] }, followUpDate: { $gt: todayEnd, $lte: twoDaysOut }, isDeleted: false }),
  Deal.find({ stage: { $nin: ['closed','lost'] }, isDeleted: false }).populate('propertyId buyerLeadId').sort({ riskLevel: -1 }),
])
```

---

### 20.3 Reschedule Follow-up + Add Note + Change Stage

**Trigger:** Owner finishes a call with a lead and wants to log what happened.

**User journey:**
1. Opens lead card (from dashboard or leads list)
2. Taps quick preset "Next week" → date input auto-fills
3. Types note: "Called — showing property Block C next Tuesday"
4. Taps "negotiation" stage pill
5. Taps "Save changes"

**Frontend state:**
```
followUpDate: current → new date (preset or manual)
activePreset: null → 7 (for Next week)
note: '' → typed text
stage: 'interested' → 'negotiation'
saving: false → true → false
interactionHistory: prepends new entry after save
```

**API call:**
```
PATCH /api/leads/:id
Body: {
  followUpDate: "2026-04-11",
  status: "negotiation",
  note: "Called — showing property Block C next Tuesday"
}
Response: { success: true, data: updatedLead }
```

**Backend logic:**
```javascript
async function updateLead(req, res) {
  const { followUpDate, status, note } = req.body
  const update: any = { updatedAt: new Date() }

  if (followUpDate) update.followUpDate = new Date(followUpDate)
  if (status) {
    update.status = status
    // If moving to bayana stage, require active deal to exist
    if (status === 'bayana') {
      const activeDeal = await Deal.findOne({ $or: [{ buyerLeadId: req.params.id }, { sellerLeadId: req.params.id }], stage: { $in: ['negotiation','bayana'] } })
      if (!activeDeal) return res.status(400).json({ success: false, error: 'Create a deal before marking bayana' })
    }
  }
  if (note?.trim()) {
    update.$push = {
      interactionHistory: {
        note: note.trim(),
        stage: status || undefined,
        createdAt: new Date()
      }
    }
  }

  const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true })
  res.json({ success: true, data: lead })
}
```

---

### 20.4 New Property Added → Matching Buyers Found

**Trigger:** A seller approaches Owner with a property.

**User journey:**
1. Owner taps "Add Property" 
2. Fills: title, location, block, propertyType, configuration, size, buildingAge, floorPrice, askingPrice, listedPrice, dealType, sellerId (select from leads), buildingCredibility, notes
3. Saves
4. System immediately shows "3 matching buyers found" banner on property detail page
5. Owner taps to see matched buyers, calls them from the list

**Frontend:**
```
After POST /properties succeeds:
→ Navigate to /properties/:id
→ On mount, GET /properties/:id/matches
→ Show matched buyers in "Potential Buyers" panel
→ Each matched buyer shows: name, phone, budget, credibilityScore, lastFollowUp
→ "Call" button opens phone dialer, "Add Note" opens mini note form
```

**API calls:**
```
POST /api/properties
Body: { title, location, block, propertyType, configuration, size, buildingAge, floorPrice, askingPrice, listedPrice, dealType, sellerId, buildingCredibility, notes }
Response: { success: true, data: newProperty }

GET /api/properties/:id/matches
Response: {
  success: true,
  data: {
    matches: Lead[],   // sorted by credibilityScore desc, max 10
    count: number
  }
}
```

**Backend matching logic:**
```javascript
async function findMatchingBuyers(propertyId) {
  const property = await Property.findById(propertyId)
  const query: any = {
    leadType: 'buyer',
    status: { $nin: ['closed', 'lost'] },
    isDeleted: false,
    location: property.location,
    propertyType: property.propertyType,
  }
  if (property.floorPrice) query.budget = { $gte: property.floorPrice * 0.9 }
  if (property.configuration && property.configuration !== 'NA') query.configuration = property.configuration
  if (property.block) {
    query.$or = [{ block: property.block }, { block: { $exists: false } }, { block: null }]
  }
  return Lead.find(query).sort({ credibilityScore: -1 }).limit(10)
}
```

---

### 20.5 Deal Created (Buyer + Seller Matched)

**Trigger:** Owner decides to proceed — a buyer is interested in a specific property.

**User journey:**
1. From property detail (matched buyers panel) or manually via "New Deal"
2. Select property, select buyer lead, confirm seller lead (auto-filled from property.sellerId)
3. Set dealType (pre-filled from property), agreedPrice, commissionRate
4. If two agents involved: select buyerAgentId, sellerAgentId, commissionSplitPercent
5. Set riskLevel + riskNotes if any
6. Save → Deal created at 'negotiation' stage

**Side effects on save:**
- Property.ownershipStatus → 'underNegotiation'
- Buyer Lead.status → 'negotiation'
- Seller Lead.status → 'negotiation'
- Deal.margin calculated: agreedPrice - floorPrice
- Deal.expectedCommission calculated: agreedPrice × commissionRate / 100
- Deal.stageHistory entry added: { stage: 'negotiation', date: now }

**API call:**
```
POST /api/deals
Body: {
  propertyId,
  buyerLeadId,
  sellerLeadId,
  dealType,
  agreedPrice,
  commissionRate,
  buyerAgentId?,
  sellerAgentId?,
  commissionSplitPercent?,
  riskLevel,
  riskNotes?
}
Response: { success: true, data: newDeal }
```

**Backend logic:**
```javascript
async function createDeal(req, res) {
  const { propertyId, buyerLeadId, sellerLeadId, agreedPrice, commissionRate, dealType } = req.body

  // Guard: property must be available
  const property = await Property.findById(propertyId)
  if (property.ownershipStatus === 'underNegotiation') {
    return res.status(400).json({ success: false, error: 'Property already under negotiation' })
  }

  // Lock floorPrice at creation time
  const floorPrice = property.floorPrice
  const margin = agreedPrice - (floorPrice || 0)
  const expectedCommission = agreedPrice * (commissionRate / 100)

  const deal = await Deal.create({
    ...req.body,
    floorPrice,  // LOCKED — never changes after this
    margin,
    expectedCommission,
    stage: 'negotiation',
    stageHistory: [{ stage: 'negotiation', date: new Date() }],
    totalPaid: 0,
    remainingAmount: agreedPrice,
  })

  // Side effects in parallel
  await Promise.all([
    Property.findByIdAndUpdate(propertyId, { ownershipStatus: 'underNegotiation' }),
    Lead.findByIdAndUpdate(buyerLeadId,  { status: 'negotiation' }),
    Lead.findByIdAndUpdate(sellerLeadId, { status: 'negotiation' }),
  ])

  res.json({ success: true, data: deal })
}
```

---

### 20.6 Payment Added to Deal

**Trigger:** Money changes hands during a deal — token, bayana, part payment, or full payment.

**User journey:**
1. Open deal detail → "Add Payment" button
2. Select type: token / bayana / partPayment / fullPayment / commission
3. Enter amount, date, paidBy, notes
4. Save
5. Deal screen updates: shows new payment in timeline, totalPaid increases, remainingAmount decreases

**Special case — Bayana payment:**
- When type = bayana, deal.stage auto-advances to 'bayana'
- Deal.bayanaDate set to payment.date
- Deal.margin LOCKED — cannot change agreedPrice after this

**Special case — FullPayment:**
- When type = fullPayment AND totalPaid reaches agreedPrice:
  - Suggest advancing stage to 'papers'

**Special case — Commission (verified = true):**
- Auto-creates WealthEntry: { type: 'income', category: 'commission', amount, dealId, date }
- Deal.actualCommission updated

**API call:**
```
POST /api/deals/:id/payments
Body: { type, amount, date, paidBy, receivedBy?, notes?, verified? }
Response: { success: true, data: updatedDeal }
```

**Backend logic:**
```javascript
async function addPayment(req, res) {
  const { type, amount, date, paidBy, notes, verified } = req.body
  const deal = await Deal.findById(req.params.id)

  // Add payment to array
  deal.payments.push({ type, amount, date, paidBy, notes, verified: verified || false })

  // Recalculate totals (exclude commission from totalPaid)
  const nonCommission = deal.payments.filter(p => p.type !== 'commission')
  deal.totalPaid = nonCommission.reduce((sum, p) => sum + p.amount, 0)
  deal.remainingAmount = deal.agreedPrice - deal.totalPaid

  // Auto-advance stage on bayana payment
  if (type === 'bayana' && deal.stage === 'negotiation') {
    deal.stage = 'bayana'
    deal.bayanaDate = new Date(date)
    deal.stageHistory.push({ stage: 'bayana', date: new Date() })
  }

  // Commission received and verified → create WealthEntry
  if (type === 'commission' && verified) {
    deal.actualCommission = (deal.actualCommission || 0) + amount
    await WealthEntry.create({
      type: 'income',
      category: deal.dealType === 'inflated' ? 'margin' : 'commission',
      amount,
      date: new Date(date),
      dealId: deal._id,
      description: `Commission — ${(await Property.findById(deal.propertyId))?.title || 'Property'}`,
    })
  }

  await deal.save()
  res.json({ success: true, data: deal })
}
```

---

### 20.7 Deal Closed

**Trigger:** Papers done, full payment received, commission collected.

**User journey:**
1. Deal detail → "Mark as Closed" button (appears when stage = papers)
2. Confirm modal: shows deal summary — agreedPrice, actualCommission, parties
3. Confirm
4. Deal stage → 'closed', closedDate set

**Side effects:**
- Property.ownershipStatus → 'sold'
- Buyer Lead.status → 'closed'
- Seller Lead.status → 'closed'
- Agent.totalDeals++ for both buyerAgentId and sellerAgentId
- Agent.totalCommission updated

**API call:**
```
PUT /api/deals/:id/close
Body: { closedDate? }
Response: { success: true, data: closedDeal }
```

---

### 20.8 Deal Lost

**Trigger:** One party backs out, title issue found, price disagreement, any reason.

**User journey:**
1. Deal detail → "Mark as Lost"
2. Required: select lostReason from dropdown or type custom reason
3. Confirm

**Side effects:**
- Property.ownershipStatus → 'available' (back on market)
- Buyer Lead.status → 'lost'
- Seller Lead.status → back to 'interested' (property still exists, seller may want new buyer)
- Deal.lostDate = now, Deal.lostReason = reason
- Note auto-added to both leads: "Deal lost — {reason}"

**API call:**
```
PUT /api/deals/:id/lost
Body: { lostReason: string }
Response: { success: true, data: updatedDeal }
```

---

### 20.9 Investment Property Purchased

**Trigger:** Owner (with or without co-investors) buys a property.

**User journey:**
1. Navigate to Investments → "Add Investment"
2. Select existing property OR create new property first
3. Enter: purchasePrice, purchaseDate, mySharePercent
4. Add co-investors if any: name, phone, amountInvested, sharePercent (must sum to 100%)
5. Enter holdingCosts (initial estimate), targetSalePrice
6. Save

**Side effects:**
- Property.ownershipStatus → 'ownerOwned'
- Investment.myAmount auto-calculated: purchasePrice × mySharePercent / 100

**API call:**
```
POST /api/investments
Body: { propertyId, purchasePrice, purchaseDate, mySharePercent, coInvestors[], holdingCosts, targetSalePrice }
Response: { success: true, data: newInvestment }
```

---

### 20.10 Investment Property Sold

**Trigger:** Owner sells an investment property.

**User journey:**
1. Investment detail → "Mark as Sold"
2. Enter: actualSalePrice, saleDate
3. System shows calculated profit breakdown:
   - Gross proceeds (my share): actualSalePrice × mySharePercent / 100
   - Less: myAmount (original investment)
   - Less: holdingCosts × mySharePercent / 100
   - Net profit: displayed before confirming
4. Confirm

**Side effects:**
- Investment.status → 'sold', saleDate set
- Investment.myProfit auto-calculated
- WealthEntry created: { type: 'income', category: 'investmentProfit', amount: myProfit }
- Property.ownershipStatus → 'sold'

**API call:**
```
PUT /api/investments/:id/sell
Body: { actualSalePrice, saleDate }
Response: { success: true, data: { investment, wealthEntry, profitBreakdown } }
```

**Backend profit calculation:**
```javascript
const grossMyProceeds = actualSalePrice * (investment.mySharePercent / 100)
const myHoldingShare  = investment.holdingCosts * (investment.mySharePercent / 100)
const myProfit = grossMyProceeds - investment.myAmount - myHoldingShare
```

---

## 21. Full API Contracts

### 21.1 Authentication

```
POST /api/auth/login
Body:    { phone: string, password: string }
Response: { success: true, data: { token, refreshToken, user: { _id, name, role } } }

POST /api/auth/refresh
Body:    { refreshToken: string }
Response: { success: true, data: { token } }

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { success: true }
```

---

### 21.2 Leads

```
GET /api/leads
Query params:
  page          number  (default 1)
  limit         number  (default 20)
  leadType      buyer | seller
  status        new | contacted | interested | visit | negotiation | bayana | papers | closed | lost
  overdueOnly   boolean — followUpDate < today
  location      string
  block         A | B | C | D | E | F | other
  propertyType  string
  search        string — searches name + phone
Response: { success: true, data: Lead[], pagination: { page, limit, total, pages } }

POST /api/leads
Body: LeadSchema fields (name + phone + leadType + source required)
Response: { success: true, data: Lead }

GET /api/leads/:id
Response: { success: true, data: Lead }  // includes interactionHistory

PATCH /api/leads/:id
Body: { followUpDate?, status?, note? }
// Most common endpoint — called on every lead card save
// note appended to interactionHistory array, never overwrites
Response: { success: true, data: Lead }

PUT /api/leads/:id
Body: All updatable fields (full update for edit form)
Response: { success: true, data: Lead }

DELETE /api/leads/:id
// Soft delete only — sets isDeleted: true
// Returns 400 if lead has active deals
Response: { success: true }
```

---

### 21.3 Properties

```
GET /api/properties
Query params:
  ownershipStatus  available | underNegotiation | sold | ownerOwned
  dealType         brokerage | inflated | coInvestment
  block            A | B | C | D | E | F | other
  propertyType     string
  search           string
  page, limit
Response: { success: true, data: Property[], pagination }

POST /api/properties
Body: PropertySchema fields (title + location + propertyType + dealType required)
Response: { success: true, data: Property }

GET /api/properties/:id
Response: { success: true, data: Property }  // populated with seller lead

PUT /api/properties/:id
Response: { success: true, data: Property }

GET /api/properties/:id/matches
// Returns matching buyer leads using matching engine query
Response: { success: true, data: { matches: Lead[], count: number } }

DELETE /api/properties/:id
// Soft delete — 400 if property has active deals
Response: { success: true }
```

---

### 21.4 Deals

```
GET /api/deals
Query params:
  stage      negotiation | bayana | papers | closed | lost
  dealType   brokerage | inflated | coInvestment
  riskLevel  low | medium | high
  page, limit
Response: { success: true, data: Deal[], pagination }
// Deal includes populated: propertyId, buyerLeadId, sellerLeadId

POST /api/deals
Body: {
  propertyId*,
  buyerLeadId*,
  sellerLeadId*,
  dealType*,
  agreedPrice*,
  commissionRate,
  buyerAgentId?,
  sellerAgentId?,
  commissionSplitPercent?,
  riskLevel?,
  riskNotes?
}
// Side effects: property → underNegotiation, both leads → negotiation, floorPrice LOCKED
Response: { success: true, data: Deal }

GET /api/deals/:id
Response: { success: true, data: Deal }  // fully populated

PATCH /api/deals/:id
Body: { agreedPrice?, riskLevel?, riskNotes?, notes? }
// agreedPrice update BLOCKED if stage = bayana or later
Response: { success: true, data: Deal }

PUT /api/deals/:id/stage
Body: { stage*, notes? }
// Validates stage progression (cannot skip stages)
// Logs to stageHistory
Response: { success: true, data: Deal }

POST /api/deals/:id/payments
Body: { type*, amount*, date*, paidBy?, receivedBy?, notes?, verified? }
// Recalculates totalPaid, remainingAmount
// If type=bayana: auto-advances stage, locks agreedPrice
// If type=commission and verified=true: creates WealthEntry
Response: { success: true, data: Deal }

PUT /api/deals/:id/payments/:paymentId/verify
Body: { verified: true }
// Marks commission as received, triggers WealthEntry creation
Response: { success: true, data: Deal }

PUT /api/deals/:id/close
Body: { closedDate? }
// Side effects: property → sold, both leads → closed, agent stats updated
Response: { success: true, data: Deal }

PUT /api/deals/:id/lost
Body: { lostReason* }
// Side effects: property → available, buyer → lost, seller → interested
Response: { success: true, data: Deal }
```

---

### 21.5 Investments

```
GET /api/investments
Query params: status (holding | sold), page, limit
Response: { success: true, data: Investment[], pagination }

POST /api/investments
Body: {
  propertyId*,
  purchasePrice*,
  purchaseDate*,
  mySharePercent*,
  coInvestors?: [{ name, phone, amountInvested, sharePercent }],
  holdingCosts?,
  targetSalePrice?
}
// myAmount auto-calculated, property → ownerOwned
Response: { success: true, data: Investment }

GET /api/investments/:id
Response: { success: true, data: Investment }  // populated property

PUT /api/investments/:id
Body: { holdingCosts?, targetSalePrice?, notes?, coInvestors? }
Response: { success: true, data: Investment }

PUT /api/investments/:id/sell
Body: { actualSalePrice*, saleDate? }
// Calculates myProfit, creates WealthEntry, property → sold
Response: {
  success: true,
  data: {
    investment: Investment,
    wealthEntry: WealthEntry,
    profitBreakdown: {
      grossMyProceeds: number,
      lessOriginalInvestment: number,
      lessHoldingCosts: number,
      netProfit: number
    }
  }
}
```

---

### 21.6 Agents

```
GET /api/agents
Query params: type (internal | external)
Response: { success: true, data: Agent[] }

POST /api/agents
Body: { name*, phone, type* }
Response: { success: true, data: Agent }

PUT /api/agents/:id
Body: { name?, phone?, notes? }
Response: { success: true, data: Agent }
```

---

### 21.7 Wealth / Income Ledger

```
GET /api/wealth
Query params:
  type      income | expense
  category  commission | margin | investmentProfit | officeExpense | travelExpense | agentPayout | other
  from      date string
  to        date string
  page, limit
Response: {
  success: true,
  data: {
    entries: WealthEntry[],
    summary: {
      totalIncome: number,
      totalExpense: number,
      net: number
    },
    pagination
  }
}

POST /api/wealth
Body: { type*, category*, amount*, date*, description?, dealId? }
// Manual entry (automatic entries created via deal commission trigger)
Response: { success: true, data: WealthEntry }
```

---

### 21.8 Dashboard

```
GET /api/dashboard
Response: {
  success: true,
  data: {
    overdue:     Lead[],
    dueToday:    Lead[],
    upcoming:    Lead[],
    activeDeals: Deal[],
    stats: {
      totalActiveLeads: number,
      overdueCount: number,
      dealsInNegotiation: number,
      dealsAtBayana: number,
      dealsAtPapers: number,
      expectedCommissionThisMonth: number,
      investmentsHolding: number,
      investmentsHoldingValue: number
    }
  }
}
```

---

### 21.9 Error Codes

```
400  Bad Request      — validation failed, business rule violation
401  Unauthorized     — no token or expired token
403  Forbidden        — valid token but insufficient role
404  Not Found        — resource does not exist
409  Conflict         — e.g. property already underNegotiation
500  Internal Error   — unexpected server error
```

All errors return:
```json
{ "success": false, "error": "Human readable message", "code": 400 }
```

---

## 22. State Management — Source of Truth

### 22.1 The Architecture

```
MongoDB
  └── Express API (/api/*)
        └── TanStack Query  ← server data cache (leads, properties, deals)
              └── Zustand   ← UI state only (modals, filters, selected items)
                    └── React Components
```

**Rule: Never store server data in Zustand.**
Zustand holds only UI state. TanStack Query holds all data fetched from the API.
This means adding a lead, updating a property, or closing a deal automatically
reflects everywhere in the app without manual state wiring.

### 22.2 Setup

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Root provider — `app/providers.tsx`:
```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,   // data considered fresh for 2 minutes
        retry: 1,                    // retry failed requests once
        refetchOnWindowFocus: true,  // refetch when Owner switches back to the app
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Wrap in `app/layout.tsx`:
```tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### 22.3 API Client — `lib/api.ts`

Single fetch wrapper. All hooks use this. Handles auth token automatically.

```typescript
// lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('sk_token')
    : null

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// Convenience methods
export const api = {
  get:    <T>(url: string)                    => request<T>(url),
  post:   <T>(url: string, body: unknown)     => request<T>(url, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown)     => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown)     => request<T>(url, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: <T>(url: string)                    => request<T>(url, { method: 'DELETE' }),
}
```

### 22.4 Query Keys — `lib/queryKeys.ts`

Centralised query key factory. Never hardcode strings in components.

```typescript
// lib/queryKeys.ts

export const queryKeys = {
  // Dashboard
  dashboard: ['dashboard'] as const,

  // Leads
  leads:       (filters?: Record<string, unknown>) => ['leads', filters] as const,
  lead:        (id: string)                        => ['leads', id] as const,
  leadMatches: (id: string)                        => ['leads', id, 'matches'] as const,

  // Properties
  properties:     (filters?: Record<string, unknown>) => ['properties', filters] as const,
  property:       (id: string)                        => ['properties', id] as const,
  propertyMatches:(id: string)                        => ['properties', id, 'matches'] as const,

  // Deals
  deals: (filters?: Record<string, unknown>) => ['deals', filters] as const,
  deal:  (id: string)                        => ['deals', id] as const,

  // Investments
  investments: (filters?: Record<string, unknown>) => ['investments', filters] as const,
  investment:  (id: string)                        => ['investments', id] as const,

  // Agents
  agents: ['agents'] as const,
  agent:  (id: string) => ['agents', id] as const,

  // Wealth
  wealth: (filters?: Record<string, unknown>) => ['wealth', filters] as const,
}
```

### 22.5 Data Hooks — `hooks/`

One file per resource. These are the only way components fetch data.

#### `hooks/useLeads.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

// Types
interface Lead {
  _id: string
  name: string
  phone: string
  leadType: 'buyer' | 'seller'
  status: string
  followUpDate?: string
  budget?: number
  location?: string
  block?: string
  propertyType?: string
  configuration?: string
  credibilityScore?: number
  source: string
  sourceAgentId?: string
  interactionHistory: { note: string; stage: string; createdAt: string }[]
  notes?: string
  createdAt: string
}

interface LeadsFilters {
  page?: number
  limit?: number
  leadType?: 'buyer' | 'seller'
  status?: string
  overdueOnly?: boolean
  location?: string
  search?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  pagination?: { page: number; limit: number; total: number; pages: number }
}

// ─── READ ────────────────────────────────────────────────────────────────────

/** Paginated leads list with optional filters */
export function useLeads(filters: LeadsFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: queryKeys.leads(filters),
    queryFn:  () => api.get<ApiResponse<Lead[]>>(`/api/leads?${params}`),
  })
}

/** Single lead by id */
export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn:  () => api.get<ApiResponse<Lead>>(`/api/leads/${id}`),
    enabled:  !!id,
  })
}

/** Overdue leads only — used on dashboard */
export function useOverdueLeads() {
  return useQuery({
    queryKey: queryKeys.leads({ overdueOnly: true }),
    queryFn:  () => api.get<ApiResponse<Lead[]>>('/api/leads?overdueOnly=true'),
    refetchInterval: 1000 * 60 * 5, // refetch every 5 mins
  })
}

// ─── WRITE ───────────────────────────────────────────────────────────────────

/** Add a new lead */
export function useAddLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Lead>) =>
      api.post<ApiResponse<Lead>>('/api/leads', data),

    onSuccess: () => {
      // Invalidate all lead lists — they will refetch automatically
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      // Also invalidate dashboard since overdue count may change
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

/** Quick update from lead card: followUpDate + status + note in one call */
export function useUpdateLead(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { followUpDate?: string; status?: string; note?: string }) =>
      api.patch<ApiResponse<Lead>>(`/api/leads/${id}`, data),

    onMutate: async (data) => {
      // Optimistic update — update cache immediately before server responds
      // So the UI feels instant even on slow connections
      await queryClient.cancelQueries({ queryKey: queryKeys.lead(id) })
      const previous = queryClient.getQueryData(queryKeys.lead(id))

      queryClient.setQueryData(queryKeys.lead(id), (old: ApiResponse<Lead> | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            ...(data.followUpDate && { followUpDate: data.followUpDate }),
            ...(data.status && { status: data.status }),
            ...(data.note && {
              interactionHistory: [
                { note: data.note, stage: data.status || old.data.status, createdAt: new Date().toISOString() },
                ...(old.data.interactionHistory || []),
              ],
            }),
          },
        }
      })

      return { previous }
    },

    onError: (_err, _vars, context) => {
      // Roll back optimistic update if server returns error
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.lead(id), context.previous)
      }
    },

    onSettled: () => {
      // Always refetch after mutation to ensure server truth
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(id) })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

/** Full edit from lead edit form */
export function useEditLead(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Lead>) =>
      api.put<ApiResponse<Lead>>(`/api/leads/${id}`, data),

    onSuccess: (response) => {
      // Update this lead in cache directly with server response
      queryClient.setQueryData(queryKeys.lead(id), response)
      // Invalidate list (budget/location may have changed — affects filters)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

/** Soft delete */
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<null>>(`/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
```

#### `hooks/useProperties.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

interface Property {
  _id: string
  title: string
  location: string
  block?: string
  propertyType: string
  configuration?: string
  size?: number
  floorPrice?: number
  askingPrice?: number
  listedPrice?: number
  dealType: 'brokerage' | 'inflated' | 'coInvestment'
  ownershipStatus: string
  buildingCredibility?: number
  sellerId?: string
  sourceAgentId?: string
  notes?: string
  createdAt: string
}

interface PropertyFilters {
  ownershipStatus?: string
  dealType?: string
  block?: string
  propertyType?: string
  search?: string
  page?: number
  limit?: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  pagination?: { page: number; limit: number; total: number; pages: number }
}

export function useProperties(filters: PropertyFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })

  return useQuery({
    queryKey: queryKeys.properties(filters),
    queryFn:  () => api.get<ApiResponse<Property[]>>(`/api/properties?${params}`),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: queryKeys.property(id),
    queryFn:  () => api.get<ApiResponse<Property>>(`/api/properties/${id}`),
    enabled:  !!id,
  })
}

/** Matching buyers for a property — runs on property detail page */
export function usePropertyMatches(id: string) {
  return useQuery({
    queryKey: queryKeys.propertyMatches(id),
    queryFn:  () => api.get<ApiResponse<{ matches: Lead[]; count: number }>>(`/api/properties/${id}/matches`),
    enabled:  !!id,
  })
}

export function useAddProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Property>) =>
      api.post<ApiResponse<Property>>('/api/properties', data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useEditProperty(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Property>) =>
      api.put<ApiResponse<Property>>(`/api/properties/${id}`, data),

    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.property(id), response)
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}
```

#### `hooks/useAgents.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

interface Agent {
  _id: string
  name: string
  phone?: string
  type: 'internal' | 'external'
  totalDeals: number
  totalCommission: number
  notes?: string
}

interface ApiResponse<T> { success: boolean; data: T }

/** All agents — used in dropdowns throughout the app */
export function useAgents(type?: 'internal' | 'external') {
  const url = type ? `/api/agents?type=${type}` : '/api/agents'
  return useQuery({
    queryKey: [...queryKeys.agents, type],
    queryFn:  () => api.get<ApiResponse<Agent[]>>(url),
    staleTime: 1000 * 60 * 10, // agents change rarely — cache for 10 minutes
  })
}

export function useAddAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; phone?: string; type: 'internal' | 'external' }) =>
      api.post<ApiResponse<Agent>>('/api/agents', data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents })
    },
  })
}

export function useEditAgent(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Agent>) =>
      api.put<ApiResponse<Agent>>(`/api/agents/${id}`, data),

    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.agent(id), response)
      queryClient.invalidateQueries({ queryKey: queryKeys.agents })
    },
  })
}
```

#### `hooks/useDeals.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

interface ApiResponse<T> { success: boolean; data: T }

export function useDeals(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined) params.set(k, String(v))
  })
  return useQuery({
    queryKey: queryKeys.deals(filters),
    queryFn:  () => api.get(`/api/deals?${params}`),
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: queryKeys.deal(id),
    queryFn:  () => api.get(`/api/deals/${id}`),
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post('/api/deals', data),
    onSuccess: () => {
      // Invalidate deals, properties (status changed), leads (status changed)
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useAddPayment(dealId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payment: unknown) =>
      api.post(`/api/deals/${dealId}/payments`, payment),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.deal(dealId), response)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      queryClient.invalidateQueries({ queryKey: ['wealth'] }) // if commission verified
    },
  })
}

export function useCloseDeal(dealId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { closedDate?: string }) =>
      api.put(`/api/deals/${dealId}/close`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
```

### 22.6 Zustand — UI State Only — `store/useUIStore.ts`

Zustand only manages things that are NOT server data.

```typescript
// store/useUIStore.ts
import { create } from 'zustand'

interface UIStore {
  // Add Lead sheet
  addLeadOpen: boolean
  openAddLead:  () => void
  closeAddLead: () => void

  // Add Property sheet
  addPropertyOpen: boolean
  openAddProperty:  () => void
  closeAddProperty: () => void

  // Add Deal modal
  addDealOpen: boolean
  addDealPropertyId: string | null  // pre-fill when opening from property page
  addDealBuyerLeadId: string | null // pre-fill when opening from matched buyers
  openAddDeal:  (propertyId?: string, buyerLeadId?: string) => void
  closeAddDeal: () => void

  // Add Agent sheet
  addAgentOpen: boolean
  openAddAgent:  () => void
  closeAddAgent: () => void

  // Leads page filters
  leadsFilter: {
    leadType?: 'buyer' | 'seller'
    status?: string
    overdueOnly?: boolean
    search?: string
  }
  setLeadsFilter: (filter: Partial<UIStore['leadsFilter']>) => void
  resetLeadsFilter: () => void

  // Properties page filters
  propertiesFilter: {
    ownershipStatus?: string
    dealType?: string
    block?: string
    search?: string
  }
  setPropertiesFilter: (filter: Partial<UIStore['propertiesFilter']>) => void

  // Selected lead for quick-edit (lead card interaction)
  selectedLeadId: string | null
  setSelectedLeadId: (id: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  // Add Lead
  addLeadOpen:  false,
  openAddLead:  () => set({ addLeadOpen: true }),
  closeAddLead: () => set({ addLeadOpen: false }),

  // Add Property
  addPropertyOpen:  false,
  openAddProperty:  () => set({ addPropertyOpen: true }),
  closeAddProperty: () => set({ addPropertyOpen: false }),

  // Add Deal
  addDealOpen:       false,
  addDealPropertyId: null,
  addDealBuyerLeadId:null,
  openAddDeal: (propertyId, buyerLeadId) => set({
    addDealOpen:        true,
    addDealPropertyId:  propertyId  || null,
    addDealBuyerLeadId: buyerLeadId || null,
  }),
  closeAddDeal: () => set({ addDealOpen: false, addDealPropertyId: null, addDealBuyerLeadId: null }),

  // Add Agent
  addAgentOpen:  false,
  openAddAgent:  () => set({ addAgentOpen: true }),
  closeAddAgent: () => set({ addAgentOpen: false }),

  // Leads filter
  leadsFilter: {},
  setLeadsFilter:   (f) => set((s) => ({ leadsFilter: { ...s.leadsFilter, ...f } })),
  resetLeadsFilter: ()  => set({ leadsFilter: {} }),

  // Properties filter
  propertiesFilter: {},
  setPropertiesFilter: (f) => set((s) => ({ propertiesFilter: { ...s.propertiesFilter, ...f } })),

  // Selected lead
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
}))
```

### 22.7 How It All Connects — Add Lead Example

This is the complete flow from button click to UI update.

```
Owner taps "Add Lead"
    ↓
useUIStore.openAddLead() → addLeadOpen: true → Sheet opens (Framer Motion)
    ↓
Owner fills form (react-hook-form + zod validation)
    ↓
Owner taps "Save"
    ↓
useAddLead().mutate(formData)
    ↓
api.post('/api/leads', formData)
    ↓
Backend: validate → normalise phone → save to MongoDB → return lead
    ↓
onSuccess fires:
  queryClient.invalidateQueries(['leads'])  → leads list refetches
  queryClient.invalidateQueries(['dashboard']) → dashboard refetches
    ↓
useUIStore.closeAddLead() → Sheet closes
    ↓
Leads list automatically shows new lead (no manual state update)
```

In code inside the Add Lead sheet component:
```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAddLead } from '@/hooks/useLeads'
import { useUIStore } from '@/store/useUIStore'
import { leadSchema, LeadFormValues } from '@/lib/schemas'

export function AddLeadSheet() {
  const { addLeadOpen, closeAddLead } = useUIStore()
  const addLead = useAddLead()

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { leadType: 'buyer', source: 'call' },
  })

  async function onSubmit(data: LeadFormValues) {
    try {
      await addLead.mutateAsync(data)
      form.reset()
      closeAddLead()
      // No manual list update needed — invalidateQueries handles it
    } catch (err) {
      // Error shown inline — toast or form error
    }
  }

  return (
    <AnimatePresence>
      {addLeadOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeAddLead}
          />
          {/* Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 overflow-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-900">Add Lead</h2>
                <button onClick={closeAddLead} className="text-zinc-400 hover:text-zinc-900">✕</button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* form fields here */}
                <button
                  type="submit"
                  disabled={addLead.isPending}
                  className="w-full h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {addLead.isPending ? 'Saving...' : 'Save Lead'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

### 22.8 How Add Property Works (Same Pattern)

```tsx
// Triggered from Properties page header or from matched buyers panel
const { openAddProperty, closeAddProperty, addPropertyOpen } = useUIStore()
const addProperty = useAddProperty()

// On save:
await addProperty.mutateAsync(formData)
closeAddProperty()
// properties list auto-updates via invalidateQueries
// if navigating to new property: router.push(`/properties/${newProperty._id}`)
```

### 22.9 How Add Agent Works

Agents are simpler — they appear in dropdowns throughout the app (lead form, deal form, property form). When a new agent is added:

```tsx
const addAgent = useAddAgent()
const { agents } = useAgents() // this populates all dropdowns

// On save:
await addAgent.mutateAsync({ name, phone, type })
// useAgents() cache invalidates → all dropdowns refresh automatically
```

Agent dropdown used in forms:
```tsx
const { data: agentsData } = useAgents('external')
const agents = agentsData?.data || []

<select {...register('sourceAgentId')} className="...">
  <option value="">No agent</option>
  {agents.map(agent => (
    <option key={agent._id} value={agent._id}>{agent.name}</option>
  ))}
</select>
```

### 22.10 Summary — What Goes Where

| Data | Lives In | Why |
|---|---|---|
| All leads from API | TanStack Query cache | Server is source of truth |
| All properties from API | TanStack Query cache | Server is source of truth |
| All deals from API | TanStack Query cache | Server is source of truth |
| All agents from API | TanStack Query cache | Server is source of truth |
| Is add-lead sheet open | Zustand | Pure UI state, not server data |
| Which filter is active | Zustand | Pure UI state |
| Which lead is selected | Zustand | Pure UI state |
| Form values while typing | react-hook-form | Local form state |
| Auth token | localStorage | Persisted between sessions |
| User info after login | Zustand (persisted) | Small, rarely changes |