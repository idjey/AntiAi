'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddChannelPage() {
    const router = useRouter()
    const [handle, setHandle] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/login')
            return
        }

        try {
            // For MVP, we treat the input as both the requested handle and the ID
            // In a real app, we'd use YouTube API to resolve the handle to an ID first
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/channels/verify/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    youtube_channel_id: handle, // Using handle as ID for MVP simulation
                    requested_handle: handle,
                    method: 'about_token'
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to add channel')
            }

            const data = await res.json()
            // Redirect to the verification page for this new channel
            router.push(`/dashboard/channels/${data.channel_id}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard/channels" className="text-sm text-text-secondary hover:text-white flex items-center gap-1 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Channels
                </Link>
                <h1 className="text-2xl font-bold mb-2">Add YouTube Channel</h1>
                <p className="text-text-secondary">Enter your YouTube handle to begin verification.</p>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                            YouTube Handle
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">@</span>
                            <input
                                type="text"
                                required
                                value={handle}
                                onChange={(e) => setHandle(e.target.value.replace('@', ''))}
                                className="w-full pl-8 pr-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="mychannel"
                            />
                        </div>
                        <p className="mt-2 text-xs text-text-secondary">
                            We'll ask you to verify ownership in the next step.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading || !handle}
                            className="btn-primary"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                'Continue to Verification'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
