'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <p className="text-2xl font-semibold text-zinc-900 mb-2">Something went wrong</p>
        <p className="text-sm text-zinc-500 mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
