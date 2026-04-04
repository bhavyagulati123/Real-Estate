# SK Properties - Real Estate CRM System

A comprehensive CRM system for SK Properties, a local property brokerage in Mohan Garden, Delhi. Built to replace the notebook-based workflow with a digital system that tracks leads, properties, deals, and investments.

## 🎯 System Features

### Phase 1 (Implemented)
- **Lead Management**: Create, edit, and manage buyer/seller leads with full contact details
- **Lead Filtering**: Filter by status, lead type, credibility score, and follow-up dates
- **Follow-up Engine**: Dashboard showing overdue and upcoming follow-ups
- **Property Management**: Add and manage property listings with full pricing details
- **Property Matching**: Automatic matching of buyers to properties based on budget, location, type
- **Dashboard**: Real-time view of all pending follow-ups, overdue alerts

### Phase 2-5 (Architecture Ready)
- Deal Pipeline & Payment Tracking
- Investment Tracking
- Social Media Integration  
- Public Website & SEO

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| State Management | Zustand |
| API Communication | Axios |

---

## 📁 Project Structure

```
Real Estate/
├── backend/
│   ├── models/           # MongoDB schemas (Lead, Property, Deal, Agent, Investment, WealthEntry)
│   ├── routes/           # API endpoints (leads, properties)
│   ├── controllers/       # Business logic (leadController, propertyController)
│   ├── config/           # Database config
│   ├── index.js          # Express server entry point
│   ├── package.json
│   ├── .env              # Environment variables
│   └── .gitignore
├── frontend/
│   ├── app/              # Next.js app router (pages and layouts)
│   ├── components/       # Reusable React components (Navigation)
│   ├── stores/           # Zustand state management
│   ├── lib/              # Utilities (axios config)
│   ├── globals.css       # Tailwind styles
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .gitignore
└── SKILL (1).md          # Complete business reference document
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or connection string ready
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Update .env file**
```env
MONGODB_URI=mongodb://localhost:27017/sk-properties
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. **Start the server**
```bash
npm run dev
```
Server runs on `http://localhost:5000`

API endpoints:
- `GET /api/leads` - Get all leads with filters
- `POST /api/leads` - Create a new lead
- `PUT /api/leads/:id` - Update a lead
- `DELETE /api/leads/:id` - Delete a lead (soft delete)
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create a new property
- `PUT /api/properties/:id` - Update a property
- `DELETE /api/properties/:id` - Delete a property
- `GET /api/properties/:propertyId/matches` - Get matching buyers for a property

---

### Frontend Setup

1. **Navigate to frontend folder (in a new terminal)**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```
Application runs on `http://localhost:3000`

---

## 📖 Database Schemas

### Lead (Buyer/Seller)
- Identity: name, phone, source, leadType
- Preferences: budget, location, block, propertyType, configuration, size
- Qualification: credibilityScore
- Pipeline: status (new → contacted → interested → visit → negotiation → bayana → papers → closed/lost)
- Follow-up: followUpDate, followUpNotes
- Timestamps: createdAt, updatedAt

### Property
- Details: title, location, block, propertyType, configuration, size, buildingAge
- Pricing: floorPrice (seller minimum), askingPrice, listedPrice
- Deal: dealType (brokerage/inflated/coInvestment), ownershipStatus
- Relations: sellerId (Lead), sourceAgentId (Agent)

### Deal
- Core: propertyId, buyerLeadId, sellerLeadId, dealType
- Pipeline: stage (negotiation → bayana → papers → closed/lost), stageHistory
- Money: agreedPrice, floorPrice, margin, commissionRate
- Payments: Full payment flow tracking (token → bayana → partPayment → fullPayment → commission)
- Risk tracking and notes

### Investment
- Property ownership: propertyId, purchasePrice, purchaseDate
- Ownership: mySharePercent, myAmount, coInvestors
- Costs: holdingCosts (maintenance, tax, loan interest)
- Returns: targetSalePrice, actualSalePrice, myProfit (auto-calculated)

---

## 🎨 Frontend Features

### Dashboard (`/`)
- Real-time follow-up alerts: overdue (Red) and upcoming (Yellow)
- Quick action buttons to add leads/properties

### Leads Management (`/leads`)
- **List View**: All leads with filters (status, type, credibility score)
- **Add Lead**: Create new lead with comprehensive form
- **Lead Detail**: View/update individual lead with interaction history
- **Filters**: Status, Lead Type, Credibility Score
- **Follow-up Engine**: Highlights overdue follow-ups on dashboard

### Properties Management (`/properties`)
- **List View**: All properties with filters (status, block, type, deal type)
- **Add Property**: Create new property with pricing details
- **Property Detail**: View matching buyers, pricing breakdown, notes
- **Matching Buyers**: Auto-populated list of buyers matching this property
- **Pricing Display**: Floor price, asking price, listed price, and margin

---

## 📋 Business Rules Enforced

1. **Follow-up Required**: Every lead must have followUpDate set before status moves past 'contacted'
2. **Price Lock**: floorPrice on Deal is locked at creation - cannot be modified
3. **Deal Uniqueness**: Property under negotiation cannot link to multiple deals
4. **Payment Verification**: WealthEntry created only when payment.verified = true
5. **Soft Deletes**: All deletions are soft (isDeleted flag, not permanent)
6. **Integer Pricing**: All rupee amounts stored as integers (no decimals)

---

## 🧪 API Examples

### Create a Lead
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "source": "call",
    "leadType": "buyer",
    "budget": 5000000,
    "location": "Mohan Garden",
    "block": "C",
    "propertyType": "residential",
    "configuration": "2BHK",
    "credibilityScore": 4,
    "status": "contacted",
    "followUpDate": "2026-04-10",
    "followUpNotes": "Call on Thursday about 2BHK"
  }'
```

### Create a Property
```bash
curl -X POST http://localhost:5000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2BHK Floor, Block C, Mohan Garden",
    "location": "Mohan Garden",
    "block": "C",
    "propertyType": "floor",
    "configuration": "2BHK",
    "size": 1200,
    "floorPrice": 4500000,
    "listedPrice": 5000000,
    "dealType": "inflated",
    "ownershipStatus": "available"
  }'
```

### Get Matching Buyers
```bash
curl http://localhost:5000/api/properties/PROPERTY_ID/matches
```

---

## 📝 Notes

- **MongoDB**: Make sure MongoDB is running. For local development, use MongoDB Community or Atlas connection string
- **CORS**: Backend configured to accept requests from frontend URL
- **Next.js App Router**: Modern routing with dynamic segments `[id]` for detail pages
- **Zustand**: Lightweight state management for lead and property stores
- **Soft Deletes**: All data marked as deleted but never permanently removed from database

---

## 🔧 Troubleshooting

### Backend won't connect to MongoDB
- Check MongoDB is running: `mongod`
- Verify connection string in `.env`
- Check MongoDB port (default 27017)

### Frontend can't reach API
- Backend must be running on port 5000
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_API_URL` env variable

### Ports already in use
- Backend: Change PORT in `.env`
- Frontend: Use `npm run dev -- -p 3001`

---

## 📚 Next Steps

After Phase 1, implement:

1. **Phase 2**: Deal Pipeline - Full payment flow tracking, stage changes, commission management
2. **Phase 3**: Investment Tracker - Track holdings, calculate returns
3. **Phase 4**: Social Media - Schedule WhatsApp/Instagram posts
4. **Phase 5**: Public Website - SEO-optimized listings for Mohan Garden

---

## 👤 Author

**Bhavya Gulati**

---

## 📅 Version

**v1.0.0** - Phase 1 (CRM Foundation)

---

## 💡 Key Business Insights

- **Three Revenue Models**: Brokerage, Price Inflation, Co-Investment (all tracked separately)
- **Credibility Score**: Father's gut feeling (1-5) is primary qualification signal
- **Margin Calculation**: listedPrice - floorPrice = Father's spread on inflated deals
- **Follow-up Engine**: Daily alerts for overdue and upcoming follow-ups replace notebook
- **Payment Tracking**: Full transparency on every rupee movement in a deal
- **Co-investor Management**: Support for shared ownership with profit splits
