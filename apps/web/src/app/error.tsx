'use client'

import { useEffect } from 'react'

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-text-secondary mb-8">We apologize for the inconvenience.</p>
      <button
        className="btn-primary px-6 py-2"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}
