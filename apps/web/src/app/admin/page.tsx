'use client'

import { useState, useEffect } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts'
import { Activity, MousePointerClick, Users, TrendingUp } from 'lucide-react'

// Brand Colors
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [timeframe, setTimeframe] = useState(30) // Days

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true)
            try {
                const token = localStorage.getItem('token')
                const headers = { 'Authorization': `Bearer ${token}` }
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

                // Fetch all 5 aggregation endpoints concurrently
                const [overviewRes, devicesRes, trafficRes, creatorsRes, eventsRes] = await Promise.all([
                    fetch(`${API}/admin/analytics/overview?days=${timeframe}`, { headers }),
                    fetch(`${API}/admin/analytics/devices?days=${timeframe}`, { headers }),
                    fetch(`${API}/admin/analytics/traffic-sources?days=${timeframe}`, { headers }),
                    fetch(`${API}/admin/analytics/top-creators?days=${timeframe}`, { headers }),
                    fetch(`${API}/admin/analytics/recent-events?take=50`, { headers })
                ])

                const overview = await overviewRes.json()
                const devices = await devicesRes.json()
                const traffic = await trafficRes.json()
                const topCreators = await creatorsRes.json()
                const recentEvents = await eventsRes.json()

                setStats({
                    overview,
                    devices,
                    traffic,
                    topCreators,
                    recentEvents
                })
            } catch (error) {
                console.error("Failed to fetch analytics:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [timeframe])

    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                ))}
            </div>
        )
    }

    const { overview, devices, traffic, topCreators, recentEvents } = stats

    const kpiCards = [
        { label: 'Platform Views', value: overview.totalViews?.toLocaleString() || 0, icon: <Activity className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Outbound Clicks', value: overview.totalClicks?.toLocaleString() || 0, icon: <MousePointerClick className="w-6 h-6" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Global CTR', value: `${overview.ctr || 0}%`, icon: <TrendingUp className="w-6 h-6" />, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Active Creators', value: overview.activeCreators?.toLocaleString() || 0, icon: <Users className="w-6 h-6" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-mono tracking-tight">Analytics <span className="text-red-500 opacity-60">God Mode</span></h1>
                    <p className="text-muted-foreground mt-1">Global platform telemetry and traffic aggregation</p>
                </div>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(Number(e.target.value))}
                    className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-red-500/50 cursor-pointer"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, i) => (
                    <div key={i} className="p-6 rounded-xl bg-surface border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-text-primary mb-1 font-mono tracking-tight">{card.value}</h3>
                        <p className="text-sm font-medium text-text-secondary">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Traffic Sources Waterfall */}
                <div className="lg:col-span-8 p-6 rounded-xl bg-surface border border-white/10">
                    <h2 className="text-lg font-bold mb-1 font-mono tracking-tight">Referrer Waterfall</h2>
                    <p className="text-sm text-text-muted mb-6">Top traffic acquisition channels</p>

                    <div className="h-[350px] w-full">
                        {traffic.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={traffic} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(val) => val.toLocaleString()} />
                                    <YAxis dataKey="name" type="category" stroke="#fff" fontSize={12} width={100} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        formatter={(value: any) => [value.toLocaleString(), 'Views']}
                                    />
                                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={30}>
                                        {traffic.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                                <p className="text-text-muted text-sm font-mono">Insufficient Referrer Data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Device Telemetry */}
                <div className="lg:col-span-4 p-6 rounded-xl bg-surface border border-white/10 flex flex-col">
                    <h2 className="text-lg font-bold mb-1 font-mono tracking-tight">Device Telemetry</h2>
                    <p className="text-sm text-text-muted mb-6">Mobile vs Desktop OS split</p>

                    <div className="flex-1 min-h-[300px] w-full relative">
                        {devices?.os?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={devices.os}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {devices.os.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        formatter={(value: any) => [value.toLocaleString(), 'Users']}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                                <p className="text-text-muted text-sm font-mono">Gathering Device Data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Reporting */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Top Creators Leaderboard */}
                <div className="p-6 rounded-xl bg-surface border border-white/10 flex flex-col">
                    <h2 className="text-lg font-bold mb-1 font-mono tracking-tight">Top Performing Creators</h2>
                    <p className="text-sm text-text-muted mb-6">Leaderboard by organic views</p>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/5 h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-muted bg-white/5 uppercase sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-3">Creator</th>
                                    <th className="px-6 py-3 text-right">Views</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topCreators?.length > 0 ? topCreators.map((creator: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {creator.avatar ? (
                                                <img src={creator.avatar} alt={creator.handle} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold">
                                                    {creator.handle?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium text-text-primary">@{creator.handle}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-text-primary">
                                            {creator.views?.toLocaleString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-text-muted font-mono">
                                            No creator data found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Events Stream */}
                <div className="p-6 rounded-xl bg-surface border border-white/10 flex flex-col">
                    <h2 className="text-lg font-bold mb-1 font-mono tracking-tight">Raw Telemetry Stream</h2>
                    <p className="text-sm text-text-muted mb-6">Real-time deep analytics capture</p>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/5 h-[400px]">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-text-muted bg-white/5 uppercase sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-4 py-3">Event</th>
                                    <th className="px-4 py-3">Device/OS</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents?.length > 0 ? recentEvents.map((event: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-md ${event.type === 'view' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {event.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-text-primary">
                                            {event.device || 'Unknown'} <span className="text-text-muted">/</span> {event.os || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-text-primary">
                                            {event.city || event.country ? `${event.city || ''}${event.city && event.country ? ', ' : ''}${event.country || ''}` : 'Hidden'}
                                        </td>
                                        <td className="px-4 py-3 text-text-muted font-mono text-xs">
                                            {new Date(event.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-text-muted font-mono">
                                            No recent events
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

