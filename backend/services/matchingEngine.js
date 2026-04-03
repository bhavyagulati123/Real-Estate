function buildMatchingQuery(property) {
  const query = {
    leadType: 'buyer',
    status: { $nin: ['closed', 'lost'] },
    isDeleted: false,
    location: property.location,
    propertyType: property.propertyType
  }

  if (property.floorPrice) {
    query.budget = { $gte: Math.round(property.floorPrice * 0.9) }
  }

  if (property.configuration && property.configuration !== 'NA') {
    query.configuration = property.configuration
  }

  if (property.block) {
    query.$or = [{ block: property.block }, { block: { $exists: false } }, { block: null }]
  }

  return query
}

module.exports = {
  buildMatchingQuery
}
