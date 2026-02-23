'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Creator {
    id: string
    email: string
    role: string
    isSuspended: boolean
    createdAt: string
    isEmailVerified: boolean
    profile?: {
        handle: string
        displayName: string
        avatarUrl: string | null
    }
    subscription?: {
        plan: 'free' | 'pro' | 'elite'
        status: string
        interval: string
        videosThisMonth: number
    }
    _count?: {
        channels: number
    }
}

export default function CreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCreators, setTotalCreators] = useState(0)
    const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
    const [isActionLoading, setIsActionLoading] = useState(false)

    const fetchCreators = async () => {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        try {
            const queryParams = new URLSearchParams({
                skip: ((page - 1) * 20).toString(),
                take: '20',
            })
            if (search) queryParams.append('search', search)

            // Using the existing users endpoint but specifically for creator management
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/users?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch creators')

            const data = await res.json()
            setCreators(data.data)
            setTotalPages(data.meta.last_page)
            setTotalCreators(data.meta.total)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchCreators()
        }, 500)
        return () => clearTimeout(debounce)
    }, [page, search])

    const handleAction = async (action: 'suspend' | 'grant-pro' | 'reset-limits', creatorId: string) => {
        setIsActionLoading(true)
        const token = localStorage.getItem('token')
        try {
            let endpoint = ''
            let method = 'POST'
            let body: any = null

            if (action === 'suspend') {
                endpoint = `/admin/users/${creatorId}/suspend`
            } else if (action === 'grant-pro') {
                endpoint = `/admin/users/${creatorId}/plan`
                body = { plan: 'pro' }
            } else if (action === 'reset-limits') {
                endpoint = `/admin/users/${creatorId}/reset-limits`
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            })

            if (!res.ok) throw new Error(`Failed to ${action}`)

            // Refresh list
            await fetchCreators()
            setSelectedCreator(null) // Close drawer if open
        } catch (err: any) {
            console.error(err)
            alert(`Action failed: ${err.message}`)
        } finally {
            setIsActionLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto relative min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Creators Management</h1>
                    <p className="text-text-secondary text-sm">
                        Total Creators: <span className="font-mono text-primary font-medium">{totalCreators}</span>
                    </p>
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search by email or handle..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all w-full md:w-80 shadow-sm"
                    />
                    <svg className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card overflow-hidden border border-white/5 shadow-xl bg-surface/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-surface-light/30">
                                <th className="p-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Creator</th>
                                <th className="p-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Plan</th>
                                <th className="p-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Stats</th>
                                <th className="p-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Joined</th>
                                <th className="p-4 font-semibold text-text-secondary text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-10 w-48 bg-surface-light/50 rounded-lg" /></td>
                                        <td className="p-4"><div className="h-6 w-16 bg-surface-light/50 rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-20 bg-surface-light/50 rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-24 bg-surface-light/50 rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-24 bg-surface-light/50 rounded" /></td>
                                        <td className="p-4"><div className="h-8 w-8 bg-surface-light/50 rounded-lg ml-auto" /></td>
                                    </tr>
                                ))
                            ) : creators.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-text-muted">
                                        No creators found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                creators.map((creator) => (
                                    <tr key={creator.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                                                    {creator.profile?.avatarUrl ? (
                                                        <img src={creator.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-bold uppercase text-text-secondary">
                                                            {creator.email.substring(0, 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-text-primary">
                                                        {creator.profile?.displayName || 'No Name'}
                                                    </div>
                                                    <div className="text-sm text-text-secondary flex items-center gap-2">
                                                        @{creator.profile?.handle || 'nohandle'}
                                                        <span className="w-0.5 h-0.5 rounded-full bg-text-muted" />
                                                        <span className="truncate max-w-[150px] opacity-70">{creator.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {creator.subscription ? (
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${creator.subscription.plan === 'elite'
                                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    : creator.subscription.plan === 'pro'
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : 'bg-surface-light text-text-secondary border-white/5'
                                                    }`}>
                                                    {creator.subscription.plan}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                {creator.isSuspended ? (
                                                    <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                                        Suspended
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                        Active
                                                    </span>
                                                )}
                                                <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded w-fit ${creator.isEmailVerified ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {creator.isEmailVerified ? 'Verified Email' : 'Pending Email'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-text-secondary">
                                                <div className="flex items-center gap-4">
                                                    <div title="Channels">
                                                        <span className="text-text-primary font-mono">{creator._count?.channels || 0}</span>
                                                        <span className="text-[10px] text-text-muted ml-1">CH</span>
                                                    </div>
                                                    <div title="Usage">
                                                        <span className="text-text-primary font-mono">{creator.subscription?.videosThisMonth || 0}</span>
                                                        <span className="text-[10px] text-text-muted ml-1">VIDS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary">
                                            {format(new Date(creator.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="p-4 text-right relative">
                                            <button
                                                onClick={() => setSelectedCreator(creator)}
                                                className="p-2 rounded-lg hover:bg-surface-light text-text-secondary hover:text-primary transition-all"
                                                title="Quick Actions"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-white/5 p-4 flex items-center justify-between bg-surface-light/10">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors border border-white/5"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-text-secondary font-mono">
                        Page {page} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors border border-white/5"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Slide-over Drawer for Details/Actions */}
            {selectedCreator && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedCreator(null)}
                    />

                    {/* Drawer */}
                    <div className="relative w-full max-w-md bg-[#0F0F13] border-l border-white/10 shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold">Creator Details</h2>
                                <button
                                    onClick={() => setSelectedCreator(null)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Profile Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center overflow-hidden border-2 border-white/10">
                                    {selectedCreator.profile?.avatarUrl ? (
                                        <img src={selectedCreator.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold uppercase text-text-secondary">
                                            {selectedCreator.email.substring(0, 2)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{selectedCreator.profile?.displayName || 'No Name'}</h3>
                                    <div className="text-text-secondary text-sm">@{selectedCreator.profile?.handle || 'nohandle'}</div>
                                    <div className="text-xs text-text-muted mt-1 font-mono">{selectedCreator.id}</div>
                                </div>
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <button
                                    onClick={() => handleAction('suspend', selectedCreator.id)}
                                    disabled={isActionLoading}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedCreator.isSuspended
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    <span className="text-xs font-bold">{selectedCreator.isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                                </button>

                                <button
                                    onClick={() => handleAction('grant-pro', selectedCreator.id)}
                                    disabled={isActionLoading || selectedCreator.subscription?.plan === 'pro'}
                                    className="p-3 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="text-xs font-bold">Grant Pro</span>
                                </button>

                                <button
                                    onClick={() => handleAction('reset-limits', selectedCreator.id)}
                                    disabled={isActionLoading}
                                    className="p-3 rounded-xl border border-white/10 bg-surface-light text-text-secondary hover:bg-surface-light/80 hover:text-white flex flex-col items-center justify-center gap-2 transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-xs font-bold">Reset Limits</span>
                                </button>

                                {selectedCreator.profile?.handle && (
                                    <Link
                                        href={`/${selectedCreator.profile.handle}`}
                                        target="_blank"
                                        className="p-3 rounded-xl border border-white/10 bg-surface-light text-text-secondary hover:bg-surface-light/80 hover:text-white flex flex-col items-center justify-center gap-2 transition-all"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <span className="text-xs font-bold">Public Page</span>
                                    </Link>
                                )}
                            </div>

                            {/* Details List */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-text-muted tracking-wider mb-2">Subscription</h4>
                                    <div className="bg-surface-light/30 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Plan</span>
                                            <span className="font-medium text-white capitalize">{selectedCreator.subscription?.plan || 'Free'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Status</span>
                                            <span className="font-medium text-white capitalize">{selectedCreator.subscription?.status || 'Active'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Interval</span>
                                            <span className="font-medium text-white capitalize">{selectedCreator.subscription?.interval || 'Month'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Usage (This Month)</span>
                                            <span className="font-medium text-white">{selectedCreator.subscription?.videosThisMonth || 0} Videos</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase text-text-muted tracking-wider mb-2">Account Info</h4>
                                    <div className="bg-surface-light/30 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Role</span>
                                            <span className="font-medium text-white capitalize">{selectedCreator.role}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Joined</span>
                                            <span className="font-medium text-white">{format(new Date(selectedCreator.createdAt), 'PP pp')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Email Verified</span>
                                            <span className={`font-medium ${selectedCreator.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {selectedCreator.isEmailVerified ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Channels</span>
                                            <span className="font-medium text-white">{selectedCreator._count?.channels || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
