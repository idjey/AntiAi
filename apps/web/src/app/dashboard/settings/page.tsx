'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AVAILABLE_CATEGORIES = [
    'Technology', 'Design', 'Lifestyle', 'Gaming', 'Education',
    'Comedy', 'Business', 'Art', 'Music', 'Fitness',
    'Finance', 'Food', 'Travel', 'Science', 'Sports'
]

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
        categories: [] as string[],
        plan: 'free',
        lastHandleChange: null as string | null,
        customDomain: null as string | null
    })

    const [lastDomainChange, setLastDomainChange] = useState<string | null>(null)

    // Handle Change State
    const [handleInput, setHandleInput] = useState('')
    const [handleAvailability, setHandleAvailability] = useState<{ available: boolean, reason: string | null } | null>(null)
    const [isCheckingHandle, setIsCheckingHandle] = useState(false)
    const [isUpdatingHandle, setIsUpdatingHandle] = useState(false)

    // Custom Domain State
    const [domainInput, setDomainInput] = useState('')
    const [isUpdatingDomain, setIsUpdatingDomain] = useState(false)
    const [isDomainConfirmDialogOpen, setIsDomainConfirmDialogOpen] = useState(false)
    const [domainConfirmInput, setDomainConfirmInput] = useState('')

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
                        categories: data.profile.categories || [],
                        avatarUrl: data.profile.avatar_url || '',
                        isPublic: data.profile.is_public || false,
                        plan: data.profile.plan || 'free',
                        lastHandleChange: data.profile.last_handle_change || null,
                        customDomain: data.profile.custom_domain || null
                    })
                    setLastDomainChange(data.profile.last_domain_change || null)
                    setHandleInput(data.profile.handle || '')
                    setDomainInput(data.profile.custom_domain || '')
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
                    categories: profile.categories,
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

    const onDomainFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (domainInput === profile.customDomain) return
        setIsDomainConfirmDialogOpen(true)
        setDomainConfirmInput('')
    }

    const handleDomainUpdate = async () => {
        if (domainInput === profile.customDomain || domainConfirmInput !== domainInput) return

        setIsDomainConfirmDialogOpen(false)
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
            setLastDomainChange(new Date().toISOString())
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsUpdatingDomain(false)
        }
    }

    const getDaysLeft = (lastChangeDate: string | null, cooldownDays: number) => {
        if (!lastChangeDate) return 0;
        const lastDate = new Date(lastChangeDate);
        const now = new Date();
        const diffTime = now.getTime() - lastDate.getTime();
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, cooldownDays - daysPassed);
    }

    const handleDaysLeft = getDaysLeft(profile.lastHandleChange, 180);
    const domainDaysLeft = getDaysLeft(lastDomainChange, 90);

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

                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <label className="block text-sm font-medium text-text-secondary">Categories</label>
                            <span className="text-xs text-text-muted">{profile.categories.length}/3 Selected</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_CATEGORIES.map(category => {
                                const isSelected = profile.categories.includes(category)
                                const isDisabled = !isSelected && profile.categories.length >= 3

                                return (
                                    <button
                                        type="button"
                                        key={category}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            setProfile(prev => ({
                                                ...prev,
                                                categories: isSelected
                                                    ? prev.categories.filter(c => c !== category)
                                                    : [...prev.categories, category]
                                            }))
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                                            ${isSelected
                                                ? 'bg-primary border-primary text-black scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                                : isDisabled
                                                    ? 'bg-surface border-border text-text-muted opacity-50 cursor-not-allowed'
                                                    : 'bg-surface border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
                                            }
                                        `}
                                    >
                                        {category}
                                    </button>
                                )
                            })}
                        </div>
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

                    <form onSubmit={onDomainFormSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-text-muted font-medium">https://</span>
                                <input
                                    type="text"
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    disabled={['free', 'pro', ''].includes(profile.plan) || domainDaysLeft > 0}
                                    className={`w-full bg-surface-dark border border-border rounded-lg pl-20 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    placeholder="yourname.com"
                                />
                            </div>
                            <p className="text-xs text-text-secondary pt-1">To connect, go to your domain registrar (GoDaddy, Namecheap, etc.) and add a <strong>CNAME</strong> record pointing to <code className="bg-surface-light px-1 py-0.5 rounded text-primary">cname.antiai.me</code></p>
                        </div>

                        {domainDaysLeft > 0 ? (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                <h4 className="text-orange-500 font-semibold mb-1 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Domain Locked
                                </h4>
                                <p className="text-sm text-orange-400/80">You recently changed your custom domain. You can change it again in <strong>{domainDaysLeft} days</strong>.</p>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <h4 className="text-red-500 font-semibold mb-1">Warning: Domain Lock</h4>
                                <p className="text-sm text-red-400/80">Changing your custom domain will break any existing links pointing to your old domain. You can only change your domain <strong>once every 90 days</strong>.</p>
                            </div>
                        )}

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
                                disabled={isUpdatingDomain || domainInput === profile.customDomain || domainDaysLeft > 0}
                                className={`w-full btn-primary ${isUpdatingDomain || domainInput === profile.customDomain || domainDaysLeft > 0 ? 'opacity-50 cursor-not-allowed border-gray-600 bg-gray-600/20 text-gray-400' : ''}`}
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

            {/* Verification Dialog for Custom Domains */}
            {isDomainConfirmDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-surface-dark border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-2">Confirm Custom Domain</h3>
                        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                            You are about to change your domain to <strong className="text-primary">{domainInput}</strong>.
                            If you make a typo, you will be locked out from changing this again for <strong>90 days</strong>.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Type <strong className="text-white select-none">{domainInput}</strong> below to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={domainConfirmInput}
                                    onChange={(e) => setDomainConfirmInput(e.target.value)}
                                    className="w-full bg-black/50 border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                                    placeholder={domainInput}
                                    autoComplete="off"
                                    spellCheck="false"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDomainConfirmDialogOpen(false)
                                        setDomainConfirmInput('')
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDomainUpdate}
                                    disabled={domainConfirmInput !== domainInput}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors ${domainConfirmInput !== domainInput ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Yes, I'm sure
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
