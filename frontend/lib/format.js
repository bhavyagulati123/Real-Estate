export function formatRupees(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '—'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatShortDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}

export function toInputDate(value) {
  if (!value) return ''
  return new Date(value).toISOString().split('T')[0]
}

export function getFollowUpStatus(followUpDate) {
  if (!followUpDate) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const due = new Date(followUpDate)
  due.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((due - now) / 86400000)

  if (diffDays < 0) {
    return {
      type: 'overdue',
      label: `Overdue ${Math.abs(diffDays)} day(s)`,
      className: 'bg-red-50 text-red-700'
    }
  }

  if (diffDays === 0) {
    return {
      type: 'today',
      label: 'Due today',
      className: 'bg-amber-50 text-amber-700'
    }
  }

  if (diffDays <= 2) {
    return {
      type: 'soon',
      label: `Due in ${diffDays} day(s)`,
      className: 'bg-blue-50 text-blue-700'
    }
  }

  return null
}
