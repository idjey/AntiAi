'use client'

import { useState, useEffect } from 'react'
import { Ticket, Plus, Send, Trash2, Edit3, X, Search, Tag, TrendingUp, Clock } from 'lucide-react'

const API = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const headers = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
})

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, active: 0, totalRedemptions: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<any>(null)
    const [sendingId, setSendingId] = useState<string | null>(null)

    // Form state
    const [form, setForm] = useState({
        code: '', description: '', discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: 25, maxRedemptions: '', expiresAt: ''
    })

    const fetchCoupons = async () => {
        setIsLoading(true)
        try {
            const [couponsRes, statsRes] = await Promise.all([
                fetch(`${API()}/admin/coupons`, { headers: headers() }),
                fetch(`${API()}/admin/coupons/stats`, { headers: headers() })
            ])
            const couponsData = await couponsRes.json()
            setCoupons(couponsData.data || [])
            setStats(await statsRes.json())
        } catch (err) { console.error(err) }
        finally { setIsLoading(false) }
    }

    useEffect(() => { fetchCoupons() }, [])

    const resetForm = () => {
        setForm({ code: '', description: '', discountType: 'percentage', discountValue: 25, maxRedemptions: '', expiresAt: '' })
        setEditingCoupon(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
                expiresAt: form.expiresAt || undefined
            }

            if (editingCoupon) {
                await fetch(`${API()}/admin/coupons/${editingCoupon.id}`, {
                    method: 'PATCH', headers: headers(), body: JSON.stringify(payload)
                })
            } else {
                await fetch(`${API()}/admin/coupons`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(payload)
                })
            }
            setShowCreateModal(false)
            resetForm()
            fetchCoupons()
        } catch (err) { console.error(err) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Deactivate this coupon?')) return
        await fetch(`${API()}/admin/coupons/${id}`, { method: 'DELETE', headers: headers() })
        fetchCoupons()
    }

    const handleSendToFree = async (id: string) => {
        if (!confirm('Send this coupon to ALL free-plan users? This will trigger emails.')) return
        setSendingId(id)
        try {
            const res = await fetch(`${API()}/admin/coupons/${id}/send`, { method: 'POST', headers: headers() })
            const result = await res.json()
            alert(`Sent to ${result.sent} out of ${result.total} free users.`)
        } catch (err) { console.error(err) }
        finally { setSendingId(null) }
    }

    const handleEdit = (coupon: any) => {
        setForm({
            code: coupon.code,
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxRedemptions: coupon.maxRedemptions?.toString() || '',
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : ''
        })
        setEditingCoupon(coupon)
        setShowCreateModal(true)
    }

    const isExpired = (c: any) => c.expiresAt && new Date(c.expiresAt) < new Date()
    const isMaxedOut = (c: any) => c.maxRedemptions && c.currentUses >= c.maxRedemptions

    const getStatusBadge = (c: any) => {
        if (!c.isActive) return <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase bg-gray-500/10 text-gray-500">Inactive</span>
        if (isExpired(c)) return <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase bg-red-500/10 text-red-500">Expired</span>
        if (isMaxedOut(c)) return <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase bg-amber-500/10 text-amber-500">Maxed Out</span>
        return <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase bg-emerald-500/10 text-emerald-500">Active</span>
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-surface p-6 rounded-xl border border-white/10">
                <div>
                    <h1 className="text-3xl font-bold font-mono tracking-tight text-white">Coupon <span className="text-amber-500 opacity-80">Manager</span></h1>
                    <p className="text-muted-foreground mt-1 font-mono text-sm text-white/50">Create, manage, and distribute discount codes</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreateModal(true) }}
                    className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Create Coupon
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Coupons', value: stats.total, icon: <Tag className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Active Coupons', value: stats.active, icon: <Ticket className="w-6 h-6" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Total Redemptions', value: stats.totalRedemptions, icon: <TrendingUp className="w-6 h-6" />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((card, i) => (
                    <div key={i} className="p-6 rounded-xl bg-surface border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>{card.icon}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-text-primary mb-1 font-mono tracking-tight">{card.value}</h3>
                        <p className="text-sm font-medium text-text-secondary">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Coupons Table */}
            <div className="p-6 rounded-xl bg-surface border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                        <Ticket className="w-5 h-5" />
                    </span>
                    <h2 className="text-lg font-bold font-mono tracking-tight">All Coupons</h2>
                </div>
                <div className="overflow-auto rounded-lg border border-white/5 max-h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-muted bg-white/5 uppercase sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Value</th>
                                <th className="px-4 py-3">Uses</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Expires</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length > 0 ? coupons.map((c: any) => (
                                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-amber-500 font-bold tracking-wider">{c.code}</td>
                                    <td className="px-4 py-3 text-text-primary capitalize">{c.discountType}</td>
                                    <td className="px-4 py-3 font-mono text-text-primary font-medium">
                                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-text-primary">
                                        {c.currentUses}{c.maxRedemptions ? `/${c.maxRedemptions}` : '/∞'}
                                    </td>
                                    <td className="px-4 py-3">{getStatusBadge(c)}</td>
                                    <td className="px-4 py-3 text-text-muted text-xs font-mono">
                                        {c.expiresAt ? (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(c.expiresAt).toLocaleDateString()}
                                            </div>
                                        ) : 'Never'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(c)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-blue-500 transition-colors"
                                                title="Edit"
                                            ><Edit3 className="w-4 h-4" /></button>
                                            <button
                                                onClick={() => handleSendToFree(c.id)}
                                                disabled={sendingId === c.id || !c.isActive || isExpired(c)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-emerald-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Send to Free Users"
                                            ><Send className="w-4 h-4" /></button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-red-500 transition-colors"
                                                title="Deactivate"
                                            ><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted font-mono">
                                        No coupons created yet. Click "Create Coupon" to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-mono">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors shadow-lg shadow-black/20">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Coupon Code</label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    placeholder="SUMMER25"
                                    required
                                    disabled={!!editingCoupon}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Description (optional)</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Summer sale discount"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-amber-500/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Discount Type</label>
                                    <select
                                        value={form.discountType}
                                        onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-amber-500/50 cursor-pointer"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">
                                        {form.discountType === 'percentage' ? 'Percentage Off' : 'Amount Off ($)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.discountValue}
                                        onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                        min={1}
                                        max={form.discountType === 'percentage' ? 100 : undefined}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Max Uses (empty = unlimited)</label>
                                    <input
                                        type="number"
                                        value={form.maxRedemptions}
                                        onChange={e => setForm(f => ({ ...f, maxRedemptions: e.target.value }))}
                                        placeholder="∞"
                                        min={1}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Expires At (optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.expiresAt}
                                        onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary rounded-lg text-sm font-medium transition-colors"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-lg text-sm font-bold transition-colors"
                                >{editingCoupon ? 'Save Changes' : 'Create Coupon'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
