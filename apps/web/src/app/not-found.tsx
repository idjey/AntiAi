import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h2 className="text-3xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-text-secondary mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="btn-primary px-6 py-2">
        Return Home
      </Link>
    </div>
  )
}
