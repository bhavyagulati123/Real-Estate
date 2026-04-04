const jwt = require('jsonwebtoken')

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided', code: 401 })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { _id, name, role }
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 401 })
  }
}

// ─── RBAC MIDDLEWARE ──────────────────────────────────────────────────────────
// Usage: requireRole('admin') or requireRole('admin', 'operator')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', code: 401 })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', code: 403 })
    }
    next()
  }
}

module.exports = { auth, requireRole }
