'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ApiKey {
    id: string;
    name: string;
    lastUsed: string | null;
    createdAt: string;
}

interface ApiUsage {
    apiCallsThisMonth: number;
    apiCallsPerMonth: number | -1; // -1 means unlimited
    plan: string;
}

export default function ApiKeysPage() {
    const router = useRouter()
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [usage, setUsage] = useState<ApiUsage | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [generatedKey, setGeneratedKey] = useState<string | null>(null)
    const [isKeyVisible, setIsKeyVisible] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return router.push('/login')

            // Fetch Usage
            const usageRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api-keys/usage`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!usageRes.ok) throw new Error('Failed to fetch usage')
            const usageData = await usageRes.json()
            setUsage(usageData)

            // Fetch Keys
            const keysRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api-keys`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!keysRes.ok) throw new Error('Failed to fetch keys')
            const keysData = await keysRes.json()
            setKeys(keysData)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newKeyName.trim()) return

        setIsCreating(true)
        setError('')
        setSuccess('')
        setGeneratedKey(null)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api-keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newKeyName })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to create API key')

            setGeneratedKey(data.rawKey) // Only shown once!
            setIsKeyVisible(true) // Show key initially or hide? User says "hide/unhide", usually we show it by default so they can copy it.
            setNewKeyName('')
            fetchData()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsCreating(false)
        }
    }

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? Any applications using it will immediately stop working.')) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api-keys/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Failed to revoke API key')

            setSuccess('API key revoked successfully')
            setKeys(keys.filter(k => k.id !== id))
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleBuyQuota = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/billing/checkout/api-quota`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    return_url: window.location.href
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to initiate checkout')

            window.location.href = data.url
        } catch (err: any) {
            setError(err.message)
        }
    }

    if (isLoading) {
        return <div className="text-white p-8">Loading API Keys...</div>
    }

    const hasApiAccess = usage && ['business', 'elite', 'enterprise'].includes(usage.plan);

    if (!hasApiAccess) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-surface-dark border border-border p-8 rounded-2xl text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Developer API Access</h2>
                    <p className="text-text-secondary max-w-lg mx-auto">
                        The Developer API is available on Business, Elite, and Enterprise plans. Upgrade your plan to generate API keys and automate your verification workflows.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard/billing')}
                        className="px-6 py-3 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Upgrade Plan
                    </button>
                </div>
            </div>
        )
    }

    const isUnlimited = usage?.apiCallsPerMonth === -1;
    const usagePercent = isUnlimited ? 0 : Math.min(100, ((usage?.apiCallsThisMonth || 0) / (usage?.apiCallsPerMonth || 1)) * 100);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Developer API Keys</h1>
                    <p className="text-text-secondary">Manage your API keys for automating content verification.</p>
                </div>
                <a
                    href="https://antiai.me/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    API Documentation
                </a>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                    {success}
                </div>
            )}

            {/* Quota Tracking */}
            <div className="bg-surface-dark border border-border p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">API Quota Usage</h3>
                        <p className="text-sm text-text-secondary mt-1">Your monthly API request limit.</p>
                    </div>
                    {!isUnlimited && (
                        <button
                            onClick={handleBuyQuota}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                        >
                            Buy Extra Quota
                        </button>
                    )}
                </div>

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-medium">
                            {usage?.apiCallsThisMonth.toLocaleString()} calls used
                        </span>
                        <span className="text-text-secondary">
                            {isUnlimited ? 'Unlimited' : `${usage?.apiCallsPerMonth.toLocaleString()} limit`}
                        </span>
                    </div>
                    {!isUnlimited && (
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Generate New Key */}
            <div className="bg-surface-dark border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">Generate New Key</h3>
                <form onSubmit={handleCreateKey} className="flex gap-4">
                    <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Key Name (e.g. Production Server)"
                        className="flex-1 bg-black/50 border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isCreating ? 'Generating...' : 'Generate Key'}
                    </button>
                </form>

                {generatedKey && (
                    <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
                        <p className="text-green-400 font-bold">Key Generated Successfully!</p>
                        <p className="text-sm text-text-secondary">Please copy this key now. You will not be able to see it again.</p>
                        <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 bg-black/50 p-3 rounded border border-green-500/20 text-green-400 select-all font-mono break-all">
                                {isKeyVisible ? generatedKey : '•'.repeat(40)}
                            </code>
                            <button
                                type="button"
                                onClick={() => setIsKeyVisible(!isKeyVisible)}
                                className="px-4 py-3 bg-white/5 rounded hover:bg-white/10 transition-colors border border-white/10"
                            >
                                {isKeyVisible ? 'Hide' : 'Show'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey)
                                    setSuccess('Key copied to clipboard!')
                                }}
                                className="px-4 py-3 bg-white/5 rounded hover:bg-white/10 transition-colors border border-white/10"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Key List */}
            <div className="bg-surface-dark border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-text-secondary text-sm">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Created</th>
                            <th className="px-6 py-4 font-medium">Last Used</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {keys.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                    No API keys generated yet.
                                </td>
                            </tr>
                        ) : (
                            keys.map(key => (
                                <tr key={key.id} className="text-sm">
                                    <td className="px-6 py-4 text-white font-medium">{key.name}</td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        {new Date(key.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleRevokeKey(key.id)}
                                            className="text-red-400 hover:text-red-300 font-medium transition-colors"
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
