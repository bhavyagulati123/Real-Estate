export function Avatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-blue-50 font-medium text-blue-700`}
    >
      {initials}
    </div>
  )
}
