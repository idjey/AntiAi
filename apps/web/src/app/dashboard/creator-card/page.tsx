'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SocialIcon, getIconType } from '@/components/SocialIcon';
import { ImageUpload } from '@/components/ImageUpload';

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
        logo_url?: string;
        logo_position?: 'center_top' | 'top_left' | 'top_right' | 'center' | 'bottom_left' | 'bottom_right' | 'scatter';
        logo_opacity?: number;
        logo_count?: number;
        scatter_style?: 'random' | 'grid' | 'circle';
        background_image?: string;
        // Public Page Background
        public_background_type?: 'color' | 'gradient' | 'image';
        public_background_color?: string;
        public_background_gradient?: string;
        public_background_image?: string;
        public_background_overlay?: number;
        public_background_blur?: number;
    };
}

export default function CreatorCardPage() {
    const [links, setLinks] = useState<CreatorLink[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifyingLogo, setIsVerifyingLogo] = useState(false);
    const [logoUrlError, setLogoUrlError] = useState<string | null>(null);

    // Filter/Tab State
    const [activeTab, setActiveTab] = useState<'links' | 'appearance'>('links');

    // Appearance State
    const [appearance, setAppearance] = useState({
        theme: 'modern_dark',
        primary_color: '#10b981',
        background_color: '#000000',
        icon_style: 'monochrome' as 'monochrome' | 'color',
        logo_url: '',
        logo_position: 'center_top' as 'center_top' | 'top_left' | 'top_right' | 'center' | 'bottom_left' | 'bottom_right' | 'scatter',
        logo_opacity: 0.2,
        logo_count: 12,
        scatter_style: 'random' as 'random' | 'grid' | 'circle',
        background_image: '',
        // Public Page Defaults
        public_background_type: 'color' as 'color' | 'gradient' | 'image',
        public_background_color: '#000000',
        public_background_gradient: 'linear-gradient(to bottom right, #000000, #1a1a1a)',
        public_background_image: '',
        public_background_overlay: 40,
        public_background_blur: 0,
        public_background_vignette: 0,
        public_background_grain: 0,
        public_card_theme: 'dark' as 'light' | 'dark',
        public_card_glow: 0
    });

    // Scatter Pattern State
    const [scatterPositions, setScatterPositions] = useState<Array<{ top: number, left: number, rotate: number }>>([]);

    const generateScatterPositions = (count: number, style: string) => {
        let newPositions: Array<{ top: number, left: number, rotate: number }> = [];

        if (style === 'grid') {
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            for (let i = 0; i < count; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                newPositions.push({
                    top: (row / rows) * 100 + (100 / rows / 2),
                    left: (col / cols) * 100 + (100 / cols / 2),
                    rotate: 0
                });
            }
        } else if (style === 'circle') {
            const radius = 35; // %
            const centerX = 50;
            const centerY = 50;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * 2 * Math.PI;
                newPositions.push({
                    top: centerY + radius * Math.sin(angle),
                    left: centerX + radius * Math.cos(angle),
                    rotate: (angle * 180 / Math.PI) + 90
                });
            }
        } else {
            // Random
            newPositions = Array(count).fill(0).map(() => ({
                top: Math.random() * 90 + 5,
                left: Math.random() * 90 + 5,
                rotate: Math.random() * 360
            }));
        }
        setScatterPositions(newPositions);
    };

    // Update positions when appearance settings change
    useEffect(() => {
        if (appearance.logo_position === 'scatter') {
            generateScatterPositions(appearance.logo_count || 12, appearance.scatter_style || 'random');
        }
    }, [appearance.logo_count, appearance.scatter_style, appearance.logo_position]);

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

    const handleRandomize = () => {
        const themes = ['modern_dark', 'holographic', 'minimal'];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        const generateRandomColor = () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        };

        const randomPrimary = generateRandomColor();
        const randomBackground = generateRandomColor();

        const iconStyles = ['monochrome', 'color'];
        const randomIconStyle = iconStyles[Math.floor(Math.random() * iconStyles.length)];

        setAppearance(prev => ({
            ...prev,
            theme: randomTheme,
            primary_color: randomPrimary,
            background_color: randomBackground,
            icon_style: randomIconStyle as any
        }));
    };

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
                            {/* Card Appearance Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-text-primary">Card Appearance</h2>
                                <button
                                    onClick={handleRandomize}
                                    className="text-sm px-3 py-1.5 bg-surface-light border border-border text-text-primary rounded-lg hover:border-primary transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Randomize</span>
                                </button>
                            </div>

                            {/* Background Type Tabs */}
                            <div className="flex p-1 bg-surface-dark rounded-lg border border-border">
                                {['color', 'gradient', 'image'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setAppearance(prev => ({ ...prev, public_background_type: t as 'color' | 'gradient' | 'image' }))}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${appearance.public_background_type === t ? 'bg-background text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Color Input */}
                            {appearance.public_background_type === 'color' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Background Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={appearance.public_background_color || '#000000'}
                                            onChange={(e) => setAppearance(prev => ({ ...prev, public_background_color: e.target.value }))}
                                            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={appearance.public_background_color || '#000000'}
                                            onChange={(e) => setAppearance(prev => ({ ...prev, public_background_color: e.target.value }))}
                                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary uppercase font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Gradient Input */}
                            {appearance.public_background_type === 'gradient' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">CSS Gradient</label>
                                    <input
                                        type="text"
                                        value={appearance.public_background_gradient || ''}
                                        onChange={(e) => setAppearance(prev => ({ ...prev, public_background_gradient: e.target.value }))}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary font-mono text-xs"
                                        placeholder="linear-gradient(to right, #000000, #434343)"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            'linear-gradient(to bottom right, #1a2a6c, #b21f1f, #fdbb2d)',
                                            'linear-gradient(to bottom right, #000000, #434343)',
                                            'linear-gradient(to right, #8360c3, #2ebf91)',
                                            'linear-gradient(to right, #fc5c7d, #6a82fb)'
                                        ].map(grad => (
                                            <button
                                                key={grad}
                                                onClick={() => setAppearance(prev => ({ ...prev, public_background_gradient: grad }))}
                                                className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform"
                                                style={{ background: grad }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Image Input */}
                            {appearance.public_background_type === 'image' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Background Image</label>
                                    <div className="flex items-start gap-4">
                                        {appearance.public_background_image ? (
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                                                <img src={appearance.public_background_image} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setAppearance(prev => ({ ...prev, public_background_image: '' }))}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : null}
                                        <ImageUpload
                                            onUpload={(url) => setAppearance(prev => ({ ...prev, public_background_image: url }))}
                                            maxDimension={3840}
                                        >
                                            <button className="text-sm px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-colors">
                                                {appearance.public_background_image ? 'Replace Image' : 'Upload Image'}
                                            </button>
                                        </ImageUpload>
                                    </div>
                                </div>
                            )}

                            {/* Effects (Overlay, Blur, Vignette, Grain) */}
                            <div className="space-y-4 pt-2 border-t border-border/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Dark Overlay</span>
                                            <span className="font-mono text-text-primary">{appearance.public_background_overlay}%</span>
                                        </div>
                                        <input type="range" min="0" max="90" value={appearance.public_background_overlay} onChange={(e) => setAppearance(prev => ({ ...prev, public_background_overlay: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Blur Amount</span>
                                            <span className="font-mono text-text-primary">{appearance.public_background_blur}px</span>
                                        </div>
                                        <input type="range" min="0" max="50" value={appearance.public_background_blur} onChange={(e) => setAppearance(prev => ({ ...prev, public_background_blur: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Vignette</span>
                                            <span className="font-mono text-text-primary">{appearance.public_background_vignette || 0}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={appearance.public_background_vignette || 0} onChange={(e) => setAppearance(prev => ({ ...prev, public_background_vignette: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Grain</span>
                                            <span className="font-mono text-text-primary">{appearance.public_background_grain || 0}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={appearance.public_background_grain || 0} onChange={(e) => setAppearance(prev => ({ ...prev, public_background_grain: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                                {/* Card Style Extras */}
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Soft Glow</span>
                                            <span className="font-mono text-text-primary">{appearance.public_card_glow || 0}</span>
                                        </div>
                                        <input type="range" min="0" max="2" step="0.1" value={appearance.public_card_glow || 0} onChange={(e) => setAppearance(prev => ({ ...prev, public_card_glow: parseFloat(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-text-secondary block mb-1">Card Theme</label>
                                        <div className="flex bg-surface-dark p-0.5 rounded-lg border border-border">
                                            <button
                                                onClick={() => setAppearance(prev => ({ ...prev, public_card_theme: 'dark' }))}
                                                className={`flex-1 text-xs py-1 rounded-md transition-all ${appearance.public_card_theme !== 'light' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                            >
                                                Dark
                                            </button>
                                            <button
                                                onClick={() => setAppearance(prev => ({ ...prev, public_card_theme: 'light' }))}
                                                className={`flex-1 text-xs py-1 rounded-md transition-all ${appearance.public_card_theme === 'light' ? 'bg-surface text-black shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                            >
                                                Light
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

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

                            {/* Colors */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Primary Color */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-text-secondary">Primary Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setAppearance(prev => ({ ...prev, primary_color: color }))}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${appearance.primary_color === color ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                        <div className="relative">
                                            <input type="color" value={appearance.primary_color} onChange={(e) => setAppearance(prev => ({ ...prev, primary_color: e.target.value }))} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 text-black text-[10px]" title="Custom Color">+</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-text-secondary font-mono uppercase">{appearance.primary_color}</div>
                                </div>
                                {/* Background Color */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-text-secondary">Background Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#000000', '#0f172a', '#18181b', '#1e1b4b', '#312e81', '#ffffff'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setAppearance(prev => ({ ...prev, background_color: color }))}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${appearance.background_color === color ? 'border-primary scale-110' : 'border-white/10 hover:scale-105'}`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select background ${color}`}
                                            />
                                        ))}
                                        <div className="relative group">
                                            <input type="color" value={appearance.background_color} onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" />
                                            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-surface-light group-hover:bg-surface text-text-secondary" title="Custom Background">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-text-secondary font-mono uppercase">{appearance.background_color}</div>
                                </div>
                            </div>

                            {/* Background Image (Card) */}
                            <div className="space-y-3 col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-text-secondary">Background Image</label>
                                <div className="flex gap-3 items-start">
                                    {appearance.background_image ? (
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                                            <img src={appearance.background_image} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setAppearance(prev => ({ ...prev, background_image: '' }))}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-text-secondary bg-surface-light">
                                            <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <ImageUpload onUpload={(url) => setAppearance(prev => ({ ...prev, background_image: url }))} maxDimension={3840}>
                                            <button className="text-sm px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-colors">Upload Image</button>
                                        </ImageUpload>
                                        <p className="text-xs text-text-secondary">Upload a custom background image. This will overlay your background color.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Logo Settings */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="font-bold text-text-primary">Logo Settings</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Logo URL</label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={appearance.logo_url || ''}
                                            onChange={(e) => {
                                                const url = e.target.value;
                                                setAppearance(prev => ({ ...prev, logo_url: url }));
                                                setLogoUrlError(null);
                                                if (url) {
                                                    setIsVerifyingLogo(true);
                                                    const img = new Image();
                                                    img.onload = () => {
                                                        if (img.naturalWidth > 512 || img.naturalHeight > 512) {
                                                            setIsVerifyingLogo(false);
                                                            setLogoUrlError(`Image resolution too high (${img.naturalWidth}x${img.naturalHeight}px). Max allowed is 512x512px.`);
                                                        } else {
                                                            setIsVerifyingLogo(false);
                                                            setLogoUrlError(null);
                                                        }
                                                    };
                                                    img.onerror = () => {
                                                        setIsVerifyingLogo(false);
                                                        setLogoUrlError('Unable to load image. Ensure URL points directly to an image file (png/jpg).');
                                                    };
                                                    img.src = url;
                                                }
                                            }}
                                            className={`w-full bg-background border ${logoUrlError ? 'border-red-500' : 'border-border'} rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50`}
                                            placeholder="https://example.com/logo.png"
                                        />
                                        {isVerifyingLogo && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse">Verifying...</div>
                                        )}
                                    </div>
                                    {logoUrlError && <p className="text-xs text-red-500 mt-1">{logoUrlError}</p>}
                                    <p className="text-xs text-text-secondary mt-1">Enter a direct link to your logo image (PNG/JPG/SVG).</p>
                                    <div className="flex gap-2 pt-2">
                                        <ImageUpload
                                            onUpload={(url) => {
                                                setAppearance(prev => ({ ...prev, logo_url: url }));
                                                setLogoUrlError(null);
                                            }}
                                            className="inline-block"
                                        >
                                            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-dashed border-border rounded-lg text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                Upload Image
                                            </button>
                                        </ImageUpload>
                                        <button
                                            onClick={() => {
                                                setAppearance(prev => ({ ...prev, logo_url: '/logo.svg', logo_position: 'scatter' }));
                                                setLogoUrlError(null);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors"
                                        >
                                            Use Official Logo
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Logo Position</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'top_left', label: 'Top Left' },
                                            { id: 'center_top', label: 'Top Center' },
                                            { id: 'top_right', label: 'Top Right' },
                                            { id: 'center', label: 'Center (Hero)' },
                                            { id: 'scatter', label: 'Scatter Pattern' },
                                            { id: 'bottom_left', label: 'Btm Left' },
                                            { id: 'bottom_right', label: 'Btm Right' },
                                        ].map(pos => (
                                            <button
                                                key={pos.id}
                                                onClick={() => {
                                                    setAppearance(prev => ({ ...prev, logo_position: pos.id as any }));
                                                    if (pos.id === 'scatter') {
                                                        generateScatterPositions(appearance.logo_count || 12, appearance.scatter_style || 'random');
                                                    }
                                                }}
                                                className={`py-2 px-2 text-xs rounded-lg border transition-all ${appearance.logo_position === pos.id
                                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                                    : 'border-border bg-background text-text-secondary hover:border-primary/50'
                                                    }`}
                                            >
                                                {pos.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {appearance.logo_position === 'scatter' && (
                                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-text-secondary">Pattern Opacity</label>
                                                <span className="text-xs text-text-secondary">{Math.round((appearance.logo_opacity || 0.2) * 100)}%</span>
                                            </div>
                                            <input type="range" min="0.05" max="1" step="0.05" value={appearance.logo_opacity || 0.2} onChange={(e) => setAppearance(prev => ({ ...prev, logo_opacity: parseFloat(e.target.value) }))} className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-text-secondary">Item Count</label>
                                                <span className="text-xs text-text-secondary">{appearance.logo_count || 12} items</span>
                                            </div>
                                            <input type="range" min="4" max="30" step="1" value={appearance.logo_count || 12} onChange={(e) => setAppearance(prev => ({ ...prev, logo_count: parseInt(e.target.value) }))} className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-secondary">Pattern Style</label>
                                            <div className="flex gap-2">
                                                {['random', 'grid', 'circle'].map(style => (
                                                    <button
                                                        key={style}
                                                        onClick={() => {
                                                            setAppearance(prev => ({ ...prev, scatter_style: style as any }));
                                                            if (style === 'random') {
                                                                generateScatterPositions(appearance.logo_count || 12, 'random');
                                                            }
                                                        }}
                                                        className={`flex-1 py-1.5 px-2 text-xs rounded-lg border capitalize transition-all ${(appearance.scatter_style || 'random') === style
                                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                                            : 'border-border bg-background text-text-secondary hover:border-primary/50'
                                                            }`}
                                                    >
                                                        {style}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {appearance.scatter_style === 'random' && (
                                            <button
                                                onClick={() => generateScatterPositions(appearance.logo_count || 12, 'random')}
                                                className="w-full py-2 text-xs text-primary border border-primary/20 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                                            >
                                                Reshuffle Random Pattern 🎲
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleAppearanceSave}
                            disabled={isSaving}
                            className="btn-primary w-full md:w-auto mt-4"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Mobile Preview */}
            <div className="hidden xl:block w-[400px] flex-shrink-0">
                <div className="sticky top-8">
                    <div className="bg-black rounded-[3rem] border-[8px] border-surface-light p-2 shadow-2xl h-[700px] relative overflow-hidden">
                        {/* Phone Notch */}
                        <div className="absolute top-0 inset-x-0 h-6 bg-surface-light rounded-b-xl w-40 mx-auto z-20"></div>

                        {/* Preview Content */}
                        <div
                            className="w-full h-full rounded-[2.2rem] overflow-hidden overflow-y-auto no-scrollbar pb-8 relative flex flex-col items-center"
                            style={{
                                background: appearance.public_background_type === 'image'
                                    ? `url(${appearance.public_background_image}) center/cover no-repeat`
                                    : appearance.public_background_type === 'gradient'
                                        ? appearance.public_background_gradient
                                        : appearance.public_background_color
                            }}
                        >
                            {/* Overlay */}
                            <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundColor: `rgba(0,0,0,${(appearance.public_background_overlay || 0) / 100})`, backdropFilter: `blur(${appearance.public_background_blur || 0}px)` }} />

                            {/* Vignette */}
                            <div className="absolute inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${(appearance.public_background_vignette || 0) / 100}) 150%)` }} />

                            {/* Grain */}
                            <div
                                className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                                    opacity: (appearance.public_background_grain || 0) / 100
                                }}
                            />

                            {/* Card Content Container */}
                            <div
                                className="relative z-10 w-full min-h-full flex flex-col transition-all duration-300"
                                style={{
                                    backgroundColor: appearance.background_color === '#000000' && !appearance.background_image ? 'transparent' : appearance.background_color,
                                    color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff',
                                    boxShadow: (appearance.public_card_glow || 0) > 0 ? `0 0 ${(appearance.public_card_glow || 0) * 30}px ${appearance.primary_color}60` : undefined,
                                    backgroundImage: appearance.background_image ? `url(${appearance.background_image})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    maxWidth: '100%',
                                }}
                            >
                                {/* Inner Card Overlay */}
                                {appearance.background_image && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />
                                )}

                                <div className="relative z-10 flex flex-col w-full h-full">
                                    {/* Theme Effects */}
                                    {appearance.theme === 'holographic' && (
                                        <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-teal-500/20 z-0" />
                                    )}

                                    {/* Logo Rendering */}
                                    {appearance.logo_url && (
                                        <>
                                            {appearance.logo_position === 'scatter' ? (
                                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                    {scatterPositions.map((pos, i) => (
                                                        <img
                                                            key={i}
                                                            src={appearance.logo_url}
                                                            className="absolute w-24 h-24 object-contain transition-all duration-500 ease-in-out"
                                                            style={{
                                                                opacity: appearance.logo_opacity || 0.2,
                                                                top: `${pos.top}%`,
                                                                left: `${pos.left}%`,
                                                                transform: `rotate(${pos.rotate}deg)`
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={`absolute z-20 pointer-events-none p-6 flex w-full h-full ${appearance.logo_position === 'top_left' ? 'items-start justify-start' :
                                                    appearance.logo_position === 'top_right' ? 'items-start justify-end' :
                                                        appearance.logo_position === 'center_top' ? 'items-start justify-center' :
                                                            appearance.logo_position === 'center' ? 'items-center justify-center' :
                                                                appearance.logo_position === 'bottom_left' ? 'items-end justify-start' :
                                                                    appearance.logo_position === 'bottom_right' ? 'items-end justify-end' : ''
                                                    }`}>
                                                    <img
                                                        src={appearance.logo_url}
                                                        className={`${appearance.logo_position === 'center' ? 'w-full max-w-[200px] opacity-10' : 'w-16 h-16'} object-contain`}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Cover Banner */}
                                    <div
                                        className="h-32 w-full relative"
                                        style={{ background: `linear-gradient(to bottom right, ${appearance.primary_color}40, ${appearance.primary_color}10)` }}
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
            </div>
        </div>
    );
}


