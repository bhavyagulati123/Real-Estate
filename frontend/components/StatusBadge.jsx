const styles = {
  new: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-50 text-blue-700',
  interested: 'bg-blue-50 text-blue-700',
  visit: 'bg-amber-50 text-amber-700',
  negotiation: 'bg-purple-50 text-purple-700',
  bayana: 'bg-orange-50 text-orange-700',
  papers: 'bg-indigo-50 text-indigo-700',
  closed: 'bg-green-50 text-green-700',
  lost: 'bg-gray-100 text-gray-400'
}

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.new}`}>
      {status}
    </span>
  )
}
