# SK Properties — Application Master Reference
**Version:** 1.0  
**Owner:** Bhavya Gulati  
**Business:** SK Properties, Mohan Garden, Delhi  
**Purpose:** Complete application blueprint for AI-assisted code generation

---

## 1. Business Context

SK Properties is a 15-year-old local property brokerage in Mohan Garden, Delhi West.
The business operates on commission and runs three distinct revenue models simultaneously.
The owner (referred to as "Father" in this document) currently operates entirely from memory
and a physical notebook. This system replaces that.

### Three Revenue Models
Every piece of commission/financial logic must account for all three:

1. **Brokerage** — Connect buyer and seller. Earn 1% commission from one or both sides.
   Commission is separate from the deal price. Agent splits may apply.

2. **Inflation** — Father knows seller's floor price. Presents a higher listed price to buyer.
   The spread (listedPrice − floorPrice) is the revenue. No separate commission discussed.

3. **Co-Investment** — Father buys property (alone or with partners) and sells later.
   Revenue is profit on sale. Tracked in the Investment module, not the Deal commission fields.

### Key Business Facts
- Area: Mohan Garden, Delhi West (hyperlocal — block-level geography matters)
- Properties: residential floors, offices, root floors, full buildings
- Residential configs: 1BHK, 2BHK, 3BHK, 4BHK, Studio
- Price varies by block (A, B, C, D etc.) within the same area
- Deals take 2–6 months average; money moves in multiple installments
- Commission received only after papers signed and full payment transferred
- External agents collaborate frequently — each earns from their respective party
- Father's credibility judgment about a person/property is a first-class data point

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend | Node.js with Express |
| Database | MongoDB with Mongoose |
| Auth | NextAuth.js (JWT) |
| Deployment | Vercel (frontend) + Railway or Render (backend) |
| Design | Mobile-first, fully responsive |

---

## 3. User Roles

| Role | Access | Description |
|---|---|---|
| admin | Full system | Bhavya — configuration, analytics, all data |
| operator | CRM + Deals + Investments | Father — daily usage |
| agent | Assigned leads only | Future external agents |

Role is stored on the User model. All API routes check role via middleware.

---

## 4. Database Schemas

### 4.1 Lead

Represents a person — buyer or seller — who has shown interest.

```javascript
{
  _id: ObjectId,
  
  // Identity
  name: String,                  // full name
  phone: String,                 // stored as string, preserves +91 format
  leadType: String,              // enum: ['buyer', 'seller']
  source: String,                // enum: ['call', 'whatsapp', 'agent', 'walkin']
  sourceAgentId: ObjectId,       // ref: Agent — which agent brought this lead (null if direct)

  // What they want (buyer) / What they have (seller)
  budget: Number,                // rupees — max for buyer, min acceptable for seller
  location: String,              // area/lane in Mohan Garden
  block: String,                 // enum: ['A','B','C','D','E','F','NA'] — block within area
  propertyType: String,          // enum: ['floor','office','rootFloor','fullBuilding','plot']
  configuration: String,         // enum: ['1BHK','2BHK','3BHK','4BHK','Studio',null] — only for residential
  size: Number,                  // square yards
  buildingAge: String,           // e.g. '5 years', '10+ years', 'new construction'

  // Qualification — Father's judgment
  credibilityScore: Number,      // 1–5, Father's gut assessment of this person
  ownershipType: String,         // enum: ['selfOwned','financer','sharedWithAgent'] — for sellers
  notes: String,                 // free text — anything important Father noticed

  // Pipeline
  status: String,                // enum: ['new','contacted','interested','visit','negotiation','bayana','papers','closed','lost']
  lostReason: String,            // populated when status = lost

  // Follow-up engine
  followUpDate: Date,            // THE most important field — queried daily
  followUpNotes: String,         // what to discuss on next contact

  // Timestamps
  createdAt: Date,               // auto
  updatedAt: Date                // auto
}
```

**Business rules:**
- `configuration` is only relevant when `propertyType` is `floor` or `fullBuilding` (residential)
- `ownershipType` is only relevant when `leadType` is `seller`
- `sourceAgentId` is null for direct leads (call/whatsapp/walkin)
- Every lead MUST have a `followUpDate` set — enforced at creation
- `credibilityScore` is mandatory — Father must rate every lead

---

### 4.2 Property

Represents a physical property — available, under negotiation, or owned.

```javascript
{
  _id: ObjectId,

  // Identity
  title: String,                 // e.g. "2BHK Floor, Block C, Mohan Garden"
  location: String,              // lane/sector in Mohan Garden
  block: String,                 // enum: ['A','B','C','D','E','F','NA']
  propertyType: String,          // enum: ['floor','office','rootFloor','fullBuilding','plot']
  configuration: String,         // enum: ['1BHK','2BHK','3BHK','4BHK','Studio',null]
  size: Number,                  // square yards
  buildingAge: String,
  buildingCredibility: Number,   // 1–5, Father's assessment of legal/structural quality
  
  // Pricing — private and public layers
  floorPrice: Number,            // PRIVATE — seller's actual minimum. Never shown to buyers.
  askingPrice: Number,           // What seller publicly wants
  listedPrice: Number,           // What Father shows buyers (may be inflated above askingPrice)
  
  // Deal classification
  dealType: String,              // enum: ['brokerage','inflated','coInvestment']
  
  // Ownership & availability
  ownershipStatus: String,       // enum: ['available','underNegotiation','sold','ownerOwned']
                                 // available = open for buyers
                                 // underNegotiation = active deal in progress
                                 // sold = completed
                                 // ownerOwned = Father/investment group holds this property
  sellerId: ObjectId,            // ref: Lead — the seller's contact record
  sourceAgentId: ObjectId,       // ref: Agent — who brought this listing in (null if direct)

  // Media
  images: [String],              // array of image URLs
  documents: [String],           // array of document URLs (title deed, floor plan etc.)
  
  // Notes
  notes: String,

  createdAt: Date,
  updatedAt: Date
}
```

**Business rules:**
- `floorPrice` is internal only — never exposed in any buyer-facing API response
- `listedPrice` is what the matching engine compares against buyer's `budget`
- `block` is a primary price determinant — always required
- When `ownershipStatus` changes to `underNegotiation`, a Deal record must exist

---

### 4.3 Deal

The transaction connecting a buyer, seller, and property. Tracks the full money flow.

```javascript
{
  _id: ObjectId,

  // Core connections
  propertyId: ObjectId,          // ref: Property
  buyerLeadId: ObjectId,         // ref: Lead
  sellerLeadId: ObjectId,        // ref: Lead
  dealType: String,              // enum: ['brokerage','inflated','coInvestment'] — copied from Property at creation

  // Pipeline stage
  stage: String,                 // enum: ['negotiation','bayana','papers','closed','lost']
  lostReason: String,            // populated when stage = lost

  // Agreed price
  agreedPrice: Number,           // final price buyer will pay seller
  floorPrice: Number,            // copied and LOCKED from Property.floorPrice at deal creation
  margin: Number,                // auto-calculated: agreedPrice − floorPrice (inflation revenue)

  // Money flow — installments from buyer to seller
  payments: [
    {
      type: String,              // enum: ['token','bayana','partPayment','fullPayment']
      amount: Number,
      date: Date,
      notes: String              // e.g. "paid via cheque", "cash"
    }
  ],
  // Derived (auto-calculated from payments array):
  // totalPaid = sum of all payment amounts
  // remainingAmount = agreedPrice − totalPaid

  // Commission — separate from deal price
  commission: {
    agreedAmount: Number,        // what was decided with both parties
    actualAmount: Number,        // what Father actually received (often less)
    receivedDate: Date,          // when commission hit Father's hand
    notes: String,               // e.g. "they paid 18k instead of 20k, accepted"
    
    // If another agent is involved on Father's side
    splitWithAgentId: ObjectId,  // ref: Agent
    splitPercent: Number,        // Father's share percentage (e.g. 60 means Father gets 60%)
    myFinalAmount: Number        // auto-calculated: actualAmount × splitPercent / 100
                                 // THIS is the amount that flows to Wealth dashboard
  },

  // Agent tracking
  buyerAgentId: ObjectId,        // ref: Agent — who handled the buyer side
  sellerAgentId: ObjectId,       // ref: Agent — who handled the seller side

  // Risk
  riskLevel: String,             // enum: ['low','medium','high']
  riskNotes: String,             // free text — e.g. "buyer's own property not sold yet"

  // Key dates
  negotiationStartDate: Date,
  bayanaDate: Date,
  bayanaAmount: Number,          // snapshot of first committed payment
  papersDate: Date,
  closedDate: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Business rules:**
- `floorPrice` is copied from Property and locked — immutable after deal creation
- `margin` auto-recalculates if `agreedPrice` changes during negotiation
- `commission.myFinalAmount` triggers a Wealth income entry when `commission.receivedDate` is set
- `payments` array is append-only — never delete payment records
- When stage moves to `closed`, `Property.ownershipStatus` must update to `sold`
- `totalPaid` and `remainingAmount` are computed fields — never stored, always calculated

---

### 4.4 Investment

Properties Father has purchased — alone or with partners — to sell for profit.

```javascript
{
  _id: ObjectId,
  
  propertyId: ObjectId,          // ref: Property (Property.ownershipStatus = 'ownerOwned')

  // Purchase details
  purchasePrice: Number,         // total price paid
  mySharePercent: Number,        // Father's ownership percentage (100 if solo)
  myAmount: Number,              // auto-calculated: purchasePrice × mySharePercent / 100
  purchaseDate: Date,

  // Co-investors (array — one entry per partner)
  coInvestors: [
    {
      name: String,
      phone: String,
      amountInvested: Number,
      sharePercent: Number
    }
  ],

  // Running costs
  holdingCosts: Number,          // maintenance, tax, interest accumulated while holding

  // Exit
  targetSalePrice: Number,       // what Father wants to sell at
  actualSalePrice: Number,       // populated on sale
  saleDate: Date,

  // Profit (auto-calculated on sale)
  // grossProfit = (actualSalePrice × mySharePercent / 100) − myAmount
  // myProfit = grossProfit − (holdingCosts × mySharePercent / 100)
  myProfit: Number,              // stored on sale for historical record

  status: String,                // enum: ['holding','sold']

  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Business rules:**
- `myAmount` auto-calculates from `purchasePrice` and `mySharePercent`
- `myProfit` is calculated and stored when `status` changes to `sold`
- When `status` = `sold`, a Wealth income entry is created for `myProfit`
- `holdingCosts` is updated manually as costs accumulate

---

### 4.5 Agent

Anyone who brings or handles leads — internal staff or external collaborators.

```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  type: String,                  // enum: ['internal','external']
                                 // internal = system user with login
                                 // external = tracked record only, no login
  userId: ObjectId,              // ref: User — only for internal agents

  // Performance (auto-aggregated)
  totalDeals: Number,
  totalCommissionEarned: Number, // for internal agents
  totalCommissionPaid: Number,   // for external agents Father paid out

  notes: String,
  createdAt: Date
}
```

---

### 4.6 WealthEntry

Every financial event — income or expense — flows here. This is the wealth dashboard's data source.

```javascript
{
  _id: ObjectId,
  
  type: String,                  // enum: ['income','expense']
  category: String,              // enum: ['commission','investmentProfit','operationalCost','personalWithdrawal','other']
  amount: Number,
  date: Date,
  
  // Source reference (one of these will be populated)
  dealId: ObjectId,              // if income came from a deal commission
  investmentId: ObjectId,        // if income came from an investment sale
  
  description: String,           // human readable note
  createdAt: Date
}
```

**Automatic wealth entries:**
- Deal commission received → income entry (category: commission, linked to dealId)
- Investment sold → income entry (category: investmentProfit, linked to investmentId)
- Manual entries for expenses and other income

---

## 5. Matching Engine

The feature that delivers immediate daily value to Father.

**Trigger:** A new Property is added OR an existing Property becomes available.

**Query logic:**
```javascript
const matches = await Lead.find({
  leadType: 'buyer',
  status: { $nin: ['closed', 'lost'] },
  propertyType: property.propertyType,
  location: property.location,
  budget: { $gte: property.listedPrice * 0.85 }, // within 15% of listed price
  
  // Optional filters if present on lead
  ...(property.block !== 'NA' && { block: property.block }),
  ...(property.configuration && { configuration: property.configuration })
}).sort({ credibilityScore: -1, followUpDate: 1 });
```

**Result:** Ranked list of matching buyer leads shown immediately when a property is added.
Father can one-tap to log a call or set a follow-up from the match list.

---

## 6. Follow-up Engine

Runs on a daily schedule (cron) or on every dashboard load.

**Query:**
```javascript
const dueToday = await Lead.find({
  status: { $nin: ['closed', 'lost'] },
  followUpDate: { $lte: new Date() }
}).sort({ credibilityScore: -1, followUpDate: 1 });
```

**Dashboard alert:** Count of overdue follow-ups shown in header badge.
Father sees his follow-up list first thing every day.

**Follow-up cadence guidelines (suggested defaults, overridable):**
- Status = new/contacted → follow up in 3 days
- Status = interested → follow up in 7 days  
- Status = visit scheduled → follow up next day after visit
- Status = negotiation → follow up in 2 days
- Status = bayana → follow up weekly until papers
- "Not now" / deferred → follow up in 45 days

---

## 7. Application Phases

### Phase 1 — CRM Foundation (Build First)
- Lead CRUD with all fields
- Property CRUD with all fields
- Matching engine
- Follow-up engine + daily dashboard alert
- Basic Deal creation and stage tracking
- Payment installment logging on deals

### Phase 2 — Deal Intelligence
- Full commission tracking (agreed vs actual vs my final)
- Commission → WealthEntry auto-creation
- Risk flagging on deals
- Agent split tracking

### Phase 3 — Investment Tracker
- Investment CRUD
- Co-investor tracking
- Profit calculation on sale
- Investment → WealthEntry auto-creation

### Phase 4 — Wealth Dashboard
- WealthEntry list and manual creation
- Income vs expense summary
- Commission revenue over time
- Net position view

### Phase 5 — Social & Marketing
- Property listing with images
- Auto-post to WhatsApp Business API
- Instagram/Facebook integration
- Content scheduling

### Phase 6 — Website & Local SEO
- Public-facing Next.js website
- Property listings page (feeds from database)
- Hyperlocal SEO pages for Mohan Garden
- Google Business Profile integration

---

## 8. API Route Structure

```
/api/auth/...                    NextAuth routes

/api/leads
  GET    /                       list leads (with filters: status, leadType, followUpDue)
  POST   /                       create lead
  GET    /:id                    get lead detail
  PUT    /:id                    update lead
  PATCH  /:id/status             update pipeline stage only
  PATCH  /:id/followup           update followUpDate and followUpNotes
  GET    /due-today              leads with followUpDate <= today

/api/properties
  GET    /                       list properties (with filters: status, type, block)
  POST   /                       create property + trigger matching engine
  GET    /:id                    get property detail (floorPrice excluded for non-admin)
  PUT    /:id                    update property
  GET    /:id/matches            matching buyer leads for this property

/api/deals
  GET    /                       list deals (with filters: stage, dealType)
  POST   /                       create deal (locks floorPrice from property)
  GET    /:id                    get deal detail with payment summary
  PUT    /:id                    update deal
  PATCH  /:id/stage              update stage
  POST   /:id/payments           add payment installment
  PATCH  /:id/commission         update commission details (triggers wealth entry on receivedDate)

/api/investments
  GET    /                       list investments
  POST   /                       create investment
  GET    /:id                    get investment detail
  PUT    /:id                    update investment
  PATCH  /:id/sell               mark as sold (triggers wealth entry)

/api/wealth
  GET    /                       list wealth entries
  POST   /                       create manual entry
  GET    /summary                income vs expense summary + net position

/api/agents
  GET    /                       list agents
  POST   /                       create agent
  GET    /:id                    agent detail + deal history
```

---

## 9. Security Rules

- `floorPrice` on Property: never returned in API responses to role = `agent`
- All routes require authentication except `/api/auth/...`
- Role middleware: admin > operator > agent
- Operators cannot access `/api/wealth` summary (only admin)
- Agents can only read/update leads assigned to them

---

## 10. Key Computed Values

These are never stored — always calculated at query time or in the API response:

| Value | Formula |
|---|---|
| Lead age | today − lead.createdAt |
| Deal total paid | sum of deal.payments[].amount |
| Deal remaining | deal.agreedPrice − totalPaid |
| Deal margin | deal.agreedPrice − deal.floorPrice |
| Commission my final | deal.commission.actualAmount × deal.commission.splitPercent / 100 |
| Investment my amount | investment.purchasePrice × investment.mySharePercent / 100 |
| Investment my profit | (actualSalePrice × sharePercent/100) − myAmount − (holdingCosts × sharePercent/100) |
| Property holding days | today − investment.purchaseDate |

---

## 11. UI Screens by Role

### Operator (Father) — Daily View
1. **Dashboard** — follow-up alerts count, active deals count, today's tasks
2. **Follow-ups** — list of leads due today, sorted by credibility score
3. **Lead Detail** — full lead info, interaction history, set follow-up
4. **Properties** — list with status badges, add new property, see matches
5. **Property Detail** — all fields, matched leads, linked deal if active
6. **Deals** — kanban by stage, click to open deal
7. **Deal Detail** — payment timeline, commission tracker, risk flag
8. **Add Payment** — quick form to log installment on a deal

### Admin (Bhavya)
All of the above plus:
9. **Investments** — portfolio view, co-investors, profit tracker
10. **Wealth Dashboard** — income/expense timeline, commission summary
11. **Agents** — external agent directory, deal history per agent
12. **Analytics** — lead source breakdown, deal close rate, revenue by month

---

## 12. Design System Notes

- Mobile-first — Father uses phone in field, Bhavya uses desktop
- No heavy UI — fast load on mid-range Android is a requirement
- Language: English UI with Hindi support for notes fields (Unicode)
- Currency: always display in ₹ with Indian number formatting (lakhs/crores)
- Dates: DD/MM/YYYY format throughout
- Color coding for deal stages: 
  - negotiation = amber
  - bayana = blue  
  - papers = purple
  - closed = green
  - lost = red/muted

---

## 13. Open Questions (To Confirm With Father)

- [ ] What does Father consider the primary signal for buyer seriousness if not payment timeline?
- [ ] Are there property types beyond floor/office/rootFloor/fullBuilding/plot?
- [ ] Is commission ever charged to both buyer AND seller in the same deal?
- [ ] How are holding costs tracked currently for co-investments — receipts, rough estimate?
- [ ] Does Father want to track individual interactions (call log) or just the latest note?

---

*This file is the single source of truth for SK Properties application development.*
*Update this file before making any schema or logic changes.*
*Last updated: April 2026*
