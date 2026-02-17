
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
    id: string
    email: string
    role: string
    createdAt: string
    isEmailVerified: boolean
    profile?: {
        handle: string
        displayName: string
        avatarUrl: string | null
    }
    subscription?: {
        plan: string
        status: string
        interval: string
    }
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)

    const fetchUsers = async () => {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        try {
            const queryParams = new URLSearchParams({
                skip: ((page - 1) * 20).toString(),
                take: '20',
            })
            if (search) queryParams.append('search', search)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/users?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch users')

            const data = await res.json()
            setUsers(data.data)
            setTotalPages(data.meta.last_page)
            setTotalUsers(data.meta.total)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers()
        }, 500)
        return () => clearTimeout(debounce)
    }, [page, search])

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Creators Management</h1>
                    <p className="text-text-secondary">
                        Total Users: <span className="font-mono text-primary">{totalUsers}</span>
                    </p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1) // Reset to page 1 on search
                        }}
                        className="pl-10 pr-4 py-2 rounded-lg bg-surface border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all w-full md:w-64"
                    />
                    <svg className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-surface-light/30">
                                <th className="p-4 font-medium text-text-secondary">User</th>
                                <th className="p-4 font-medium text-text-secondary">Role</th>
                                <th className="p-4 font-medium text-text-secondary">Plan</th>
                                <th className="p-4 font-medium text-text-secondary">Status</th>
                                <th className="p-4 font-medium text-text-secondary">Joined</th>
                                <th className="p-4 font-medium text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-10 w-32 bg-surface-light rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-16 bg-surface-light rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-20 bg-surface-light rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-24 bg-surface-light rounded" /></td>
                                        <td className="p-4"><div className="h-6 w-24 bg-surface-light rounded" /></td>
                                        <td className="p-4"><div className="h-8 w-8 bg-surface-light rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {user.profile?.avatarUrl ? (
                                                        <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg font-bold uppercase text-text-secondary">
                                                            {user.email.substring(0, 2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-text-primary">
                                                        {user.profile?.displayName || 'No Name'}
                                                    </div>
                                                    <div className="text-sm text-text-secondary flex items-center gap-2">
                                                        @{user.profile?.handle || 'nohandle'}
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="truncate max-w-[150px]">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${user.role === 'admin'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-surface-light text-text-secondary'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.subscription ? (
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${user.subscription.plan === 'elite' ? 'bg-orange-500/20 text-orange-400' :
                                                    user.subscription.plan === 'pro' ? 'bg-yellow-400/20 text-yellow-400' :
                                                        'bg-white/10 text-text-secondary'
                                                    }`}>
                                                    {user.subscription.plan}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                    <span className="text-sm">{user.isEmailVerified ? 'Verified' : 'Pending'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            {user.profile?.handle && (
                                                <Link
                                                    href={`/${user.profile.handle}`}
                                                    target="_blank"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/20 text-text-secondary hover:text-primary transition-colors"
                                                    title="View Public Profile"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-white/5 p-4 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-text-secondary">
                        Page {page} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
