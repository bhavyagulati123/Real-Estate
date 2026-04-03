# SK Properties — Application Build Reference
**Version:** 1.0  
**Author:** Bhavya Gulati  
**Purpose:** Complete reference for building the SK Properties CRM system. Use this file with Codex or any AI coding assistant to generate accurate, business-logic-aware code.

---

## 1. Business Context

SK Properties is a local property brokerage in Mohan Garden, Delhi. Run by a single experienced broker (referred to as "Father" or "Operator") with 15 years of local goodwill. The system replaces a physical notebook and memory-driven workflow.

### Revenue Models (Critical — All Three Must Be Supported)

**Type A — Pure Brokerage**
- Father connects buyer and seller
- Earns commission (usually 1%) from one or both parties
- Commission is separate from the deal price
- If two agents are involved, each earns commission from their respective party

**Type B — Price Inflation**
- Father knows seller's actual floor price (minimum they will accept)
- Father lists the property at a higher price to buyers
- The spread between floor price and listed price is Father's margin
- No separate commission discussed — margin IS the revenue
- margin = listedPrice - floorPrice

**Type C — Co-Investment**
- Father (sometimes with other agents or financers) buys the property outright
- Sells it later for profit
- Revenue = profit on sale, not commission
- Co-investors split profit proportionally by share percentage
- Tracked in the Investment collection, not the Deal commission fields

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Node.js with Express |
| Database | MongoDB with Mongoose |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Deployment | Vercel (frontend) + Railway or Render (backend) |
| Auth | JWT with refresh tokens |

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
  // Father's gut judgment — 1=very doubtful, 3=seems genuine, 5=highly credible
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
  // General notes, Father's gut feeling, any context

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

A Property is a physical property — available, under negotiation, or owned by Father.

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
  // Is building legally clean? Good construction? Father's assessment.

  // PRICING — three price fields, all serve different purposes
  floorPrice: { type: Number },
  // Seller's actual minimum — PRIVATE, never shown to buyers
  // Foundation of all margin calculations

  askingPrice: { type: Number },
  // What seller is publicly asking — usually above floor

  listedPrice: { type: Number },
  // What Father shows buyers
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
      'ownerOwned'        // Father/group purchased — links to Investment
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
      'commission'    // Father's commission — separate from deal price
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
  // Father's share % when commission is split
  // e.g. 50 = Father keeps 50% of his side's commission

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
margin       = 500,000   (Father's spread in inflated deal)
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

Properties Father has purchased — alone or with co-investors.

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

### Phase 2 — Deal Pipeline

Screens to build:
- Kanban board: negotiation / bayana / papers / closed / lost columns
- Deal detail: parties, money flow timeline, payment entry
- Add payment form: type, amount, date, paidBy, notes, verify toggle
- Commission panel: expected vs actual, leakage display
- Risk flag panel

APIs:
- POST /deals
- PUT /deals/:id/stage — advance stage, log to stageHistory
- POST /deals/:id/payments — add payment
- PUT /deals/:id/payments/:pid/verify — verify commission, trigger WealthEntry
- GET /deals — filters by stage, risk, dealType

---

### Phase 3 — Investment Tracker

Screens to build:
- Portfolio list: holding properties with holding period and target profit
- Add investment form with co-investor section
- Investment detail: costs, target vs actual, profit calculation
- Mark sold flow: enter sale price, auto-calculate profit

APIs:
- POST /investments
- PUT /investments/:id
- PUT /investments/:id/sell

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
- Home: Father's credibility, 15 years, WhatsApp CTA
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
| Operator (Father) | Full CRM, deals, investments — no system config |
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

```
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=5000
NODE_ENV=development
META_ACCESS_TOKEN=
WHATSAPP_TOKEN=
```

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
- No clutter. Father does not need analytics dashboards with 20 charts. He needs to see: who to call today, what properties are available, and what deals are active.
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

This is the most important UI pattern in the entire system. Father uses this dozens of times per day.

### What it does
From a single lead card, without navigating to a separate edit screen, Father can:
1. See who the lead is and their current overdue status at a glance
2. Reschedule the follow-up with one tap (quick presets) or a date picker
3. Add a note about what happened on the call
4. Move the lead to a new pipeline stage
5. Save everything in one API call

### Why this matters
The old workflow: Father finishes a call, writes something in a notebook, tries to remember when to call back. Leads go cold because nobody followed up.

The new workflow: Father finishes a call, opens the app, taps "next week", types one line about the call, taps "negotiation", hits save. Done in 20 seconds. The system reminds him automatically.

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

This is the first screen Father sees every morning. It must answer three questions instantly:
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
