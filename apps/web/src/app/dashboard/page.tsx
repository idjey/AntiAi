'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        totalChannels: 0,
        totalVideos: 0,
        totalProofs: 0
    })
    const [recentVideos, setRecentVideos] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                const headers = { 'Authorization': `Bearer ${token}` }
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

                const [channelsRes, videosRes, proofsRes] = await Promise.all([
                    fetch(`${apiUrl}/channels`, { headers }),
                    fetch(`${apiUrl}/videos`, { headers }),
                    fetch(`${apiUrl}/proofs`, { headers })
                ])

                const channels = await channelsRes.json()
                const videos = await videosRes.json()
                const proofs = await proofsRes.json()

                setStats({
                    totalChannels: Array.isArray(channels) ? channels.length : 0,
                    totalVideos: Array.isArray(videos) ? videos.length : 0,
                    totalProofs: Array.isArray(proofs) ? proofs.length : 0
                })

                if (Array.isArray(videos)) {
                    // Sort by newest and take top 5
                    const sorted = [...videos].sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ).slice(0, 5)

                    setRecentVideos(sorted.map(v => ({
                        id: v.id,
                        title: v.title,
                        channelName: v.channel?.title || 'Unknown Channel',
                        date: v.created_at,
                        status: 'verified' // Assuming all imported videos usually get verified
                    })))
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-text-secondary">Welcome back to your creator command center.</p>
            </div>

            {/* Stats Grid */}
            <StatsOverview
                totalChannels={stats.totalChannels}
                totalVideos={stats.totalVideos}
                totalProofs={stats.totalProofs}
                isLoading={isLoading}
            />

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Action */}
                <div className="card p-8 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center min-h-[300px] hover:border-primary/20 transition-colors group">
                    <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-text-secondary group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Import New Content</h3>
                    <p className="text-text-secondary mb-6 max-w-sm">
                        Import videos from your YouTube channel to generate cryptographic proofs and protect your content.
                    </p>
                    <div className="flex gap-3">
                        <Link href="/dashboard/channels/add" className="btn-secondary">
                            Add Channel
                        </Link>
                        <Link href="/dashboard/videos/import" className="btn-primary">
                            Import Video
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <RecentActivity
                    activities={recentVideos}
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}
<p className="text-text-secondary">Welcome back to your creator command center.</p>
            </div >

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="card">
            <h3 className="text-text-secondary text-sm font-medium mb-2">Verified Videos</h3>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">0</span>
                <span className="text-primary text-sm font-medium mb-1">+0 this week</span>
            </div>
        </div>
        <div className="card">
            <h3 className="text-text-secondary text-sm font-medium mb-2">Total Views Protected</h3>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">0</span>
                <span className="text-primary text-sm font-medium mb-1">0% growth</span>
            </div>
        </div>
        <div className="card">
            <h3 className="text-text-secondary text-sm font-medium mb-2">Proof Checks</h3>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">0</span>
                <span className="text-text-secondary text-sm font-medium mb-1">Last 30 days</span>
            </div>
        </div>
    </div>

{/* Action Cards */ }
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="card p-8 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Add your first channel</h3>
        <p className="text-text-secondary mb-6 max-w-sm">
            Verify ownership of your YouTube channel to start generating cryptographic proofs for your videos.
        </p>
        <Link href="/dashboard/channels/add" className="btn-primary">
            Connect Channel
        </Link>
    </div>

    <div className="card">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Recent Activity</h3>
            <button className="text-sm text-primary hover:text-primary-400">View all</button>
        </div>
        <div className="space-y-4">
            <div className="text-center py-12 text-text-secondary">
                No activity yet
            </div>
        </div>
    </div>
</div>
        </div >
    )
}
