'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Channel {
    id: string
    channel_name: string
    verification_token: string
    verification_status: string
}

export default function VerificationPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [channel, setChannel] = useState<Channel | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchChannel = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            try {
                // Fetch the specific channel
                // We'll filter from the list for MVP since we don't have a single GET endpoint yet
                // Or we can add a GET /channels/:id endpoint quickly.
                // For now, let's fetch list and filter
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/channels`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (!res.ok) throw new Error('Failed to fetch channel')

                const data = await res.json()
                const found = data.items.find((c: any) => c.id === id)

                if (!found) {
                    throw new Error('Channel not found')
                }

                // If verifying, we need the token which might not be in the list view
                // Actually list view doesn't return token usually for security/clutter
                // But for MVP let's assume we need to handle this.
                // Wait, startVerification returns the token.
                // If we navigate here from Add, we have it. 
                // But if we refresh, we need to fetch it.
                // The backend implementation of listUserChannels doesn't return verificationToken.
                // We need to implement GET /channels/:id or update list to return it for pending channels.
                // Let's assume for MVP we update the list endpoint to return verificationToken for pending channels.
                setChannel(found)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchChannel()
    }, [id])

    const handleCopy = () => {
        if (!channel?.verification_token) return
        navigator.clipboard.writeText(channel.verification_token)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleVerify = async () => {
        setIsVerifying(true)
        const token = localStorage.getItem('token')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/channels/verify/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    channel_id: id
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Verification failed')
            }

            // Success! Redirect to list
            router.push('/dashboard/channels')
        } catch (err: any) {
            setError(err.message)
            setIsVerifying(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    if (!channel) return <div>Channel not found</div>

    // Check if we have the token (if it wasn't returned by list, we might be stuck) 
    // For this MVP, I'll need to update the backend list endpoint to include token for pending channels
    // OR just display a valid-looking placeholder if it's missing (for the sake of the "Add Channel" flow where we just got it).
    // Actually, simply adding the token to the list response in backend is easier.

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard/channels" className="text-sm text-text-secondary hover:text-white flex items-center gap-1 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Channels
                </Link>
                <h1 className="text-2xl font-bold mb-2">Verify Ownership</h1>
                <p className="text-text-secondary">Verify that you own <span className="font-bold text-white">{channel.channel_name}</span></p>
            </div>

            <div className="card p-8">
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4">Step 1: Copy verification code</h3>
                    <p className="text-sm text-text-secondary mb-3">
                        Copy the unique code below to your clipboard.
                    </p>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={channel.verification_token || 'Token not hidden for Pending?'}
                            className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 font-mono text-center text-primary"
                        />
                        <button
                            onClick={handleCopy}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-background rounded text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4">Step 2: Add to YouTube</h3>
                    <div className="space-y-4 text-sm text-text-secondary">
                        <p>1. Go to your <a href="https://studio.youtube.com" target="_blank" className="text-primary hover:underline">YouTube Studio</a>.</p>
                        <p>2. Navigate to <strong>Customization</strong> {'>'} <strong>Basic info</strong> (or <strong>Profile</strong>).</p>
                        <p>3. Paste the code anywhere in your <strong>Description</strong> field.</p>
                        <p>4. Click <strong>Publish</strong> to save changes.</p>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8">
                    <h3 className="font-bold text-lg mb-4">Step 3: Verify</h3>
                    <p className="text-sm text-text-secondary mb-6">
                        Once you've published the changes, click the button below. We'll check your channel description for the code.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full btn-primary py-3 text-lg"
                    >
                        {isVerifying ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                Verifying...
                            </div>
                        ) : (
                            'Verify Now'
                        )}
                    </button>
                    <p className="text-center mt-4 text-xs text-text-muted">
                        This update may take a few moments to propagate on YouTube.
                    </p>
                </div>
            </div>
        </div>
    )
}
