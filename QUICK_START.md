# SK Properties CRM - Quick Start Guide

## 📋 Pre-requisites

- Node.js 18+
- MongoDB (local or Atlas connection string)
- npm or yarn

---

## ⚡ Quick Start (5 minutes)

### Step 1: Start Backend

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
✓ Server running on http://localhost:5000
✓ API ready at http://localhost:5000/api
```

### Step 2: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
> next dev
  ▲ Next.js 14.0.0

  ⬡ Local:        http://localhost:3000
  ⬡ Environments: .env.local

✓ Ready in 1234ms
```

### Step 3: Open in Browser

Navigate to: **http://localhost:3000**

---

## 🗄️ Database Setup

### Option A: Local MongoDB

```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod
```

### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sk-properties
```

---

## 🎯 First Actions

1. **Add a Lead**
   - Click "+ New Lead" on Dashboard
   - Fill form: Name, Phone, Type (Buyer/Seller), Status
   - Set Follow-up Date
   - Save

2. **Add a Property**
   - Go to Properties → "+ New Property"
   - Fill form: Title, Location, Block, Type, Pricing
   - Save

3. **View Matching Buyers**
   - On Property detail page
   - See "Matching Buyers" section
   - Auto-filtered by budget, location, type

4. **Check Dashboard**
   - Overdue follow-ups shown in RED
   - Upcoming shown in YELLOW
   - Click any to view/edit lead

---

## 🔌 API Endpoints

### Leads
- `GET /api/leads` - List all leads
- `GET /api/leads?status=new` - Filter by status
- `GET /api/leads?searchOverdue=true` - Get overdue follow-ups
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get one lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (soft)

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties?block=C` - Filter by block
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get one property
- `GET /api/properties/:id/matches` - Get matching buyers
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property (soft)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot connect to MongoDB` | Check MongoDB is running on port 27017, or update MONGODB_URI in .env |
| `Port 5000 already in use` | Change PORT in backend/.env |
| `Port 3000 already in use` | Run `npm run dev -- -p 3001` in frontend |
| `API calls fail` | Check backend is running on 5000, CORS enabled |
| `Module not found` | Delete `node_modules/`, run `npm install` again |

---

## 📁 Important Files

```
backend/
  .env                    ← MongoDB URI + PORT
  package.json            ← Dependencies
  index.js                ← Start here to understand server
  models/Lead.js          ← Lead schema (core business logic)
  models/Property.js      ← Property schema
  routes/leads.js         ← Lead API endpoints
  routes/properties.js    ← Property API endpoints

frontend/
  app/page.jsx            ← Dashboard (start here)
  app/leads/              ← Lead management pages
  app/properties/         ← Property management pages
  stores/useStore.js      ← Zustand state management
  lib/axios.js            ← API configuration
```

---

## 📞 Key Features Explained

### Follow-up Engine
- Dashboard shows leads that need follow-up today
- Overdue follow-ups highlighted in RED
- Upcoming this week in YELLOW
- Click to view/edit lead details

### Lead Pipeline
Status flow: new → contacted → interested → visit → negotiation → bayana → papers → closed/lost

Each status transition is tracked with timestamps in stageHistory.

### Property Matching
When you add a property, the system automatically suggests matching buyers based on:
- Budget: buyer's budget ≥ property's floor price × 90%
- Location: exact match
- Property Type: exact match
- Configuration: exact match (if applicable)

### Three Revenue Models
Property dealType must be set to one of:
- **brokerage**: Commission-based deal (1% typical)
- **inflated**: Price spread model (margin = listedPrice - floorPrice)
- **coInvestment**: Father purchases property outright

---

## 🎓 Understanding the Business

**SK Properties Context:**
- Local brokerage in Mohan Garden, Delhi
- Run by experienced broker ("Father/Operator")
- 15 years of local goodwill
- System replaces notebook and memory
- Tracks every rupee and lead interaction

**Three Deal Types:**
1. **Pure Brokerage**: Connect buyer ↔ seller, earn 1% commission
2. **Price Inflation**: Buy at low price, list high, keep spread as margin
3. **Co-Investment**: Own property with partners, split profits by share %

---

## 📈 Next: Phase 2

After getting comfortable with Phase 1, implement:

1. **Deal Management**: Track negotiations, payments, stages
2. **Commission Tracking**: Calculate actual vs expected, track leakage
3. **Investment Dashboard**: View all holdings, calculate returns
4. **Social Integration**: Post listings to WhatsApp/Instagram
5. **Public Website**: SEO listing site for Mohan Garden

---

## 💡 Tips

- Always set a **Follow-up Date** on every lead (system alerts on this)
- Use **Credibility Score** (1-5) as primary qualification signal
- Add **notes** to capture Father's "gut feeling" context
- **Soft deletes** keep all data - can restore if needed
- **Buyer-Property Matching** is automatic - check matching buyers on property detail
- **Block pricing** varies significantly - use Block filter often

---

## 🚀 You're Ready!

Start with adding a few test leads and properties. The system will auto-suggest matches.

For production deployment:
- Backend → Railway, Render, or Heroku
- Frontend → Vercel (free tier available)
- Database → MongoDB Atlas (free tier available)

Happy selling! 🏡
