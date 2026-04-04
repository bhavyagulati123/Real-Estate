/**
 * Seed script — run once to set up initial data
 * Usage: node seed.js
 *
 * Creates:
 *   - 1 admin user (Bhavya)
 *   - 1 operator user (Father)
 *   - 2 sample agents
 *   - 3 sample leads (2 buyers, 1 seller)
 *   - 1 sample property
 */

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const Lead     = require('./models/Lead')
const Property = require('./models/Property')
const { Agent, User } = require('./models/index')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-properties')
  console.log('Connected to MongoDB')

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({}),
    Agent.deleteMany({}),
    Lead.deleteMany({}),
    Property.deleteMany({}),
  ])
  console.log('Cleared existing data')

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  const opPassword    = await bcrypt.hash('father123', 10)

  const [admin, operator] = await User.create([
    { name: 'Bhavya Gulati', phone: '+919999999999', password: adminPassword,  role: 'admin'    },
    { name: 'SK (Father)',   phone: '+919999999998', password: opPassword,     role: 'operator' },
  ])
  console.log('Created users:')
  console.log('  Admin    — phone: +919999999999  password: admin123')
  console.log('  Operator — phone: +919999999998  password: father123')

  // ── Agents ─────────────────────────────────────────────────────────────────
  const [agentRaj, agentSunil] = await Agent.create([
    { name: 'Raj Sharma',   phone: '+919811100001', type: 'external', totalDeals: 3, totalCommission: 75000 },
    { name: 'Sunil Verma',  phone: '+919811100002', type: 'external', totalDeals: 1, totalCommission: 25000 },
  ])
  console.log('Created 2 agents')

  // ── Leads ──────────────────────────────────────────────────────────────────
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 2)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const [buyer1, buyer2, seller1] = await Lead.create([
    {
      name:             'Rajesh Kumar',
      phone:            '+919811045231',
      leadType:         'buyer',
      source:           'call',
      budget:           4500000,
      location:         'Mohan Garden',
      block:            'C',
      propertyType:     'residential',
      configuration:    '2BHK',
      credibilityScore: 4,
      status:           'negotiation',
      followUpDate:     yesterday, // overdue — shows on dashboard
      followUpNotes:    'Interested in Block C, flexible on price',
      interactionHistory: [
        { note: 'First call — looking for 2BHK in Mohan Garden, Block C preferred. Budget around 45L.', stage: 'new', createdAt: new Date(Date.now() - 7 * 86400000) },
        { note: 'Showed 3 properties via photos. Most interested in Block C ground floor.', stage: 'interested', createdAt: new Date(Date.now() - 3 * 86400000) },
      ],
    },
    {
      name:             'Priya Malhotra',
      phone:            '+919899012345',
      leadType:         'buyer',
      source:           'whatsapp',
      budget:           6000000,
      location:         'Mohan Garden',
      block:            'A',
      propertyType:     'floor',
      credibilityScore: 3,
      status:           'interested',
      followUpDate:     tomorrow,
      sourceAgentId:    agentRaj._id,
      interactionHistory: [
        { note: 'Referred by Raj Sharma. Looking for full floor in Block A. Has ready money.', stage: 'new', createdAt: new Date(Date.now() - 2 * 86400000) },
      ],
    },
    {
      name:             'Mohit Agarwal',
      phone:            '+919711098765',
      leadType:         'seller',
      source:           'walkin',
      budget:           5500000, // minimum asking price
      location:         'Mohan Garden',
      block:            'C',
      propertyType:     'residential',
      configuration:    '2BHK',
      size:             100,
      buildingAge:      '8 years',
      credibilityScore: 5,
      status:           'interested',
      followUpDate:     nextWeek,
      interactionHistory: [
        { note: 'Walked in — wants to sell 2BHK in Block C. Building is clean, no legal issues. Floor price 50L, asking 55L.', stage: 'new', createdAt: new Date(Date.now() - 1 * 86400000) },
      ],
    },
  ])
  console.log('Created 3 leads (2 buyers, 1 seller)')

  // ── Property ───────────────────────────────────────────────────────────────
  await Property.create({
    title:               '2BHK Floor, Block C, Mohan Garden',
    location:            'Mohan Garden',
    block:               'C',
    propertyType:        'residential',
    configuration:       '2BHK',
    size:                100,
    buildingAge:         '8 years',
    buildingCredibility: 4,
    floorPrice:          5000000,
    askingPrice:         5500000,
    listedPrice:         5500000,
    dealType:            'brokerage',
    ownershipStatus:     'available',
    sellerId:            seller1._id,
    notes:               'Clean building, no legal issues. Seller flexible on price for quick deal.',
  })
  console.log('Created 1 property')

  console.log('\n✅ Seed complete. Start the server and login at http://localhost:3000/login')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
