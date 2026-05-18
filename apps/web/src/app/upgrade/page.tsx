'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function UpgradePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const couponCode = searchParams.get('coupon')
    const [status, setStatus] = useState<'checking' | 'free' | 'subscribed'>('checking')
    const [plan, setPlan] = useState<string>('')

    useEffect(() => {
        const checkSubscription = async () => {
            const token = localStorage.getItem('token')

            // Not logged in → redirect to signup with coupon preserved
            if (!token) {
                router.push(`/signup${couponCode ? `?coupon=${couponCode}` : ''}`)
                return
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/status`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (!res.ok) {
                    router.push(`/signup${couponCode ? `?coupon=${couponCode}` : ''}`)
                    return
                }

                const data = await res.json()

                if (data.plan === 'pro' || data.plan === 'business' || data.plan === 'elite') {
                    setPlan(data.plan)
                    setStatus('subscribed')
                } else {
                    setStatus('free')
                    // Auto-redirect to settings with coupon after a brief pause
                    setTimeout(() => {
                        router.push(`/dashboard/settings${couponCode ? `?coupon=${couponCode}` : ''}`)
                    }, 1500)
                }
            } catch {
                router.push(`/dashboard/settings${couponCode ? `?coupon=${couponCode}` : ''}`)
            }
        }

        checkSubscription()
    }, [router, couponCode])

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {status === 'checking' && (
                    <div className="space-y-6">
                        <div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
                        <div>
                            <h1 className="text-xl font-bold text-white mb-2">Checking your account...</h1>
                            <p className="text-sm text-gray-400">We're verifying your subscription status.</p>
                        </div>
                    </div>
                )}

                {status === 'free' && (
                    <div className="space-y-6">
                        <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                        <div>
                            <h1 className="text-xl font-bold text-white mb-2">Redirecting to upgrade...</h1>
                            <p className="text-sm text-gray-400">
                                {couponCode ? (
                                    <>Your coupon <span className="text-red-400 font-mono font-bold">{couponCode}</span> is ready to apply.</>
                                ) : (
                                    <>Taking you to your dashboard.</>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {status === 'subscribed' && (
                    <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">You're already a {plan.charAt(0).toUpperCase() + plan.slice(1)} member!</h1>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Great news — you're already on the <span className="text-emerald-400 font-semibold">{plan.toUpperCase()}</span> plan.
                                This coupon is only valid for free-plan users upgrading for the first time.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
