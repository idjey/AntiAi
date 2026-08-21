'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { OrgRoleProvider } from '@/components/providers/OrgRoleProvider'
import OrganizationSwitcher from '@/components/dashboard/OrganizationSwitcher'

export default function OrganizationLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { orgId: string }
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [role, setRole] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [orgName, setOrgName] = useState<string>('')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        let isMounted = true
        const fetchRole = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) {
                    router.push('/login')
                    return
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const res = await fetch(`${apiUrl}/organizations/${params.orgId}/members/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (!res.ok) {
                    if (res.status === 403 || res.status === 404) {
                        // UX Guard: Redirect to prevent a flash of unauthorized UI
                        router.push('/dashboard')
                        return
                    }
                    throw new Error('Failed to fetch role')
                }

                const data = await res.json()
                if (isMounted) {
                    setRole(data.role)
                    setOrgName(data.organization?.name || 'Organization')
                    setIsLoading(false)
                }
            } catch (err) {
                console.error(err)
                if (isMounted) {
                    router.push('/dashboard')
                }
            }
        }

        fetchRole()
        
        return () => {
            isMounted = false
        }
    }, [params.orgId, router])

    if (isLoading || !role) {
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

    const navItems = [
        { name: 'Dashboard', href: `/orgs/${params.orgId}` },
        { name: 'Team', href: `/orgs/${params.orgId}/settings/team` },
        { name: 'Settings', href: `/orgs/${params.orgId}/settings` },
    ]

    return (
        <OrgRoleProvider role={role} organizationId={params.orgId}>
            <div className="flex h-screen bg-[#0C0C0C] text-white overflow-hidden selection:bg-white/10">
                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-[240px] flex-col border-r border-white/10 bg-[#0A0A0A]">
                    <div className="p-6 pb-2">
                        <OrganizationSwitcher currentOrgId={params.orgId} />
                    </div>
                    <nav className="flex-1 px-4 space-y-1">
                        {navItems.map(item => {
                            const isActive = pathname === item.href
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        isActive 
                                            ? 'bg-white/10 text-white font-medium' 
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header className="h-16 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-6 lg:hidden">
                        <span className="font-semibold">{orgName}</span>
                    </header>
                    
                    <main className="flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="h-full">
                            {/* Children are ONLY rendered after role resolves */}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </OrgRoleProvider>
    )
}
