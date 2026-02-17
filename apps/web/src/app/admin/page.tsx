
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Fetch stats from API
        // For MVP, we'll mock this or implement the endpoint next
        const fetchStats = async () => {
            // Mock Data matching the requirements
            setTimeout(() => {
                setStats({
                    overview: {
                        totalCreators: 128,
                        verifiedChannels: 45,
                        proofs24h: 312,
                        activeProofs: 1450,
                        openReports: 3,
                        mrr: 2490
                    },
                    alerts: [
                        { type: 'warning', message: 'Spike in verification checks from IP 192.168.1.x', time: '10m ago' },
                        { type: 'error', message: 'Stripe Webhook Error: invoice.payment_failed', time: '1h ago' },
                    ]
                })
                setIsLoading(false)
            }, 500)
        }
        fetchStats()
    }, [])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                ))}
            </div>
        )
    }

    const cards = [
        { label: 'Total Creators', value: stats.overview.totalCreators, change: '+12%', icon: '👥', color: 'text-blue-500' },
        { label: 'Verified Channels', value: stats.overview.verifiedChannels, change: '+5%', icon: '📺', color: 'text-red-500' },
        { label: 'Proofs (24h)', value: stats.overview.proofs24h, change: '+24%', icon: '🛡️', color: 'text-green-500' },
        { label: 'MRR', value: `$${stats.overview.mrr}`, change: '+8%', icon: '💰', color: 'text-emerald-500' },
    ]

    return (
        <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="p-6 rounded-xl bg-surface border border-white/10 hover:border-white/20 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`p-2 rounded-lg bg-white/5 text-2xl`}>{card.icon}</span>
                            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                {card.change}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-text-primary mb-1">{card.value}</h3>
                        <p className="text-sm text-text-secondary">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Critical Alerts */}
                <div className="p-6 rounded-xl bg-surface border border-white/10">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        System Alerts
                    </h2>
                    <div className="space-y-4">
                        {stats.alerts.map((alert: any, i: number) => (
                            <div key={i} className={`p-4 rounded-lg flex items-start gap-4 ${alert.type === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'
                                }`}>
                                <div className={`mt-1 w-2 h-2 rounded-full ${alert.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-text-primary">{alert.message}</p>
                                    <p className="text-xs text-text-secondary mt-1">{alert.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Activity */}
                <div className="p-6 rounded-xl bg-surface border border-white/10">
                    <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 py-2 border-b border-white/5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">👤</div>
                            <div className="flex-1">
                                <p className="text-sm text-text-primary">New creator signup: <strong>@alex_tech</strong></p>
                                <p className="text-xs text-text-secondary">2 mins ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 py-2 border-b border-white/5">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">🛡️</div>
                            <div className="flex-1">
                                <p className="text-sm text-text-primary">Proof issued: <strong>Video #8821</strong></p>
                                <p className="text-xs text-text-secondary">5 mins ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs">⭐</div>
                            <div className="flex-1">
                                <p className="text-sm text-text-primary">Upgrade to Pro: <strong>sarah_j</strong></p>
                                <p className="text-xs text-text-secondary">15 mins ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

