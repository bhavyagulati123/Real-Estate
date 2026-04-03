function buildCommissionWealthEntry({ dealId, amount, description, date }) {
  return {
    type: 'income',
    category: 'commission',
    amount,
    date: date || new Date(),
    dealId,
    description
  }
}

module.exports = {
  buildCommissionWealthEntry
}
