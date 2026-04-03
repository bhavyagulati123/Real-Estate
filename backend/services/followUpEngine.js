function splitFollowUps(leads) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return leads.reduce(
    (result, lead) => {
      if (!lead.followUpDate) return result

      const due = new Date(lead.followUpDate)
      due.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((due - today) / 86400000)

      if (diffDays < 0) result.overdue.push(lead)
      else if (diffDays === 0) result.dueToday.push(lead)
      else if (diffDays <= 2) result.upcoming.push(lead)

      return result
    },
    { overdue: [], dueToday: [], upcoming: [] }
  )
}

module.exports = {
  splitFollowUps
}
