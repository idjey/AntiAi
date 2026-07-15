'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Handle Setup Modal (for Google OAuth users without profiles)
    const [showHandleModal, setShowHandleModal] = useState(false)
    const [handleInput, setHandleInput] = useState('')
    const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
    const [handleError, setHandleError] = useState('')
    const [isCreatingProfile, setIsCreatingProfile] = useState(false)

    // Load initial collapse state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed')
        if (saved) {
            setIsCollapsed(saved === 'true')
        }
    }, [])

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev
            localStorage.setItem('sidebar_collapsed', String(next))
            return next
        })
    }

    // Close mobile menu when path changes
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (!res.ok) {
                    throw new Error('Unauthorized')
                }

                const userData = await res.json()
                setUser(userData)

                // Check if user needs to set up their handle (Google OAuth without profile)
                if (!userData.profile) {
                    setShowHandleModal(true)
                }
            } catch (err) {
                // Token invalid or expired
                localStorage.removeItem('token')
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router])

    // Debounced handle availability check
    useEffect(() => {
        if (handleInput.length < 3) {
            setHandleStatus(handleInput.length > 0 ? 'invalid' : 'idle')
            setHandleError(handleInput.length > 0 ? 'Handle must be at least 3 characters' : '')
            return
        }
        if (handleInput.length > 10) {
            setHandleStatus('invalid')
            setHandleError('Handle must be 10 characters or less')
            return
        }
        if (!/^[a-z0-9_\-\.]+$/.test(handleInput.toLowerCase())) {
            setHandleStatus('invalid')
            setHandleError('Only lowercase letters, numbers, underscore, hyphen, and dot')
            return
        }

        setHandleStatus('checking')
        const timer = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token')
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/check-handle/${handleInput.toLowerCase()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()
                if (data.available) {
                    setHandleStatus('available')
                    setHandleError('')
                } else {
                    setHandleStatus('taken')
                    setHandleError(data.reason === 'reserved' ? 'This handle is reserved' : 'Handle already taken')
                }
            } catch {
                setHandleStatus('idle')
            }
        }, 400)

        return () => clearTimeout(timer)
    }, [handleInput])

    const handleCreateProfile = async () => {
        if (handleStatus !== 'available') return
        setIsCreatingProfile(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    handle: handleInput.toLowerCase(),
                    display_name: handleInput,
                })
            })

            if (!res.ok) {
                const err = await res.json()
                setHandleError(err.message || 'Failed to create profile')
                return
            }

            // Refresh user data
            const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const userData = await meRes.json()
            setUser(userData)
            setShowHandleModal(false)
        } catch {
            setHandleError('Something went wrong. Please try again.')
        } finally {
            setIsCreatingProfile(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                    </div>
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-primary animate-[shimmer_1s_infinite]" />
                    </div>
                </div>
            </div>
        )
    }

    // Navigation items
    const navItems = [
        {
            name: 'Overview', href: '/dashboard', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: 'Analytics', href: '/dashboard/analytics', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },

        {
            name: 'Channels', href: '/dashboard/channels', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: 'Videos', href: '/dashboard/videos', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            name: 'Creator Card', href: '/dashboard/creator-card', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
            )
        },
        {
            name: 'API Keys', href: '/dashboard/api-keys', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            )
        },
        {
            name: 'Billing', href: '/dashboard/billing', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )
        },
        {
            name: 'Settings', href: '/dashboard/settings', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ]





    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar (Desktop) */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface border-r border-border flex-shrink-0 hidden md:flex flex-col transition-all duration-300 relative group`}>
                <div className={`p-6 ${isCollapsed ? 'px-4' : ''}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                        </div>
                        {!isCollapsed && (
                            <span className="text-xl font-bold tracking-tight">
                                antiai<span className="text-primary">.me</span>
                            </span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 py-3 rounded-lg transition-colors font-medium relative group/link ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                                    }`}
                            >
                                <span className={isActive ? 'text-primary' : 'text-text-secondary group-hover/link:text-text-primary'}>
                                    {item.icon}
                                </span>

                                {!isCollapsed && (
                                    <>
                                        {item.name}
                                        {item.name === 'Analytics' && (
                                            <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                Pro
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-surface border border-border text-text-primary text-xs rounded opacity-0 invisible group-hover/link:opacity-100 group-hover/link:visible transition-all whitespace-nowrap z-50">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    {/* Toggle Collapse Button */}
                    <button
                        onClick={toggleCollapse}
                        className={`w-full flex items-center mb-3 text-text-secondary hover:text-text-primary transition-colors ${isCollapsed ? 'justify-center' : 'justify-end pr-2'}`}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-light/30 ${isCollapsed ? 'flex-col justify-center' : ''}`}>
                        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-background font-bold uppercase shrink-0">
                                {user?.email?.substring(0, 2) || '??'}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate max-w-[100px]" title={user?.email}>
                                        {user?.email?.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-text-secondary truncate capitalize">
                                        {user?.role || 'Creator'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col gap-2 mt-2' : ''}`}>
                            {!isCollapsed && <ThemeToggle />}
                            <button
                                onClick={handleLogout}
                                className="text-text-secondary hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-surface-light"
                                title="Log out"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-50 transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            antiai<span className="text-primary">.me</span>
                        </span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-secondary hover:text-text-primary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                                    }`}
                            >
                                <span className={isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}>
                                    {item.icon}
                                </span>
                                {item.name}
                                {item.name === 'Analytics' && (
                                    <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Pro
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-light/30">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-background font-bold uppercase">
                                {user?.email?.substring(0, 2) || '??'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate max-w-[100px]" title={user?.email}>
                                    {user?.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-text-secondary truncate capitalize">
                                    {user?.role || 'Creator'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-text-secondary hover:text-red-400 transition-colors p-1"
                            title="Log out"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden transition-all duration-300">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-surface sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            antiai<span className="text-primary">.me</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="text-text-secondary hover:text-text-primary p-1"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-auto">
                    {/* Blocking Handle Setup Modal */}
                    {showHandleModal && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
                            <div className="bg-surface border border-border rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-text-primary mb-2">Choose Your Creator Handle</h2>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        This will be your unique URL on AntiAI. You can change it later with a Pro or Elite plan.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase tracking-wider font-medium block mb-2">Creator Handle</label>
                                        <div className="relative">
                                            <div className="flex items-center bg-surface-light border border-border rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                                                <span className="pl-4 pr-1 text-text-secondary text-sm whitespace-nowrap select-none">antiai.me/</span>
                                                <input
                                                    type="text"
                                                    value={handleInput}
                                                    onChange={e => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\.]/g, ''))}
                                                    placeholder="yourname"
                                                    maxLength={10}
                                                    autoFocus
                                                    className="flex-1 bg-transparent py-3 pr-10 text-text-primary placeholder-text-secondary/50 text-sm focus:outline-none"
                                                    onKeyDown={e => { if (e.key === 'Enter' && handleStatus === 'available') handleCreateProfile() }}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {handleStatus === 'checking' && (
                                                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                    )}
                                                    {handleStatus === 'available' && (
                                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {(handleStatus === 'taken' || handleStatus === 'invalid') && handleInput.length > 0 && (
                                                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {handleError && (
                                            <p className="mt-2 text-xs text-red-400">{handleError}</p>
                                        )}
                                        {handleStatus === 'available' && (
                                            <p className="mt-2 text-xs text-emerald-400">This handle is available!</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleCreateProfile}
                                        disabled={handleStatus !== 'available' || isCreatingProfile}
                                        className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-surface-light disabled:text-text-secondary text-background font-bold rounded-xl text-sm transition-all disabled:cursor-not-allowed"
                                    >
                                        {isCreatingProfile ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                Creating profile...
                                            </span>
                                        ) : (
                                            'Continue to Dashboard'
                                        )}
                                    </button>

                                    <p className="text-[11px] text-text-secondary/60 text-center">
                                        3-10 characters &middot; Letters, numbers, underscore, hyphen, dot
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {children}
                </div>
            </main>
        </div>
    )
}
