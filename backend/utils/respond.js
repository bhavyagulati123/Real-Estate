function success(res, data, message = 'OK', extras = {}) {
  return res.json({
    success: true,
    data,
    message,
    ...extras
  })
}

function failure(res, status, error) {
  return res.status(status).json({
    success: false,
    error,
    code: status
  })
}

module.exports = {
  success,
  failure
}
