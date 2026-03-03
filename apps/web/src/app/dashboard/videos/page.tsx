'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SyncChannelDialog } from './components/sync-channel-dialog'

interface Video {
    id: string
    youtube_video_id: string
    title: string
    thumbnail_url: string
    video_url: string
    published_at: string
    has_active_proof: boolean
    proof_expires_at: string | null
}

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
    const [userPlan, setUserPlan] = useState<string | null>(null)

    const fetchData = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            // Fetch User Plan to check for Elite Tier
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (userRes.ok) {
                const userData = await userRes.json()
                setUserPlan(userData.subscription?.plan?.toLowerCase() || null)
            }

            // Fetch Videos
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/videos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Failed to fetch videos')

            const data = await res.json()
            setVideos(data.items)
        } catch (err) {
            console.error(err)
            setError('Failed to load videos')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleRetryProtection = async (videoId: string) => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            // Calculate expiry (e.g., 1 year from now)
            const expiresAt = new Date()
            expiresAt.setFullYear(expiresAt.getFullYear() + 1)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/proofs/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    video_id: videoId,
                    expires_at: expiresAt.toISOString()
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to generate proof')
            }

            // Update local state to show protected
            setVideos(videos.map(v =>
                v.id === videoId
                    ? { ...v, has_active_proof: true, proof_expires_at: expiresAt.toISOString() }
                    : v
            ))

            alert('Video protected successfully!')
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to protect video')
        }
    }

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'protected' | 'unprotected'>('date_desc')

    const handleDelete = async (videoId: string) => {
        if (!confirm('Are you sure you want to remove this video? The transparency log will remain but it will no longer be listed globally.')) return

        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/videos/${videoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Failed to delete video')

            setVideos(videos.filter(v => v.id !== videoId))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const sortedVideos = [...videos].sort((a, b) => {
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
            case 'date_asc':
                return new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime()
            case 'protected':
                return (a.has_active_proof === b.has_active_proof) ? 0 : a.has_active_proof ? -1 : 1
            case 'unprotected':
                return (a.has_active_proof === b.has_active_proof) ? 0 : a.has_active_proof ? 1 : -1
            default:
                return 0
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Videos</h1>
                    <p className="text-text-secondary">Protect and manage your content library.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-surface-light rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                    >
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="protected">Protected First</option>
                        <option value="unprotected">Unprotected First</option>
                    </select>

                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="px-4 py-2 font-medium text-black bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg hover:opacity-90 flex items-center gap-2"
                        title="Bulk Sync Channel (Elite Only)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Elite Sync
                    </button>

                    <Link
                        href="/dashboard/videos/import"
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Protect Video
                    </Link>
                </div>
            </div>

            <SyncChannelDialog
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onSuccess={fetchData}
                userPlan={userPlan}
            />

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {videos.length === 0 ? (
                <div className="card p-12 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center">
                    {/* Empty state (unchanged) */}
                    <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">No videos protected yet</h2>
                    <p className="text-text-secondary mb-8 max-w-sm">
                        Import videos from your verified channels to generate cryptographic proofs of ownership.
                    </p>
                    <Link href="/dashboard/videos/import" className="btn-secondary">
                        Protect your first video
                    </Link>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-4"}>
                    {sortedVideos.map((video) => (
                        <div key={video.id} className={`card group hover:border-primary/20 transition-all overflow-hidden p-0 ${viewMode === 'list' ? 'flex items-center' : ''}`}>
                            {/* Thumbnail */}
                            <div className={`relative bg-surface-light ${viewMode === 'list' ? 'w-48 aspect-video shrink-0' : 'aspect-video'}`}>
                                <img
                                    src={video.thumbnail_url || '/placeholder-video.jpg'}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxeCIgaGVpZ2h0PSIxeCIgdmlld0JveD0iMCAwIDEgMSI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iIzMzMyIgLz48L3N2Zz4='
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                <div className="absolute top-3 right-3">
                                    {video.has_active_proof ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium backdrop-blur-sm shadow-lg">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className={viewMode === 'list' ? 'hidden md:inline' : ''}>Protected</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/90 text-white text-xs font-medium backdrop-blur-sm shadow-lg">
                                            <span className={viewMode === 'list' ? 'hidden md:inline' : ''}>Unprotected</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold group-hover:text-primary transition-colors ${viewMode === 'grid' ? 'line-clamp-2 min-h-[3rem]' : ''}`}>
                                        {video.title}
                                    </h3>
                                    {viewMode === 'list' && (
                                        <button
                                            onClick={() => handleDelete(video.id)}
                                            className="text-text-secondary hover:text-red-500 p-1"
                                            title="Delete video"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs text-text-secondary">
                                        <div className="flex gap-4">
                                            <span>Expiry: <span className="font-mono text-white">{video.proof_expires_at ? new Date(video.proof_expires_at).toLocaleDateString() : '-'}</span></span>
                                            {viewMode === 'list' && (
                                                <span>Published: <span className="font-mono text-white">{video.published_at ? new Date(video.published_at).toLocaleDateString() : '-'}</span></span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/5 flex gap-2">
                                        {video.has_active_proof ? (
                                            <>
                                                <a
                                                    href={video.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-3 py-2 bg-white/5 rounded text-xs font-medium text-center hover:bg-white/10 transition-colors"
                                                >
                                                    Watch
                                                </a>
                                                <Link
                                                    href={`/verify/${video.youtube_video_id}`}
                                                    className="flex-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-medium hover:bg-primary/20 transition-colors text-center"
                                                >
                                                    View Proof
                                                </Link>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleRetryProtection(video.id)}
                                                className="flex-1 px-3 py-2 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                            >
                                                Protect
                                            </button>
                                        )}
                                        {viewMode === 'grid' && (
                                            <button
                                                onClick={() => handleDelete(video.id)}
                                                className="px-3 py-2 bg-white/5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                title="Delete video"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
