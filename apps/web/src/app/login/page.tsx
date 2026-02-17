'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const registered = searchParams.get('registered')

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
            // Store JWT in cookie or local storage (MVP uses simple storage for now, ideal is httpOnly cookie)
            localStorage.setItem('token', data.access_token)

            // Check for plan and interval
            const plan = searchParams.get('plan')
            const interval = searchParams.get('interval')

            if (plan && interval) {
                router.push(`/checkout/init?plan=${plan}&interval=${interval}`)
            } else {
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />
            <div className="absolute inset-0 bg-grid opacity-20" />

            <div className="w-full max-w-md relative z-10">
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        antiai<span className="text-primary">.me</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-card backdrop-blur-sm">
                    <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
                    <p className="text-text-secondary text-center text-sm mb-8">
                        Log in to manage your verification.
                    </p>

                    {registered && (
                        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm text-center">
                            Account created successfully! Please log in.
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/google`}
                        className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2.5 rounded-lg hover:bg-gray-100 transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface text-text-muted">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-text-secondary">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-400 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-2.5 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                'Log in'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-text-secondary">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary hover:text-primary-400 font-medium transition-colors">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
