
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (!email) {
            setError('Please Enter Email')
            setIsLoading(false)
            return
        }

        if (!password) {
            setError('Enter Password')
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Login failed')
            }

            const data = await res.json()

            // Verify if user is actually an admin before proceeding
            const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            })

            if (meRes.ok) {
                const userData = await meRes.json()
                if (userData.role !== 'admin') {
                    throw new Error('Access denied: Admin privileges required')
                }
            }

            localStorage.setItem('token', data.access_token)
            router.push('/admin')
        } catch (err: any) {
            setError(err.message)
            localStorage.removeItem('token') // Clear any potentially invalid tokens
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="text-xl font-bold tracking-tight">
                        antiai<span className="text-red-500">.admin</span>
                    </span>
                </div>

                <div className="bg-surface border border-white/10 rounded-xl p-6 shadow-xl">
                    <h1 className="text-xl font-bold text-center mb-6">Admin Console</h1>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-surface-light border border-white/5 rounded-lg text-text-primary focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-surface-light border border-white/5 rounded-lg text-text-primary focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-mono text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Authenticate'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                            &larr; Return to main site
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
