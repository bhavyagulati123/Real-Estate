const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')

const dashboardRoutes = require('./routes/dashboard')
const dealsRoutes = require('./routes/deals')
const investmentsRoutes = require('./routes/investments')
const leadsRoutes = require('./routes/leads')
const propertiesRoutes = require('./routes/properties')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'API healthy' })
})

app.use('/api/dashboard', dashboardRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/properties', propertiesRoutes)
app.use('/api/deals', dealsRoutes)
app.use('/api/investments', investmentsRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 404 })
})

app.listen(port, () => {
  console.log(`SK Properties backend listening on port ${port}`)
})
