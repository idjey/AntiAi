'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Channel {
    id: string
    channel_name: string
}

export default function ImportVideoPage() {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [channels, setChannels] = useState<Channel[]>([])
    const [selectedChannelId, setSelectedChannelId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [fetchingChannels, setFetchingChannels] = useState(true)
    const [error, setError] = useState('')
    const [status, setStatus] = useState<'idle' | 'importing' | 'protecting' | 'success'>('idle')

    useEffect(() => {
        const fetchChannels = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/channels`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (!res.ok) throw new Error('Failed to fetch channels')

                const data = await res.json()
                // Filter only verified channels
                const verifiedResponse = data.items.filter((c: any) => c.verification_status === 'verified')
                setChannels(verifiedResponse)

                if (verifiedResponse.length > 0) {
                    setSelectedChannelId(verifiedResponse[0].id)
                } else {
                    setError('You need a verified channel to import videos.')
                }
            } catch (err: any) {
                setError('Failed to load channels')
            } finally {
                setFetchingChannels(false)
            }
        }

        fetchChannels()
    }, [])

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url || !selectedChannelId) return

        setIsLoading(true)
        setError('')
        setStatus('importing')
        const token = localStorage.getItem('token')

        try {
            // 1. Import Video
            const importRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/videos/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    video_url: url,
                    channel_id: selectedChannelId
                }),
            })

            if (!importRes.ok) {
                const data = await importRes.json()
                throw new Error(data.message || 'Failed to import video')
            }

            const video = await importRes.json()

            // 2. Generate Proof
            setStatus('protecting')

            // Calculate expiry (e.g., 1 year from now)
            const expiresAt = new Date()
            expiresAt.setFullYear(expiresAt.getFullYear() + 1)

            const proofRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/proofs/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    video_id: video.id,
                    expires_at: expiresAt.toISOString()
                }),
            })

            if (!proofRes.ok) {
                const data = await proofRes.json()
                // If proof fails, we still have the video imported, but display error
                throw new Error(data.message || 'Video imported but proof generation failed')
            }

            const proof = await proofRes.json()
            setStatus('success')

            // Short delay to show success state
            setTimeout(() => {
                router.push('/dashboard/videos')
            }, 1000)

        } catch (err: any) {
            setError(err.message)
            setStatus('idle')
        } finally {
            setIsLoading(false)
        }
    }

    if (fetchingChannels) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    if (channels.length === 0) {
        return (
            <div className="card p-12 text-center border-dashed border-2 border-white/10">
                <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Verified Channel Required</h2>
                <p className="text-text-secondary mb-6">
                    You need to verify a YouTube channel before you can protect videos.
                </p>
                <Link href="/dashboard/channels/add" className="btn-primary">
                    Verify a Channel
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard/videos" className="text-sm text-text-secondary hover:text-white flex items-center gap-1 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Videos
                </Link>
                <h1 className="text-2xl font-bold mb-2">Protect Video</h1>
                <p className="text-text-secondary">Import a video from your verified channel to generate a cryptographic proof.</p>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleImport} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                            Select Channel
                        </label>
                        <select
                            value={selectedChannelId}
                            onChange={(e) => setSelectedChannelId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        >
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>{c.channel_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                            YouTube URL
                        </label>
                        <input
                            type="url"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="bg-surface-light/30 rounded-lg p-4 text-xs text-text-secondary space-y-2">
                        <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${status === 'idle' ? 'bg-white/10 text-white/50' : status !== 'idle' ? 'bg-green-500 text-white' : ''}`}>
                                1
                            </div>
                            <span className={status === 'importing' ? 'text-primary font-medium' : ''}>
                                Importing video metadata from YouTube...
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${status === 'protecting' || status === 'success' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                                2
                            </div>
                            <span className={status === 'protecting' ? 'text-primary font-medium' : ''}>
                                Generating Ed25519 cryptographic proof...
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${status === 'success' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                                3
                            </div>
                            <span className={status === 'success' ? 'text-primary font-medium' : ''}>
                                Saving to transparency log...
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !url}
                        className="w-full btn-primary py-3"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                {status === 'importing' ? 'Importing...' : 'Protecting...'}
                            </div>
                        ) : (
                            'Import & Protect'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
