'use client'

import { useState, useEffect } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts'
import { Activity, MousePointerClick, Users, TrendingUp, RefreshCcw, Radio } from 'lucide-react'
import { io } from 'socket.io-client'

// Brand Colors
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [timeframe, setTimeframe] = useState(30) // Days

    // Pagination states
    const [creatorsPage, setCreatorsPage] = useState(0)
    const [creatorsData, setCreatorsData] = useState({ data: [], hasMore: false, isLoading: true })
    const [eventsPage, setEventsPage] = useState(0)
    const [eventsData, setEventsData] = useState({ data: [], hasMore: false, isLoading: true })
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Real-Time Socket State
    const [liveUsers, setLiveUsers] = useState<number>(0)

    // Fetch Core Stats
    useEffect(() => {
        const fetchCoreStats = async () => {
            setIsLoading(true)
            try {
                const token = localStorage.getItem('token')
                const headers = { 'Authorization': `Bearer ${token}` }
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const [overviewRes, devicesRes, trafficRes] = await Promise.all([
                    fetch(`${API}/admin/analytics/overview?days=${timeframe}`, { headers }),
                    fetch(`${API}/admin/analytics/devices?days=${timeframe}`, { headers }),
                    fetch(`${API}/admin/analytics/traffic-sources?days=${timeframe}`, { headers })
                ])
                setStats({
                    overview: await overviewRes.json(),
                    devices: await devicesRes.json(),
                    traffic: await trafficRes.json()
                })
            } catch (error) { console.error(error) }
            finally { setIsLoading(false) }
        }
        fetchCoreStats()
    }, [timeframe, refreshTrigger])

    // Fetch Creators Pagination
    useEffect(() => {
        const fetchCreators = async () => {
            setCreatorsData(prev => ({ ...prev, isLoading: true }))
            try {
                const token = localStorage.getItem('token')
                const headers = { 'Authorization': `Bearer ${token}` }
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const res = await fetch(`${API}/admin/analytics/top-creators?days=${timeframe}&skip=${creatorsPage * 20}&take=20`, { headers })
                const data = await res.json()
                setCreatorsData({ ...data, isLoading: false })
            } catch (error) {
                console.error(error)
                setCreatorsData(prev => ({ ...prev, isLoading: false }))
            }
        }
        fetchCreators()
    }, [timeframe, creatorsPage, refreshTrigger])

    // Fetch Events Pagination
    useEffect(() => {
        const fetchEvents = async () => {
            setEventsData(prev => ({ ...prev, isLoading: true }))
            try {
                const token = localStorage.getItem('token')
                const headers = { 'Authorization': `Bearer ${token}` }
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const res = await fetch(`${API}/admin/analytics/recent-events?skip=${eventsPage * 20}&take=20`, { headers })
                const data = await res.json()
                setEventsData({ ...data, isLoading: false })
            } catch (error) {
                console.error(error)
                setEventsData(prev => ({ ...prev, isLoading: false }))
            }
        }
        fetchEvents()
    }, [eventsPage, refreshTrigger])

    // Establish WebSocket Connection for Live Pulse
    useEffect(() => {
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics`, {
            transports: ['websocket', 'polling']
        })

        socket.on('liveUsersCount', (data: { count: number }) => {
            setLiveUsers(data.count)
        })

        socket.on('connect_error', (error) => {
            console.warn('Dashboard socket error:', error.message)
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                ))}
            </div>
        )
    }

    const { overview, devices, traffic } = stats
    const topCreators = creatorsData.data
    const recentEvents = eventsData.data

    const kpiCards = [
        { label: 'Platform Views', value: overview.totalViews?.toLocaleString() || 0, icon: <Activity className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Outbound Clicks', value: overview.totalClicks?.toLocaleString() || 0, icon: <MousePointerClick className="w-6 h-6" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Global CTR', value: `${overview.ctr || 0}%`, icon: <TrendingUp className="w-6 h-6" />, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Active Creators', value: overview.activeCreators?.toLocaleString() || 0, icon: <Users className="w-6 h-6" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-surface p-6 rounded-xl border border-white/10">
                <div>
                    <h1 className="text-3xl font-bold font-mono tracking-tight text-white">Analytics <span className="text-red-500 opacity-80">God Mode</span></h1>
                    <p className="text-muted-foreground mt-1 font-mono text-sm text-white/50">Global platform telemetry and traffic aggregation</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-text-primary transition-colors focus:outline-none"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh Data
                    </button>
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
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Live Users Card (Special Treatment) */}
                <div className="p-6 rounded-xl bg-surface border border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-red-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="p-3 rounded-xl bg-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
                            <Radio className="w-6 h-6 animate-pulse" />
                        </span>
                        <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">LIVE</span>
                        </div>
                    </div>
                    <h3 className="text-4xl font-bold text-text-primary mb-1 font-mono tracking-tight relative z-10">{liveUsers.toLocaleString()}</h3>
                    <p className="text-sm font-medium text-text-secondary relative z-10">Active Right Now</p>
                </div>

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
                    {/* Creators Pagination */}
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/5">
                        <button
                            disabled={creatorsPage === 0 || creatorsData.isLoading}
                            onClick={() => setCreatorsPage(p => p - 1)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-colors"
                        >
                            &larr; Previous
                        </button>
                        <span className="text-xs text-text-muted font-mono">Page {creatorsPage + 1}</span>
                        <button
                            disabled={!creatorsData.hasMore || creatorsData.isLoading}
                            onClick={() => setCreatorsPage(p => p + 1)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-colors"
                        >
                            Next &rarr;
                        </button>
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
                                    <th className="px-4 py-3">Creator / Event</th>
                                    <th className="px-4 py-3">Device/OS</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents?.length > 0 ? recentEvents.map((event: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <span className="font-mono text-text-primary">@{event.handle}</span>
                                            <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${event.type === 'view' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {event.type}
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
                    {/* Events Pagination */}
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/5">
                        <button
                            disabled={eventsPage === 0 || eventsData.isLoading}
                            onClick={() => setEventsPage(p => p - 1)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-colors"
                        >
                            &larr; Previous
                        </button>
                        <span className="text-xs text-text-muted font-mono">Page {eventsPage + 1}</span>
                        <button
                            disabled={!eventsData.hasMore || eventsData.isLoading}
                            onClick={() => setEventsPage(p => p + 1)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-colors"
                        >
                            Next &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

