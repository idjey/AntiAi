'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface BillingStatus {
    plan: 'free' | 'pro' | 'elite'
    status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
    current_period_end: string | null
    videos_used: number
    videos_limit: number
}

const PLANS = {
    free: {
        name: 'Free',
        prices: { month: '$0', year: '$0' },
        features: ['10 videos/month', 'Basic support', 'Standard verification'],
        limit: 10
    },
    pro: {
        name: 'Pro',
        prices: { month: '$29.99', year: '$329.89' },
        features: ['100 videos/month', 'Priority support', 'Advanced verification'],
        limit: 100
    },
    elite: {
        name: 'Elite',
        prices: { month: '$99.99', year: '$1,099.89' },
        features: ['Unlimited videos', '24/7 Support', 'Custom verification'],
        limit: Infinity
    }
}

export default function BillingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<BillingStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [error, setError] = useState('')
    const [interval, setInterval] = useState<'month' | 'year'>('month')

    useEffect(() => {
        fetchStatus()

        if (searchParams.get('success')) {
            // clear params
            router.replace('/dashboard/billing')
        }
    }, [])

    const fetchStatus = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch billing status')
            const data = await res.json()
            setStatus(data)
        } catch (err) {
            console.error(err)
            setError('Failed to load billing information')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpgrade = async (plan: 'pro' | 'elite') => {
        setIsActionLoading(true)
        setError('')
        const token = localStorage.getItem('token')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan,
                    interval,
                    success_url: `${window.location.origin}/dashboard/billing?success=true`,
                    cancel_url: `${window.location.origin}/dashboard/billing?canceled=true`,
                })
            })

            const data = await res.json()
            if (data.checkout_url) {
                window.location.href = data.checkout_url
            } else {
                throw new Error('Failed to start checkout')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to start checkout')
            setIsActionLoading(false)
        }
    }

    const handleManageSubscription = async () => {
        setIsActionLoading(true)
        setError('')
        const token = localStorage.getItem('token')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    return_url: `${window.location.origin}/dashboard/billing`,
                })
            })

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('Failed to open billing portal')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to open billing portal')
            setIsActionLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    const currentPlan = status?.plan || 'free'
    const usagePercent = status ? Math.min((status.videos_used / status.videos_limit) * 100, 100) : 0

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Billing & Subscription</h1>
                    <p className="text-text-secondary">Manage your plan and usage limits.</p>
                </div>
                {currentPlan !== 'free' && (
                    <button
                        onClick={handleManageSubscription}
                        disabled={isActionLoading}
                        className="btn-secondary"
                    >
                        Manage Subscription
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Usage Stats */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Current Usage</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Videos Protected</span>
                        <span className="font-medium">
                            {status?.videos_used} / {status?.videos_limit === Infinity ? 'Unlimited' : status?.videos_limit}
                        </span>
                    </div>
                    {status?.videos_limit !== Infinity && (
                        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                    )}
                    <p className="text-xs text-text-muted">
                        Resets on {status?.current_period_end ? new Date(status.current_period_end).toLocaleDateString() : 'next billing cycle'}
                    </p>
                </div>
            </div>

            {/* Billing Interval Toggle */}
            <div className="flex justify-center mt-12 mb-8">
                <div className="bg-surface-light p-1 rounded-lg flex items-center relative">
                    <button
                        onClick={() => setInterval('month')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${interval === 'month'
                            ? 'bg-surface text-white shadow-sm'
                            : 'text-text-secondary hover:text-white'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setInterval('year')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${interval === 'year'
                            ? 'bg-surface text-white shadow-sm'
                            : 'text-text-secondary hover:text-white'
                            }`}
                    >
                        Yearly
                        <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            1 Month Free
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
                    const plan = PLANS[planKey]
                    const isCurrent = currentPlan === planKey
                    const price = plan.prices[interval]

                    return (
                        <div key={planKey} className={`card p-6 flex flex-col relative ${isCurrent ? 'border-primary ring-1 ring-primary/50' : ''}`}>
                            {isCurrent && (
                                <div className="absolute top-0 right-0 bg-primary text-background text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                    CURRENT PLAN
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="text-3xl font-bold mb-1">
                                {price}
                                <span className="text-sm font-normal text-text-secondary">/{interval}</span>
                            </div>
                            {interval === 'year' && planKey !== 'free' && (
                                <div className="text-xs text-green-400 font-medium mb-6">
                                    Save ~9% with yearly
                                </div>
                            )}
                            {interval === 'month' || planKey === 'free' ? (
                                <div className="mb-6 h-4" />
                            ) : null}

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(planKey as 'pro' | 'elite')}
                                disabled={isCurrent || isActionLoading}
                                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${isCurrent
                                    ? 'bg-surface-light text-text-muted cursor-default'
                                    : 'btn-primary'
                                    }`}
                            >
                                {isCurrent ? 'Active' : `Upgrade to ${plan.name}`}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

