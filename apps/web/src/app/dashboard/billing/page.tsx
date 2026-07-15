'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Modal from '../../../components/Modal'

interface BillingStatus {
    plan: 'free' | 'pro' | 'business' | 'elite'
    interval: 'month' | 'year'
    status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
    current_period_end: string | null
    videos_used: number
    videos_limit: number | null // Infinity becomes null in JSON
    cancel_at_period_end?: boolean
}

const PLANS = {
    free: {
        name: 'Free',
        prices: { month: '$0', year: '$0' },
        savings: null,
        features: [
            'View cryptographic badges on verified videos',
            '5 verified videos per month',
            'Public creator profile page',
            '1 shop product',
            'Basic colour themes'
        ],
        limit: 5
    },
    pro: {
        name: 'Pro',
        prices: { month: '$24.99', year: '$239.88' },
        savings: '$60.00',
        features: [
            'Cryptographic proof badge on every video',
            '100 verified videos per month',
            'Tamper-proof Ed25519 digital signature',
            'Public verification URL for every video',
            'Analytics dashboard',
            'Unlimited shop products',
            'Custom backgrounds & effects',
            'Change your @handle',
            'Email support'
        ],
        limit: 100
    },
    business: {
        name: 'Business',
        prices: { month: '$49.99', year: '$479.88' },
        savings: '$120.00',
        features: [
            'Everything in Pro',
            '500 verified videos per month',
            'Live Proof challenges (liveness verification)',
            'Custom domain for your creator profile',
            'API access (10,000 calls/month)',
            'Priority email support'
        ],
        limit: 500
    },
    elite: {
        name: 'Elite',
        prices: { month: '$99.99', year: '$959.88' },
        savings: '$240.00',
        features: [
            'Everything in Business',
            'Unlimited verified videos',
            'Unlimited API calls',
            'White-label badge (hide AntiAI.me branding)',
            'Transparency log export (CSV)',
            'Featured in creator directory',
            'Dedicated support'
        ],
        limit: Infinity
    }
}

import { Suspense } from 'react'

function BillingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<BillingStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [error, setError] = useState('')
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

    useEffect(() => {
        fetchStatus()

        const isSuccess = searchParams.get('success')
        const sessionId = searchParams.get('session_id')

        if (isSuccess) {
            if (sessionId) {
                // Verify checkout session manually since webhooks might not work locally
                verifyCheckout(sessionId)
            } else {
                startPollingStatus()
            }
        }
    }, [searchParams])

    const startPollingStatus = () => {
        const startTime = Date.now()
        const pollId = setInterval(() => {
            if (Date.now() - startTime > 15000) {
                clearInterval(pollId)
                router.replace('/dashboard/billing')
            } else {
                fetchStatus()
            }
        }, 2000)

        return () => clearInterval(pollId)
    }

    const verifyCheckout = async (sessionId: string) => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ session_id: sessionId })
            })

            if (res.ok) {
                await fetchStatus()
                router.replace('/dashboard/billing')
            } else {
                // Fallback to polling
                startPollingStatus()
            }
        } catch (err) {
            console.error('Failed to verify checkout:', err)
            startPollingStatus()
        }
    }

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

    const handleUpgrade = async (plan: 'pro' | 'business' | 'elite') => {
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
                    interval: billingInterval,
                    success_url: `${window.location.origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${window.location.origin}/dashboard/billing?canceled=true`,
                })
            })

            const data = await res.json()
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to start checkout')
            }

            if (data.checkout_url || data.url) {
                window.location.href = data.checkout_url || data.url
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

    const handleCancelClick = () => {
        setIsCancelModalOpen(true)
    }

    const confirmCancellation = async () => {
        setIsActionLoading(true)
        setError('')
        const token = localStorage.getItem('token')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await res.json().catch(() => null)

            if (!res.ok) {
                throw new Error(data?.message || 'Failed to cancel subscription')
            }

            // Refresh status
            await fetchStatus()
            // Close modal only on success
            setIsCancelModalOpen(false)
            alert('Your subscription has been canceled and will end after the current billing period.')
        } catch (err: any) {
            setError(err.message || 'Failed to cancel subscription')
            setIsCancelModalOpen(false)
        } finally {
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
    const currentInterval = status?.interval || 'month'
    const usagePercent = status && status.videos_limit ? Math.min((status.videos_used / status.videos_limit) * 100, 100) : 0

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
                        <div className="flex items-center gap-2">
                            <span className="text-text-secondary">Plan</span>
                            <span className="font-medium capitalize">{currentPlan} ({currentInterval})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-text-secondary">Videos Protected</span>
                            <span className="font-medium">
                                {status?.videos_used} / {status?.videos_limit === null || status?.videos_limit === Infinity ? (
                                    <span className="text-primary font-bold">Unlimited videos</span>
                                ) : status?.videos_limit}
                            </span>
                        </div>
                    </div>
                    {status?.videos_limit !== null && status?.videos_limit !== Infinity && (
                        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                    )}
                    {status?.cancel_at_period_end ? (
                        <p className="text-xs text-red-400">
                            Your subscription will end on {status?.current_period_end ? new Date(status.current_period_end).toLocaleDateString() : 'the end of your billing cycle'}.
                        </p>
                    ) : (
                        <p className="text-xs text-text-muted">
                            Resets on {status?.current_period_end ? new Date(status.current_period_end).toLocaleDateString() : 'next billing cycle'}
                        </p>
                    )}
                </div>
            </div>

            {/* Billing Interval Toggle */}
            <div className="flex justify-center mt-12 mb-8">
                <div className="bg-surface-light p-1 rounded-lg flex items-center relative">
                    <button
                        onClick={() => setBillingInterval('month')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingInterval === 'month'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingInterval('year')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${billingInterval === 'year'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Yearly
                        <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Save up to $240
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
                    const plan = PLANS[planKey]
                    const isCurrent = currentPlan === planKey && (planKey === 'free' || currentInterval === billingInterval)
                    const price = plan.prices[billingInterval]

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
                                <span className="text-sm font-normal text-text-secondary">/{billingInterval}</span>
                            </div>
                            {billingInterval === 'year' && planKey !== 'free' && plan.savings && (
                                <div className="text-xs text-green-400 font-medium mb-6">
                                    Save {plan.savings} with yearly
                                </div>
                            )}
                            {billingInterval === 'month' || planKey === 'free' || !plan.savings ? (
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
                                onClick={() => planKey === 'free' ? handleManageSubscription() : handleUpgrade(planKey as 'pro' | 'business' | 'elite')}
                                disabled={isCurrent || isActionLoading}
                                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${isCurrent
                                    ? 'bg-surface-light text-text-muted cursor-default'
                                    : 'btn-primary'
                                    }`}
                            >
                                {isCurrent ? 'Active' : (planKey === 'free' ? 'Manage Subscription' : `Upgrade to ${plan.name}`)}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Cancel Subscription (Paid Plans Only) */}
            {currentPlan !== 'free' && !status?.cancel_at_period_end && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={handleCancelClick}
                        disabled={isActionLoading}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors underline decoration-red-400/30 hover:decoration-red-300"
                    >
                        Cancel my subscription
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                title="Cancel Subscription?"
                footer={
                    <>
                        <button
                            onClick={() => setIsCancelModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                            disabled={isActionLoading}
                        >
                            Keep Subscription
                        </button>
                        <button
                            onClick={confirmCancellation}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center gap-2"
                            disabled={isActionLoading}
                        >
                            {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Confirm Cancellation
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p>
                        Are you sure you want to cancel your subscription?
                    </p>
                    <div className="bg-surface-light/50 p-4 rounded-lg border border-red-500/20">
                        <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                            <li>You will lose access to premium features at the end of your billing period.</li>
                            <li>Your protected videos will remain active until then.</li>
                            <li>You can reactivate your subscription anytime before it expires.</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default function BillingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                    </div>
                </div>
            </div>
        }>
            <BillingContent />
        </Suspense>
    )
}
