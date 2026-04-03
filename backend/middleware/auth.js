function auth(req, res, next) {
  req.user = {
    id: 'demo-user',
    role: 'admin'
  }

  next()
}

module.exports = {
  auth
}
