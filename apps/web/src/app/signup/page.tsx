'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function SignupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [step, setStep] = useState<'details' | 'verification'>('details')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [handle, setHandle] = useState(searchParams.get('handle') || '')
    const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [otp, setOtp] = useState('')

    // Debounce check
    const checkHandleAvailability = async (val: string) => {
        setHandleStatus('checking')
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/check-handle?handle=${val}`)
            const data = await res.json()
            if (data.available) {
                setHandleStatus('available')
                setSuggestions([])
            } else {
                setHandleStatus('taken')
                setSuggestions(data.suggestions || [])
            }
        } catch (err) {
            console.error('Failed to check handle:', err)
            setHandleStatus('idle')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, handle: handle || undefined }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Signup failed')
            }

            // Move to verification step
            setStep('verification')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyParams = async (token: string) => {
        // Check for plan and interval
        const plan = searchParams.get('plan')
        const interval = searchParams.get('interval')

        // Store token
        localStorage.setItem('token', token)

        if (plan && interval) {
            router.push(`/checkout/init?plan=${plan}&interval=${interval}`)
        } else {
            router.push('/dashboard')
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed')
            }

            // Success
            await handleVerifyParams(data.access_token)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
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
                <h1 className="text-2xl font-bold text-center mb-2">
                    {step === 'details' ? 'Create your account' : 'Verify your email'}
                </h1>
                <p className="text-text-secondary text-center text-sm mb-8">
                    {step === 'details'
                        ? 'Start verifying your content in minutes.'
                        : `We sent an 8-digit code to ${email}`}
                </p>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {step === 'details' && (
                    <>
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
                            Sign up with Google
                        </button>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-surface text-text-muted">Or sign up with email</span>
                            </div>
                        </div>
                    </>
                )}

                {step === 'details' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Handle field */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                Creator Handle
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                                    antiai.me/
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={handle}
                                    onChange={(e) => {
                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                                        setHandle(val)
                                        // Trigger check if length > 2
                                        if (val.length > 2) checkHandleAvailability(val)
                                        else setHandleStatus('idle')
                                    }}
                                    placeholder="yourname"
                                    className={`w-full pl-[90px] pr-10 py-2.5 bg-surface-light border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all font-medium ${handleStatus === 'available' ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/50' :
                                        handleStatus === 'taken' ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' :
                                            'border-white/5 focus:border-primary/50 focus:ring-primary/50'
                                        }`}
                                />
                                {/* Status Icon */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {handleStatus === 'checking' && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                                    {handleStatus === 'available' && (
                                        <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {handleStatus === 'taken' && (
                                        <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Suggestions */}
                            {handleStatus === 'taken' && suggestions.length > 0 && (
                                <div className="mt-2 text-sm">
                                    <p className="text-red-400 mb-1">Handle is already taken. Try one of these:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => {
                                                    setHandle(s)
                                                    setHandleStatus('available')
                                                    setSuggestions([])
                                                }}
                                                className="px-2 py-1 bg-surface border border-white/10 rounded text-text-secondary hover:text-primary hover:border-primary/50 transition-colors text-xs"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {handleStatus === 'available' && (
                                <p className="mt-1 text-xs text-green-500">Handle is available!</p>
                            )}
                        </div>

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
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || handleStatus === 'taken' || handleStatus === 'checking'}
                            className="w-full btn-primary py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mx-auto" />
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={8}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center tracking-widest text-xl"
                                placeholder="12345678"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mx-auto" />
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('details')}
                            className="w-full text-sm text-text-secondary hover:text-primary transition-colors"
                        >
                            Back to details
                        </button>
                    </form>
                )}

                {step === 'details' && (
                    <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-text-secondary">
                        Already have an account?{' '}
                        <Link href={`/login?${searchParams.toString()}`} className="text-primary hover:text-primary-400 font-medium transition-colors">
                            Log in
                        </Link>
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-text-muted mt-8">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="hover:text-text-primary underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="hover:text-text-primary underline">Privacy Policy</Link>
            </p>
        </div>
    )
}

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />
            <div className="absolute inset-0 bg-grid opacity-20" />

            <Suspense fallback={<div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin z-10 mx-auto" />}>
                <SignupContent />
            </Suspense>
        </div>
    )
}
