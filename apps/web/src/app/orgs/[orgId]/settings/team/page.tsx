'use client'

import { useState, useEffect } from 'react'
import { useOrgRole } from '@/components/providers/OrgRoleProvider'
import { Toaster, toast } from 'sonner'
import Modal from '@/components/Modal'
import { useRouter } from 'next/navigation'

export default function TeamManagementPage({ params }: { params: { orgId: string } }) {
    const { role } = useOrgRole()
    const router = useRouter()
    
    const [members, setMembers] = useState<any[]>([])
    const [pendingInvites, setPendingInvites] = useState<any[]>([])
    const [maxSeats, setMaxSeats] = useState<number>(5)
    const [isLoading, setIsLoading] = useState(true)

    // Modals state
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    
    // Action states
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('CREATOR')
    const [isInviting, setIsInviting] = useState(false)
    
    const [transferTargetId, setTransferTargetId] = useState('')
    const [transferConfirm, setTransferConfirm] = useState('')
    const [isTransferring, setIsTransferring] = useState(false)
    
    const [isBuyingSeats, setIsBuyingSeats] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null)

    const fetchTeam = async () => {
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/organizations/${params.orgId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch organization data')
            const data = await res.json()
            setMembers(data.teamMembers || [])
            setPendingInvites(data.pendingInvites || [])
            setMaxSeats(data.maxSeats || 5)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load team members')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTeam()
    }, [params.orgId])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsInviting(true)
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/organizations/${params.orgId}/invites`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to send invite')
            }
            
            toast.success('Invite sent successfully')
            setIsInviteModalOpen(false)
            setInviteEmail('')
            setInviteRole('CREATOR')
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsInviting(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return
        
        setIsActionLoading(`remove-${userId}`)
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/organizations/${params.orgId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to remove member')
            }
            
            toast.success('Member removed')
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleChangeRole = async (userId: string, newRole: string) => {
        setIsActionLoading(`role-${userId}`)
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/organizations/${params.orgId}/members/${userId}/role`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to change role')
            }
            
            toast.success('Role updated')
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleTransferOwnership = async (e: React.FormEvent) => {
        e.preventDefault()
        if (transferConfirm !== 'TRANSFER') {
            toast.error('Please type TRANSFER to confirm')
            return
        }
        
        setIsTransferring(true)
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/organizations/${params.orgId}/transfer-ownership`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetUserId: transferTargetId })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to transfer ownership')
            }
            
            toast.success('Ownership transferred successfully')
            setIsTransferModalOpen(false)
            setTransferTargetId('')
            setTransferConfirm('')
            // Force reload to reflect demotion to ADMIN
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsTransferring(false)
        }
    }

    const handleBuySeats = async () => {
        setIsBuyingSeats(true)
        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/organizations/${params.orgId}/buy-seats`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: 5 })
            })
            
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to buy seats')
            }
            
            toast.success('Seats added successfully!')
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsBuyingSeats(false)
        }
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="h-8 w-32 bg-white/10 animate-pulse rounded mb-8"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    const canInvite = role === 'OWNER' || role === 'ADMIN'
    const canManageRoles = role === 'OWNER'
    const canTransferOwnership = role === 'OWNER'
    
    // Admins can remove anyone EXCEPT Owners. Owners can remove anyone.
    const canRemove = (targetRole: string) => {
        if (role === 'OWNER') return true
        if (role === 'ADMIN' && targetRole !== 'OWNER') return true
        return false
    }

    const usedSeats = members.length + pendingInvites.length;
    const isFull = usedSeats >= maxSeats;

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Team Management</h1>
                    <p className="text-white/60 text-sm mt-1">Manage members and roles for this organization.</p>
                </div>
                {canInvite && (
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        disabled={isFull}
                        title={isFull ? "Seat limit reached" : ""}
                        className="bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-white/90 disabled:opacity-50 transition-colors"
                    >
                        Invite Member
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Seat Limit UI */}
                <div className="bg-[#111111] border border-white/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="font-semibold">Seat Usage</h2>
                            <p className="text-sm text-white/60">
                                You are currently using {usedSeats} of {maxSeats} available seats.
                            </p>
                        </div>
                        {role === 'OWNER' && (
                            <button
                                onClick={handleBuySeats}
                                disabled={isBuyingSeats}
                                className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors text-white font-medium disabled:opacity-50"
                            >
                                {isBuyingSeats ? 'Processing...' : 'Buy 5 More Seats'}
                            </button>
                        )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-2.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${Math.min((usedSeats / maxSeats) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <h2 className="font-semibold">Active Members</h2>
                    </div>
                    <div className="divide-y divide-white/10">
                        {members.map(member => (
                            <div key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center text-white/80 font-medium">
                                        {member.user?.profile?.display_name?.charAt(0).toUpperCase() || member.user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white/90">{member.user?.profile?.display_name || 'Anonymous User'}</p>
                                        <p className="text-sm text-white/50">{member.user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {canManageRoles ? (
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                                            disabled={isActionLoading === `role-${member.userId}`}
                                            className="bg-[#1A1A1A] border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/30"
                                        >
                                            <option value="OWNER">Owner</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="CREATOR">Creator</option>
                                        </select>
                                    ) : (
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70">
                                            {member.role}
                                        </div>
                                    )}
                                    
                                    {canTransferOwnership && member.role !== 'OWNER' && (
                                        <button 
                                            onClick={() => {
                                                setTransferTargetId(member.userId)
                                                setIsTransferModalOpen(true)
                                            }}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Make Owner
                                        </button>
                                    )}

                                    {canRemove(member.role) && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            disabled={isActionLoading === `remove-${member.userId}`}
                                            className="text-sm text-red-400 hover:text-red-300 transition-colors px-2"
                                        >
                                            {isActionLoading === `remove-${member.userId}` ? '...' : 'Remove'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {pendingInvites.length > 0 && (
                    <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                            <h2 className="font-semibold text-white/80">Pending Invites</h2>
                        </div>
                        <div className="divide-y divide-white/10">
                            {pendingInvites.map(invite => (
                                <div key={invite.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white/90">{invite.email}</p>
                                            <p className="text-sm text-white/50">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70">
                                            {invite.role} (Pending)
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Member">
                <form onSubmit={handleInvite} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                            placeholder="colleague@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Role</label>
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                        >
                            <option value="CREATOR">Creator (Read & Create)</option>
                            <option value="ADMIN">Admin (Manage Team)</option>
                            {role === 'OWNER' && <option value="OWNER">Owner (Full Control)</option>}
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsInviteModalOpen(false)}
                            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isInviting}
                            className="px-4 py-2 text-sm bg-white text-black rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
                        >
                            {isInviting ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Transfer Ownership Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Ownership">
                <form onSubmit={handleTransferOwnership} className="p-6 space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                        <h4 className="text-red-400 font-medium mb-1">Danger Zone</h4>
                        <p className="text-sm text-red-400/80">
                            Transferring ownership will demote you to an Admin. You will lose the ability to manage other Owners or delete the organization.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                            Type <span className="font-mono text-white bg-white/10 px-1 rounded">TRANSFER</span> to confirm
                        </label>
                        <input 
                            type="text" 
                            required 
                            value={transferConfirm}
                            onChange={e => setTransferConfirm(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                            placeholder="TRANSFER"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsTransferModalOpen(false)}
                            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isTransferring || transferConfirm !== 'TRANSFER'}
                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                            {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Toaster theme="dark" />
        </div>
    )
}
