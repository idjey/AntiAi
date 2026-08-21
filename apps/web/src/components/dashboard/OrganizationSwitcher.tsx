'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrganizationSwitcher({ currentOrgId }: { currentOrgId?: string }) {
    const router = useRouter()
    const [organizations, setOrganizations] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const res = await fetch(`${apiUrl}/users/me/organizations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (res.ok) {
                    const data = await res.json()
                    setOrganizations(data || [])
                }
            } catch (err) {
                console.error('Failed to fetch organizations:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrgs()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const currentOrg = organizations.find(o => o.organization.id === currentOrgId)

    if (isLoading) {
        return (
            <div className="h-10 w-full bg-white/5 animate-pulse rounded-lg mb-4"></div>
        )
    }

    return (
        <div className="relative mb-6" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold">{currentOrg ? currentOrg.organization.name.charAt(0) : 'P'}</span>
                    </div>
                    <span className="text-sm font-medium truncate">
                        {currentOrg ? currentOrg.organization.name : 'Personal Account'}
                    </span>
                </div>
                <svg className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        <Link
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                                !currentOrgId ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="w-6 h-6 rounded bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-white">P</span>
                            </div>
                            <span className="truncate">Personal Account</span>
                            {!currentOrgId && <svg className="w-4 h-4 ml-auto text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </Link>

                        {organizations.length > 0 && <div className="h-px bg-white/10 my-2" />}

                        {organizations.map((org) => {
                            const isSelected = currentOrgId === org.organization.id
                            return (
                                <Link
                                    key={org.organization.id}
                                    href={`/orgs/${org.organization.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                                        isSelected ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <div className="w-6 h-6 rounded bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-white/80">{org.organization.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <span className="truncate leading-tight">{org.organization.name}</span>
                                        <span className="text-[10px] text-white/40">{org.role}</span>
                                    </div>
                                    {isSelected && <svg className="w-4 h-4 ml-auto text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </Link>
                            )
                        })}
                    </div>
                    <div className="p-2 border-t border-white/10 bg-white/[0.02]">
                        <Link 
                            href="/dashboard/settings" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Organization
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
