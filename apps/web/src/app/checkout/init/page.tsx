'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CheckoutInitPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState('')

    useEffect(() => {
        const initCheckout = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            const plan = searchParams.get('plan')?.toLowerCase()
            const interval = searchParams.get('interval')?.toLowerCase()

            if (!plan || !interval) {
                router.push('/dashboard')
                return
            }

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
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to start checkout')
                }

                if (data.checkout_url) {
                    window.location.href = data.checkout_url
                } else {
                    throw new Error('Invalid response from server')
                }
            } catch (err: any) {
                console.error(err)
                setError(err.message || 'Failed to initialize checkout')
            }
        }

        initCheckout()
    }, [router, searchParams])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-surface border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Checkout Error</h2>
                    <p className="text-text-secondary mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn-primary w-full py-2"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold mb-2">Redirecting to Secure Payment...</h2>
            <p className="text-text-secondary">Please wait while we set up your checkout session.</p>
        </div>
    )
}
