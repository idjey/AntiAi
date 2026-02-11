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

                const channelsData = await channelsRes.json()
                const videosData = await videosRes.json()
                const proofsData = await proofsRes.json()

                const channels = channelsData.items || []
                const videos = videosData.items || []
                const proofs = proofsData.items || []

                setStats({
                    totalChannels: channels.length,
                    totalVideos: videos.length,
                    totalProofs: proofs.length
                })

                if (videos.length > 0) {
                    // Sort by newest and take top 5
                    const sorted = [...videos].sort((a: any, b: any) =>
                        new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
                    ).slice(0, 5)

                    setRecentVideos(sorted.map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        // Video service doesn't return channel object in list, only ID. 
                        // For MVP, we'll confirm this. If channel name is needed, we need to fetch it or map it from channels list.
                        // Let's try to map from channels list we just fetched if possible.
                        channelName: channels.find((c: any) => c.id === v.channel_id)?.channel_name || 'Unknown Channel',
                        date: v.published_at || v.created_at,
                        status: v.has_active_proof ? 'verified' : 'pending'
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
