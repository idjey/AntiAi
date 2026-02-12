'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SocialIcon, getIconType } from '@/components/SocialIcon';

interface CreatorLink {
    id: string;
    label: string;
    url: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
}

interface Profile {
    handle: string;
    display_name: string;
    avatar_url: string;
    appearance?: {
        theme?: string;
        primary_color?: string;
        background_color?: string;
        icon_style?: 'monochrome' | 'color';
    };
}

export default function CreatorCardPage() {
    const [links, setLinks] = useState<CreatorLink[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Filter/Tab State
    const [activeTab, setActiveTab] = useState<'links' | 'appearance'>('links');

    // Appearance State
    const [appearance, setAppearance] = useState({
        theme: 'modern_dark',
        primary_color: '#10b981',
        background_color: '#000000',
        icon_style: 'monochrome' as 'monochrome' | 'color'
    });

    // Form State (Links)
    const [showForm, setShowForm] = useState(false);
    const [editingLink, setEditingLink] = useState<CreatorLink | null>(null);
    const [formData, setFormData] = useState({ label: '', url: '', icon: '' });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (profile?.appearance) {
            setAppearance(prev => ({ ...prev, ...profile.appearance }));
        }
    }, [profile]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch Profile
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.profile);
            }

            // Fetch Links
            const linksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (linksRes.ok) {
                const data = await linksRes.json();
                setLinks(data.items);
            }
        } catch (err) {
            console.error('Failed to fetch creator card data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        const icon = getIconType(url);
        setFormData(prev => ({ ...prev, url, icon }));
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');
            const url = editingLink
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links/${editingLink.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links`;

            const method = editingLink ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchData(); // Refresh list
                setShowForm(false);
                setEditingLink(null);
                setFormData({ label: '', url: '', icon: '' });
            }
        } catch (err) {
            console.error('Failed to save link', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAppearanceSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appearance: appearance
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                alert('Appearance saved!');
            }
        } catch (err) {
            console.error('Failed to save appearance', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setLinks(links.filter(l => l.id !== id));
        } catch (err) {
            console.error('Failed to delete link', err);
        }
    };

    const openEdit = (link: CreatorLink) => {
        setEditingLink(link);
        setFormData({
            label: link.label,
            url: link.url,
            icon: link.icon || getIconType(link.url)
        });
        setShowForm(true);
    };

    const copyLink = () => {
        if (!profile) return;
        const url = `${window.location.origin}/${profile.handle}`;
        navigator.clipboard.writeText(url);
        alert('Copied to clipboard!');
    };

    if (isLoading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    const publicUrl = profile ? `${window.location.origin}/${profile.handle}` : '';

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex gap-8">
            {/* Left: Editor */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Creator Card</h1>
                        <p className="text-text-secondary">Manage your links and public profile</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'links' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Links
                        {activeTab === 'links' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'appearance' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Appearance
                        {activeTab === 'appearance' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {activeTab === 'links' ? (
                    <div className="space-y-4">
                        {/* Share Card */}
                        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-text-primary">Share your card</h2>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text-secondary truncate">
                                    {publicUrl}
                                </div>
                                <button onClick={copyLink} className="btn-secondary whitespace-nowrap">
                                    Copy Link
                                </button>
                                <Link href={`/${profile?.handle}`} target="_blank" className="btn-primary whitespace-nowrap">
                                    Open
                                </Link>
                            </div>
                        </div>

                        {/* Links Manager */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary">Links</h2>
                            <button
                                onClick={() => {
                                    setEditingLink(null);
                                    setFormData({ label: '', url: '', icon: '' });
                                    setShowForm(true);
                                }}
                                className="btn-primary text-sm"
                            >
                                + Add Link
                            </button>
                        </div>

                        {showForm && (
                            <form onSubmit={handleLinkSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                <h3 className="font-bold text-text-primary">{editingLink ? 'Edit Link' : 'Add New Link'}</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">URL</label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                required
                                                value={formData.url}
                                                onChange={handleUrlChange}
                                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                                                placeholder="https://example.com"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                                <SocialIcon type={formData.icon} url={formData.url} className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Label</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.label}
                                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                                            placeholder="My Website"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 rounded-lg font-medium text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="btn-primary"
                                    >
                                        {isSaving ? 'Saving...' : (editingLink ? 'Update' : 'Add')}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3">
                            {links.length === 0 && !showForm && (
                                <div className="text-center py-12 text-text-secondary bg-surface/50 rounded-xl border border-dashed border-border">
                                    No links yet. Add your first link to get started!
                                </div>
                            )}

                            {links.map(link => (
                                <div key={link.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-text-secondary overflow-hidden">
                                            <SocialIcon type={link.icon} url={link.url} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-primary">{link.label}</h4>
                                            <p className="text-sm text-text-secondary truncate max-w-[200px]">{link.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(link)}
                                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-light rounded-lg"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-surface-light rounded-lg"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
                            <h2 className="text-lg font-bold text-text-primary">Theme & Colors</h2>

                            {/* Theme Selector */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Theme</label>
                                    <select
                                        value={appearance.theme}
                                        onChange={(e) => setAppearance(prev => ({ ...prev, theme: e.target.value }))}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                                    >
                                        <option value="modern_dark">Modern Dark</option>
                                        <option value="holographic">3D Holographic</option>
                                        <option value="minimal">Minimal</option>
                                    </select>
                                </div>

                                {/* Icon Style */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Icons</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAppearance(prev => ({ ...prev, icon_style: 'monochrome' }))}
                                            className={`flex-1 py-2 px-4 rounded-lg border ${appearance.icon_style === 'monochrome' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text-secondary'}`}
                                        >
                                            Monochrome
                                        </button>
                                        <button
                                            onClick={() => setAppearance(prev => ({ ...prev, icon_style: 'color' }))}
                                            className={`flex-1 py-2 px-4 rounded-lg border ${appearance.icon_style === 'color' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text-secondary'}`}
                                        >
                                            Color
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Primary Color */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Primary Color</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={appearance.primary_color}
                                            onChange={(e) => setAppearance(prev => ({ ...prev, primary_color: e.target.value }))}
                                            className="w-12 h-12 rounded-lg border border-border bg-transparent cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={appearance.primary_color}
                                            onChange={(e) => setAppearance(prev => ({ ...prev, primary_color: e.target.value }))}
                                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text-primary uppercase"
                                        />
                                    </div>
                                </div>

                                {/* Background Color */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Background Color</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={appearance.background_color}
                                            onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))}
                                            className="w-12 h-12 rounded-lg border border-border bg-transparent cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={appearance.background_color}
                                            onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))}
                                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text-primary uppercase"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleAppearanceSave}
                                disabled={isSaving}
                                className="btn-primary w-full md:w-auto"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Mobile Preview */}
            <div className="hidden xl:block w-[400px] flex-shrink-0">
                <div className="sticky top-8">
                    <div className="bg-black rounded-[3rem] border-[8px] border-surface-light p-2 shadow-2xl h-[700px] relative overflow-hidden">
                        {/* Phone Notch */}
                        <div className="absolute top-0 inset-x-0 h-6 bg-surface-light rounded-b-xl w-40 mx-auto z-20"></div>

                        {/* Preview Iframe content */}
                        <div
                            className="w-full h-full rounded-[2.2rem] overflow-hidden overflow-y-auto no-scrollbar pb-8 relative"
                            style={{
                                backgroundColor: appearance.background_color,
                                color: appearance.background_color === '#ffffff' ? '#000000' : '#ffffff'
                            }}
                        >
                            {/* Theme Effects */}
                            {appearance.theme === 'holographic' && (
                                <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-teal-500/20" />
                            )}

                            {/* Cover Banner */}
                            <div
                                className="h-32 w-full relative"
                                style={{
                                    background: `linear-gradient(to bottom right, ${appearance.primary_color}40, ${appearance.primary_color}10)`
                                }}
                            >
                                {profile?.avatar_url && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full p-1" style={{ backgroundColor: appearance.background_color }}>
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: appearance.primary_color }}>
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )}
                                {!profile?.avatar_url && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full p-1" style={{ backgroundColor: appearance.background_color }}>
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold border-2" style={{ borderColor: appearance.primary_color, backgroundColor: '#202020', color: appearance.primary_color }}>
                                            {profile?.display_name?.substring(0, 2) || '??'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 text-center px-6" style={{ position: 'relative', zIndex: 10 }}>
                                <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                    {profile?.display_name || 'Your Name'}
                                    <svg className="w-4 h-4" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                </h3>
                                <p className="text-sm opacity-60">@{profile?.handle || 'handle'}</p>
                            </div>

                            <div className="mt-8 px-6 space-y-3 relative z-10">
                                {links.map(link => (
                                    <div
                                        key={link.id}
                                        className="w-full p-4 rounded-xl flex items-center gap-4 transition-all cursor-pointer group"
                                        style={{
                                            backgroundColor: appearance.background_color === '#000000' ? '#181818' : 'rgba(255,255,255,0.1)',
                                            border: `1px solid ${appearance.primary_color}40`
                                        }}
                                    >
                                        <div className="transition-colors">
                                            <SocialIcon type={link.icon} url={link.url} variant={appearance.icon_style} className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium flex-1 text-center pr-6">{link.label}</span>
                                    </div>
                                ))}
                                {links.length === 0 && (
                                    <div className="text-center text-xs opacity-50 py-4">Add links to see them here</div>
                                )}
                            </div>

                            <div className="mt-8 text-center pb-8">
                                <span className="text-[10px] uppercase tracking-widest opacity-40">Verified by AntiAI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
