require('dotenv').config()
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

const app = express()

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'))
app.use('/api/leads',       require('./routes/leads'))
app.use('/api/properties',  require('./routes/properties'))
app.use('/api/deals',       require('./routes/deals'))
app.use('/api/agents',      require('./routes/agents'))
app.use('/api/investments', require('./routes/investments'))
app.use('/api/wealth',      require('./routes/wealth'))
app.use('/api/dashboard',   require('./routes/dashboard'))

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found`, code: 404 })
})

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: err.message || 'Internal server error', code: 500 })
})

// ─── DB + START ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-properties')
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
