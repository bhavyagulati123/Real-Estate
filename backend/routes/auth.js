const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { User } = require('../models/index')

const router = express.Router()

function generateTokens(user) {
  const payload = { _id: user._id, name: user.name, role: user.role }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { token, refreshToken }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Phone and password required', code: 400 })
    }

    const user = await User.findOne({ phone })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', code: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', code: 401 })
    }

    const { token, refreshToken } = generateTokens(user)
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: { _id: user._id, name: user.name, role: user.role, phone: user.phone },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required', code: 400 })
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded._id)
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found', code: 401 })
    }
    const { token } = generateTokens(user)
    res.json({ success: true, data: { token } })
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token', code: 401 })
  }
})

// POST /api/auth/register  (admin only — for first setup)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role } = req.body
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Name, phone and password required', code: 400 })
    }
    const exists = await User.findOne({ phone })
    if (exists) {
      return res.status(409).json({ success: false, error: 'Phone already registered', code: 409 })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, phone, password: hashed, role: role || 'operator' })
    const { token, refreshToken } = generateTokens(user)
    res.status(201).json({
      success: true,
      data: { token, refreshToken, user: { _id: user._id, name: user.name, role: user.role } },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
