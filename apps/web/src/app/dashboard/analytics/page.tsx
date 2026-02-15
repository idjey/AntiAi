'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<'free' | 'pro' | 'elite'>('free'); // In real app, fetch from user profile
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const chartColors = {
        stroke: isDark ? '#52525b' : '#d4d4d8',
        text: isDark ? '#a1a1aa' : '#71717a',
        tooltipBg: isDark ? '#18181b' : '#fff',
        tooltipBorder: isDark ? '#3f3f46' : '#e4e4e7',
        tooltipText: isDark ? '#fff' : '#18181b',
        grid: isDark ? '#27272a' : '#f4f4f5'
    };

    useEffect(() => {
        // Fetch stats
        const fetchStats = async () => {
            try {
                // Mocking the plan fetch or assuming we handle it globally
                // For now, let's try to fetch stats. If 403, it means not pro.
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics/dashboard?days=30`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored
                    }
                });

                if (res.status === 403) {
                    setPlan('free');
                } else if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    setPlan('pro'); // Assumed if successful
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Mock data for preview if no stats or free plan
    const mockData = {
        summary: { total_views: 12450, total_clicks: 3890, ctr: 31.2 },
        time_series: Array.from({ length: 30 }, (_, i) => ({
            date: `2024-03-${i + 1}`,
            views: Math.floor(Math.random() * 500) + 100,
            clicks: Math.floor(Math.random() * 200) + 20
        })),
        top_countries: [
            { name: 'US', value: 4500 },
            { name: 'UK', value: 2300 },
            { name: 'DE', value: 1200 },
            { name: 'CA', value: 900 },
            { name: 'FR', value: 800 }
        ],
        devices: [
            { name: 'Mobile', value: 8000 },
            { name: 'Desktop', value: 3500 },
            { name: 'Tablet', value: 950 }
        ]
    };

    const displayStats = stats || mockData;
    const isBlur = plan === 'free';
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="p-6 space-y-6 relative min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Analytics</h1>

            {/* Paywall Overlay */}
            {isBlur && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-md text-center shadow-2xl">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Unlock Pro Analytics</h2>
                        <p className="text-white/60 mb-6">Gain deep insights into your audience, traffic sources, and engagement with detailed analytics.</p>
                        <button
                            onClick={() => window.location.href = '/dashboard/billing'}
                            className="bg-primary hover:bg-primary/90 text-black font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isBlur ? 'blur-sm opacity-50' : ''}`}>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-2">Total Views</h3>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{displayStats.summary.total_views.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-2">Total Clicks</h3>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{displayStats.summary.total_clicks.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-2">Click-Through Rate</h3>
                    <p className="text-3xl font-bold text-primary">{displayStats.summary.ctr}%</p>
                </div>
            </div>

            {/* Main Chart */}
            <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm ${isBlur ? 'blur-sm opacity-50' : ''}`}>
                <h3 className="font-bold mb-6 text-zinc-900 dark:text-white">Traffic Overview</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayStats.time_series}>
                            <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke={chartColors.stroke} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={chartColors.stroke} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: chartColors.tooltipText }}
                                labelStyle={{ color: chartColors.text }}
                            />
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                            <Area type="monotone" dataKey="views" stroke="#0088FE" fillOpacity={1} fill="url(#colorViews)" />
                            <Area type="monotone" dataKey="clicks" stroke="#00C49F" fillOpacity={1} fill="url(#colorClicks)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isBlur ? 'blur-sm opacity-50' : ''}`}>
                {/* Top Countries */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold mb-6 text-zinc-900 dark:text-white">Top Locations</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayStats.top_countries} layout="vertical">
                                <XAxis type="number" stroke={chartColors.stroke} fontSize={12} hide />
                                <YAxis dataKey="name" type="category" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: chartColors.tooltipText }}
                                    labelStyle={{ color: chartColors.text }}
                                />
                                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold mb-6 text-zinc-900 dark:text-white">Devices</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayStats.devices}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {displayStats.devices.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: chartColors.tooltipText }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
