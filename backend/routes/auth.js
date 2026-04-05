const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { User } = require('../models/index')
const { auth } = require('../middleware/auth')

const router = express.Router()

function generateTokens(user) {
  const payload = { _id: user._id, name: user.name, role: user.role }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { token, refreshToken }
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  // secure: true — enable this in production (HTTPS only)
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
    res.cookie('sk_token', token, COOKIE_OPTS)
    res.cookie('sk_refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 })
    res.json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, role: user.role, phone: user.phone },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('sk_token',         { httpOnly: true, sameSite: 'lax' })
  res.clearCookie('sk_refresh_token', { httpOnly: true, sameSite: 'lax' })
  res.json({ success: true })
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.sk_refresh_token
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required', code: 400 })
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded._id)
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found', code: 401 })
    }
    const { token } = generateTokens(user)
    res.cookie('sk_token', token, COOKIE_OPTS)
    res.json({ success: true })
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token', code: 401 })
  }
})

// PATCH /api/auth/me — update own profile / change password
router.patch('/me', auth, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 404 })

    if (name) user.name = name.trim()

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password required', code: 400 })
      }
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect', code: 401 })
      }
      user.password = await bcrypt.hash(newPassword, 10)
    }

    await user.save()
    // Re-issue token so updated name is in the JWT
    const { token } = generateTokens(user)
    res.cookie('sk_token', token, COOKIE_OPTS)
    res.json({ success: true, data: { _id: user._id, name: user.name, role: user.role, phone: user.phone } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
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
