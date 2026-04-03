const { failure } = require('../utils/respond')

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return failure(res, 403, 'Forbidden')
    }

    next()
  }
}

module.exports = {
  requireRole
}
