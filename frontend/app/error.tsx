'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function GlobalError({
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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl font-bold text-zinc-900 mb-2">Error</p>
        <p className="text-sm text-zinc-500 mb-6">
          {error.message || 'Something went wrong. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
