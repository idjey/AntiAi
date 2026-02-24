'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Processing login...')

    useEffect(() => {
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
            setStatus(`Login failed: ${error}`)
            setTimeout(() => router.push('/login'), 3000)
            return
        }

        if (token) {
            // Store token
            localStorage.setItem('token', token)
            setStatus('Login successful! Redirecting...')

            // Allow state to settle before redirect
            setTimeout(() => {
                router.push('/dashboard')
            }, 1000)
        } else {
            setStatus('No token found. Redirecting to login...')
            setTimeout(() => router.push('/login'), 2000)
        }
    }, [searchParams, router])

    return (
        <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-card backdrop-blur-sm max-w-md w-full text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Authenticating</h2>
            <p className="text-text-secondary">{status}</p>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Suspense fallback={<div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    )
}
