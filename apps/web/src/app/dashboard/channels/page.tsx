'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Channel {
    id: string
    channel_name: string
    channel_handle: string
    avatar_url: string | null
    verification_status: 'pending' | 'verified' | 'revoked'
    verified_at: string | null
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchChannels = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/channels`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (!res.ok) throw new Error('Failed to fetch channels')

                const data = await res.json()
                setChannels(data.items)
            } catch (err) {
                console.error(err)
                setError('Failed to load channels')
            } finally {
                setIsLoading(false)
            }
        }

        fetchChannels()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this channel? This action cannot be undone.')) return

        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/channels/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) throw new Error('Failed to delete channel')

            setChannels(channels.filter(c => c.id !== id))
        } catch (err) {
            console.error(err)
            alert('Failed to delete channel')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Channels</h1>
                    <p className="text-text-secondary">Manage and verify your YouTube channels.</p>
                </div>
                <Link
                    href="/dashboard/channels/add"
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Channel
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {channels.length === 0 ? (
                <div className="card p-12 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">No channels connected</h2>
                    <p className="text-text-secondary mb-8 max-w-sm">
                        Connect your YouTube channel to start generating cryptographic proofs for your videos.
                    </p>
                    <Link href="/dashboard/channels/add" className="btn-secondary">
                        Add your first channel
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {channels.map((channel) => (
                        <div key={channel.id} className="card flex items-center gap-4 p-4 hover:border-primary/20 transition-all">
                            <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center text-xl font-bold">
                                {channel.channel_name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate">{channel.channel_name}</h3>
                                <p className="text-sm text-text-secondary truncate">
                                    {channel.channel_handle || 'No handle set'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {channel.verification_status === 'verified' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Verified
                                    </span>
                                ) : (
                                    <Link
                                        href={`/dashboard/channels/${channel.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                        Verify Now
                                    </Link>
                                )}
                                <button
                                    onClick={() => handleDelete(channel.id)}
                                    className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                                    title="Remove channel"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


