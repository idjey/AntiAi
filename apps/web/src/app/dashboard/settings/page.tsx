'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Profile State
    const [profile, setProfile] = useState({
        displayName: '',
        handle: '',
        bio: '',
        avatarUrl: '',
        isPublic: false,
        plan: 'free',
        lastHandleChange: null as string | null,
        customDomain: null as string | null
    })

    // Handle Change State
    const [handleInput, setHandleInput] = useState('')
    const [handleAvailability, setHandleAvailability] = useState<{ available: boolean, reason: string | null } | null>(null)
    const [isCheckingHandle, setIsCheckingHandle] = useState(false)
    const [isUpdatingHandle, setIsUpdatingHandle] = useState(false)

    // Custom Domain State
    const [domainInput, setDomainInput] = useState('')
    const [isUpdatingDomain, setIsUpdatingDomain] = useState(false)

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                if (data.profile) {
                    setProfile({
                        displayName: data.profile.display_name || '',
                        handle: data.profile.handle || '',
                        bio: data.profile.bio || '',
                        avatarUrl: data.profile.avatar_url || '',
                        isPublic: data.profile.is_public || false,
                        plan: data.profile.plan || 'free',
                        lastHandleChange: data.profile.lastHandleChange || null,
                        customDomain: data.profile.customDomain || null
                    })
                    setHandleInput(data.profile.handle || '')
                    setDomainInput(data.profile.customDomain || '')
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    display_name: profile.displayName,
                    handle: profile.handle,
                    bio: profile.bio,
                    avatar_url: profile.avatarUrl,
                    is_public: profile.isPublic
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update profile')
            }

            setMessage({ type: 'success', text: 'Profile updated successfully' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsSaving(false)
        }
    }

    // Debounced Handle Checker
    useEffect(() => {
        if (!handleInput || handleInput === profile.handle) {
            setHandleAvailability(null)
            return
        }

        const checkAvailability = async () => {
            setIsCheckingHandle(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/check-handle/${handleInput}`)
                if (res.ok) {
                    const data = await res.json()
                    setHandleAvailability(data)
                }
            } catch (err) {
                console.error("Failed to check handle", err)
            } finally {
                setIsCheckingHandle(false)
            }
        }

        const timer = setTimeout(checkAvailability, 500)
        return () => clearTimeout(timer)
    }, [handleInput, profile.handle])

    const handleHandleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (handleInput === profile.handle) return

        setIsUpdatingHandle(true)
        setMessage(null)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/handle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ handle: handleInput })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to update handle')

            setMessage({ type: 'success', text: 'Handle updated successfully!' })
            setProfile(prev => ({ ...prev, handle: data.handle }))
            setHandleAvailability(null)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsUpdatingHandle(false)
        }
    }

    const handleDomainUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (domainInput === profile.customDomain) return

        setIsUpdatingDomain(true)
        setMessage(null)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/domain`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ customDomain: domainInput })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to update custom domain')

            setMessage({ type: 'success', text: 'Custom domain updated successfully!' })
            setProfile(prev => ({ ...prev, customDomain: data.customDomain }))
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsUpdatingDomain(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' })
            setIsSaving(false)
            return
        }

        if (passwordData.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
            setIsSaving(false)
            return
        }

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to change password')
            }

            setMessage({ type: 'success', text: 'Password changed successfully' })
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-text-secondary">Loading settings...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">Settings</h1>
                <p className="text-text-secondary">Manage your profile and account security</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'security'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    Security
                </button>
            </div>

            {/* Notification Message */}
            {message && (
                <div className={`p-4 rounded-lg border ${message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                    {/* Avatar Preview */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-surface-light border border-border flex items-center justify-center overflow-hidden">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-text-secondary uppercase">
                                    {profile.displayName?.substring(0, 2) || '??'}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Avatar URL</label>
                            <input
                                type="url"
                                value={profile.avatarUrl}
                                onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                            />
                            <p className="text-xs text-text-secondary">Paste a direct link to an image (we'll implement file upload later)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Display Name</label>
                            <input
                                type="text"
                                value={profile.displayName}
                                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                                placeholder="My Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">Bio</label>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            rows={3}
                            className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border">
                        <input
                            type="checkbox"
                            checked={profile.isPublic}
                            onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-transparent"
                        />
                        <div>
                            <p className="font-medium text-text-primary">Public Profile</p>
                            <p className="text-sm text-text-secondary">Allow everyone to see your profile and videos</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`btn-primary px-8 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            )}

            {/* Handle / Username Configuration (PRO/ELITE Only) */}
            {activeTab === 'profile' && (
                <div className="max-w-2xl mt-12 bg-surface border border-border rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Creator Handle</h2>
                            <p className="text-sm text-text-secondary mt-1">This is your unique URL identifier (antiai.me/handle)</p>
                        </div>
                        {['free', ''].includes(profile.plan) && (
                            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                PRO Feature
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleHandleUpdate} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-text-muted font-medium">antiai.me/</span>
                                <input
                                    type="text"
                                    value={handleInput}
                                    onChange={(e) => setHandleInput(e.target.value)}
                                    disabled={['free', ''].includes(profile.plan)}
                                    maxLength={10}
                                    className={`w-full bg-surface-dark border ${handleAvailability?.available === false ? 'border-red-500' : 'border-border'} rounded-lg pl-24 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    placeholder="your-handle"
                                />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="h-5">
                                    {isCheckingHandle && <span className="text-text-secondary">Checking availability...</span>}
                                    {!isCheckingHandle && handleAvailability && handleInput !== profile.handle && handleInput.length > 0 && (
                                        <span className={handleAvailability.available ? 'text-green-500' : 'text-red-500'}>
                                            {handleAvailability.available
                                                ? '✓ Handle is available'
                                                : `✗ ${handleAvailability.reason === 'invalid_format' ? 'Must be 3-10 characters (a-z, 0-9, -, _, .)' : 'Handle is taken'}`}
                                        </span>
                                    )}
                                </div>
                                <div className="text-text-muted">
                                    {handleInput.length}/10
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <h4 className="text-red-500 font-semibold mb-1">Warning: Broken Links</h4>
                            <p className="text-sm text-red-400/80">Changing your handle will instantly break any existing links pointing to your old profile URL. You can only change your handle <strong>once every 180 days</strong>.</p>
                        </div>

                        {['free', ''].includes(profile.plan) ? (
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard/billing')}
                                className="w-full btn-primary bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black border-none"
                            >
                                Upgrade to PRO to unlock
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isUpdatingHandle || handleInput === profile.handle || handleAvailability?.available === false}
                                className={`w-full btn-primary ${isUpdatingHandle || handleInput === profile.handle || handleAvailability?.available === false ? 'opacity-50 cursor-not-allowed border-gray-600 bg-gray-600/20 text-gray-400' : ''}`}
                            >
                                {isUpdatingHandle ? 'Updating...' : 'Change Handle'}
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Custom Domain Configuration (ELITE Only) */}
            {activeTab === 'profile' && (
                <div className="max-w-2xl mt-12 bg-surface border border-border rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">Custom Domain</h2>
                            <p className="text-sm text-text-secondary mt-1">Host your profile on your own website (e.g., verify.yourname.com)</p>
                        </div>
                        {['free', 'pro', ''].includes(profile.plan) && (
                            <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                ELITE Feature
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleDomainUpdate} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-text-muted font-medium">https://</span>
                                <input
                                    type="text"
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    disabled={['free', 'pro', ''].includes(profile.plan)}
                                    className={`w-full bg-surface-dark border border-border rounded-lg pl-20 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    placeholder="yourname.com"
                                />
                            </div>
                            <p className="text-xs text-text-secondary pt-1">To connect, go to your domain registrar (GoDaddy, Namecheap, etc.) and add a <strong>CNAME</strong> record pointing to <code className="bg-surface-light px-1 py-0.5 rounded text-primary">cname.antiai.me</code></p>
                        </div>

                        {['free', 'pro', ''].includes(profile.plan) ? (
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard/billing')}
                                className="w-full btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-none"
                            >
                                Upgrade to ELITE to unlock
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isUpdatingDomain || domainInput === profile.customDomain}
                                className={`w-full btn-primary ${isUpdatingDomain || domainInput === profile.customDomain ? 'opacity-50 cursor-not-allowed border-gray-600 bg-gray-600/20 text-gray-400' : ''}`}
                            >
                                {isUpdatingDomain ? 'Saving...' : 'Save Domain'}
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={8}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-secondary">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                minLength={8}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`btn-primary px-8 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
