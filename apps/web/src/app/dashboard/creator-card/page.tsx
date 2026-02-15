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
    custom_image_url?: string;
    sort_order: number;
    is_active: boolean;
}

// Helper for brand gradients
const getBrandGradient = (icon: string) => {
    switch (icon) {
        case 'instagram': return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
        case 'youtube': return 'linear-gradient(45deg, #ff0000 0%, #cc0000 100%)';
        case 'twitter': return 'linear-gradient(45deg, #1da1f2 0%, #0d8bd9 100%)';
        case 'x': return 'linear-gradient(45deg, #000000 0%, #14171a 100%)';
        case 'tiktok': return 'linear-gradient(45deg, #000000 0%, #25f4ee 50%, #fe2c55 100%)';
        case 'linkedin': return 'linear-gradient(45deg, #0077b5 0%, #005582 100%)';
        case 'facebook': return 'linear-gradient(45deg, #1877f2 0%, #0c5dc7 100%)';
        case 'twitch': return 'linear-gradient(45deg, #9146ff 0%, #772ce8 100%)';
        case 'discord': return 'linear-gradient(45deg, #5865f2 0%, #404eed 100%)';
        case 'snapchat': return 'linear-gradient(45deg, #fffc00 0%, #e6e300 100%)';
        case 'whatsapp': return 'linear-gradient(45deg, #25d366 0%, #128c7e 100%)';
        case 'pinterest': return 'linear-gradient(45deg, #e60023 0%, #bd081c 100%)';
        case 'github': return 'linear-gradient(45deg, #24292e 0%, #000000 100%)';
        default: return `linear-gradient(135deg, #333 20%, #000 10%)`;
    }
};

interface Profile {
    id: string;
    verification_token?: string;
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
        card_style?: 'classic' | 'modern' | 'sharp' | 'pill';
        // Public Page Background
        public_background_type?: 'color' | 'gradient' | 'image';
        public_background_color?: string;
        public_background_gradient?: string;
        public_background_image?: string;
        public_background_overlay?: number;
        public_background_blur?: number;
        public_background_vignette?: number;
        public_background_grain?: number;
        public_card_theme?: 'light' | 'dark';
        public_card_glow?: number;
        link_style?: 'list' | 'grid' | 'row';
        card_background_type?: 'color' | 'gradient' | 'image';
        card_background_gradient?: string;
    };
    featured_video?: {
        id: string;
        youtube_video_id: string;
        title: string;
        thumbnail_url: string;
        has_active_proof: boolean;
    } | null;
    verified_videos?: {
        id: string;
        youtube_video_id: string;
        title: string;
        thumbnail_url: string;
        proof_id: string;
        published_at: string;
    }[];
}

export default function CreatorCardPage() {
    const [links, setLinks] = useState<CreatorLink[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifyingLogo, setIsVerifyingLogo] = useState(false);
    const [logoUrlError, setLogoUrlError] = useState<string | null>(null);

    // Layout State
    const [layoutOrientation, setLayoutOrientation] = useState<'vertical' | 'horizontal'>('horizontal');

    // Filter/Tab State
    const [activeTab, setActiveTab] = useState<'links' | 'appearance'>('links');
    const [isTokenRevealed, setIsTokenRevealed] = useState(false);

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
        card_style: 'modern' as 'classic' | 'modern' | 'sharp' | 'pill',
        link_style: 'list' as 'list' | 'grid' | 'row',
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
        public_card_glow: 0,
        card_background_type: 'color' as 'color' | 'gradient' | 'image',
        card_background_gradient: ''
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
    const [formData, setFormData] = useState({ label: '', url: '', icon: '', custom_image_url: '' });

    useEffect(() => {
        fetchData();
    }, []);

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
                // Initialize appearance from profile
                if (data.profile.appearance) {
                    setAppearance(prev => ({ ...prev, ...data.profile.appearance }));
                }
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
                setFormData({ label: '', url: '', icon: '', custom_image_url: '' });
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to save link');
            }
        } catch (err) {
            console.error('Failed to save link', err);
            alert('An error occurred while saving the link');
        } finally {
            setIsSaving(false);
        }
    };

    const [isSuccess, setIsSuccess] = useState(false);

    // Reset success state when changes are made
    useEffect(() => {
        if (isSuccess) setIsSuccess(false);
    }, [appearance, profile?.avatar_url]);

    const handleAppearanceSave = async () => {
        setIsSaving(true);
        setIsSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appearance: appearance,
                    avatar_url: profile?.avatar_url
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 3000);
            } else {
                console.error('Save failed:', res.statusText);
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
            icon: link.icon || getIconType(link.url),
            custom_image_url: link.custom_image_url || ''
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

    // Card Shape Logic for Preview
    const cardStyle = appearance.card_style || 'modern';
    const shapeClasses = {
        classic: { card: 'rounded-xl', link: 'rounded-lg' },
        modern: { card: 'rounded-[2.5rem]', link: 'rounded-2xl' },
        sharp: { card: 'rounded-none', link: 'rounded-none' },
        pill: { card: 'rounded-[3rem]', link: 'rounded-full' }
    };
    const currentShape = shapeClasses[cardStyle as keyof typeof shapeClasses] || shapeClasses.modern;

    return (
        <div className="max-w-[2000px] mx-auto h-[calc(100vh-100px)] flex gap-8 px-6">
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-8 border-r border-border scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Creator Card</h1>
                        <p className="text-text-secondary">Manage your links and public profile</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Public Page */}
                        <Link href={publicUrl} target="_blank" className="btn-secondary flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            <span className="hidden sm:inline">View Public Page</span>
                        </Link>

                        {/* Layout Toggle */}
                        <div className="flex bg-surface border border-border rounded-lg p-1">
                            <button
                                onClick={() => setLayoutOrientation('horizontal')}
                                className={`p-2 rounded-md transition-colors ${layoutOrientation === 'horizontal' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <button
                                onClick={() => setLayoutOrientation('vertical')}
                                className={`p-2 rounded-md transition-colors ${layoutOrientation === 'vertical' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'links' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Links
                        {activeTab === 'links' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'appearance' ? 'text-primary' : 'text-text-primary'}`}
                    >
                        Appearance
                        {activeTab === 'appearance' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {activeTab === 'links' ? (
                    <div className="space-y-6">
                        {/* Add New Link Card */}
                        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">✦ Add New Link</h2>
                            {showForm ? (
                                <form onSubmit={handleLinkSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Link Label</label>
                                        <input
                                            type="text"
                                            value={formData.label}
                                            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                                            placeholder="e.g. My Website"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">URL</label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                value={formData.url}
                                                onChange={handleUrlChange}
                                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                                                placeholder="https://..."
                                                required
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                                <SocialIcon type={formData.icon || 'link'} className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Grid Image */}
                                    <div className="col-span-full pt-4 border-t border-border mt-4">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Custom Grid Image <span className="text-xs text-text-muted">(Optional)</span>
                                        </label>
                                        <p className="text-xs text-text-secondary mb-2">Upload a background image for this link when displayed in Grid mode.</p>
                                        <div className="flex items-center gap-4">
                                            {formData.custom_image_url ? (
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                                                    <img src={formData.custom_image_url} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, custom_image_url: '' }))}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <ImageUpload
                                                    onUpload={(url) => setFormData(prev => ({ ...prev, custom_image_url: url }))}
                                                    className="w-full"
                                                >
                                                    <div className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer bg-surface-light/50">
                                                        <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span className="text-xs font-medium">Upload Image</span>
                                                    </div>
                                                </ImageUpload>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowForm(false); setEditingLink(null); }}
                                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : (editingLink ? 'Update Link' : 'Add Link')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </span>
                                    <span className="font-medium">Add New Link</span>
                                </button>
                            )}
                        </div>

                        {/* Links List */}
                        <div className="space-y-3">
                            {links.map((link) => (
                                <div key={link.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 group hover:border-border-hover transition-colors">
                                    <div className="cursor-move text-text-muted hover:text-text-secondary">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-text-primary">
                                        <SocialIcon type={link.icon} className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-text-primary truncate">{link.label}</h3>
                                        <p className="text-xs text-text-secondary truncate">{link.url}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(link)} className="p-2 text-text-secondary hover:text-primary transition-colors" title="Edit">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(link.id)} className="p-2 text-text-secondary hover:text-red-500 transition-colors" title="Delete">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {links.length === 0 && !showForm && (
                                <div className="text-center py-12 text-text-secondary">
                                    <p>No links yet. Add your first link above!</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`animate-in fade-in slide-in-from-bottom-2 ${layoutOrientation === 'horizontal' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : 'space-y-8'}`}>
                        {/* ═══ SECTION 1: PUBLIC PAGE APPEARANCE ═══ */}
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">✦ Public Page Styling</h2>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-text-secondary">Background Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['color', 'gradient', 'image'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setAppearance(prev => ({ ...prev, public_background_type: type as any }))}
                                            className={`py-2 px-3 rounded-lg border text-sm capitalize transition-all ${appearance.public_background_type === type ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-text-secondary hover:text-text-primary'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                {appearance.public_background_type === 'color' && (
                                    <div className="flex items-center gap-3">
                                        <input type="color" value={appearance.public_background_color} onChange={e => setAppearance(prev => ({ ...prev, public_background_color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-border p-1" />
                                        <span className="text-sm text-text-secondary font-mono">{appearance.public_background_color}</span>
                                    </div>
                                )}
                                {appearance.public_background_type === 'gradient' && (
                                    <input type="text" value={appearance.public_background_gradient} onChange={e => setAppearance(prev => ({ ...prev, public_background_gradient: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none" placeholder="linear-gradient(...)" />
                                )}
                                {appearance.public_background_type === 'image' && (
                                    <ImageUpload onUpload={url => setAppearance(prev => ({ ...prev, public_background_image: url, public_background_type: 'image' }))} className="w-full">
                                        <div className="h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer relative overflow-hidden bg-surface-light/50">
                                            {appearance.public_background_image ? <img src={appearance.public_background_image} className="w-full h-full object-cover" /> : <span className="text-xs font-medium">Upload Background Image</span>}
                                        </div>
                                    </ImageUpload>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary"><span>Overlay Opacity</span><span>{appearance.public_background_overlay}%</span></div>
                                        <input type="range" min="0" max="90" value={appearance.public_background_overlay} onChange={e => setAppearance(prev => ({ ...prev, public_background_overlay: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary"><span> Blur Radius</span><span>{appearance.public_background_blur}px</span></div>
                                        <input type="range" min="0" max="20" value={appearance.public_background_blur} onChange={e => setAppearance(prev => ({ ...prev, public_background_blur: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary"><span>Vignette</span><span>{appearance.public_background_vignette}%</span></div>
                                        <input type="range" min="0" max="100" value={appearance.public_background_vignette} onChange={e => setAppearance(prev => ({ ...prev, public_background_vignette: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary"><span>Grain</span><span>{appearance.public_background_grain}%</span></div>
                                        <input type="range" min="0" max="50" value={appearance.public_background_grain} onChange={e => setAppearance(prev => ({ ...prev, public_background_grain: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ SECTION 2: CARD DESIGN ═══ */}
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">✦ Card Configuration</h2>

                            {/* Card Background Type */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Card Background</label>
                                    <div className="grid grid-cols-3 gap-2 bg-surface-light p-1 rounded-lg border border-border">
                                        {['color', 'gradient', 'image'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setAppearance(prev => ({ ...prev, card_background_type: type as any }))}
                                                className={`py-1.5 px-3 rounded-md text-xs capitalize transition-all duration-200 ${(appearance.card_background_type || 'color') === type
                                                    ? 'bg-surface shadow text-primary font-medium'
                                                    : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Card Background Controls */}
                                <div className="p-4 bg-surface-light/30 rounded-lg border border-border/50">
                                    {/* Color Mode */}
                                    {(!appearance.card_background_type || appearance.card_background_type === 'color') && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-medium text-text-secondary">Background Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={appearance.background_color || '#000000'}
                                                    onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))}
                                                    className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent p-0.5"
                                                />
                                                <input
                                                    type="text"
                                                    value={appearance.background_color || '#000000'}
                                                    onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))}
                                                    className="flex-1 bg-surface border border-border rounded px-3 text-sm text-text-primary uppercase font-mono"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Gradient Mode */}
                                    {appearance.card_background_type === 'gradient' && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-medium text-text-secondary">Gradient CSS</label>
                                            <input
                                                type="text"
                                                value={appearance.card_background_gradient || 'linear-gradient(to bottom right, #1f1f1f, #000000)'}
                                                onChange={(e) => setAppearance(prev => ({ ...prev, card_background_gradient: e.target.value }))}
                                                className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text-primary font-mono placeholder:text-text-muted/50"
                                                placeholder="linear-gradient(...)"
                                            />
                                            <div className="flex gap-2 flex-wrap">
                                                {[
                                                    'linear-gradient(to bottom right, #2d3748, #1a202c)',
                                                    'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
                                                    'linear-gradient(to right, #b8cbb8 0%, #b8cbb8 0%, #b465da 0%, #cf6cc9 33%, #ee609c 66%, #ee609c 100%)'
                                                ].map((grad, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setAppearance(prev => ({ ...prev, card_background_gradient: grad }))}
                                                        className="w-8 h-8 rounded-full border border-border/50 hover:scale-110 transition-transform"
                                                        style={{ background: grad }}
                                                        title="Apply Gradient"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Image Mode */}
                                    {appearance.card_background_type === 'image' && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-medium text-text-secondary">Upload Background</label>
                                            <ImageUpload
                                                onUpload={(url) => setAppearance(prev => ({ ...prev, background_image: url }))}
                                                className="w-full"
                                            >
                                                <div className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-surface-light transition-colors group">
                                                    {appearance.background_image ? (
                                                        <img src={appearance.background_image} className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    ) : (
                                                        <>
                                                            <svg className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            <span className="text-xs text-text-secondary">Click to upload image</span>
                                                        </>
                                                    )}
                                                </div>
                                            </ImageUpload>
                                            {appearance.background_image && (
                                                <button
                                                    onClick={() => setAppearance(prev => ({ ...prev, background_image: '' }))}
                                                    className="text-xs text-red-400 hover:text-red-300 transition-colors w-full text-center"
                                                >
                                                    Remove Image
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-text-secondary">Link Layout</label>
                                <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                    {['list', 'grid', 'row'].map(style => (
                                        <button key={style} onClick={() => setAppearance(prev => ({ ...prev, link_style: style as any }))} className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${appearance.link_style === style ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>{style}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Card Shape</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['classic', 'modern', 'sharp', 'pill'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setAppearance(prev => ({ ...prev, card_style: style as any }))}
                                            className={`h-10 border rounded-lg flex items-center justify-center transition-all ${appearance.card_style === style ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}
                                            title={style}
                                        >
                                            <div className={`w-6 h-3 border-2 border-current ${style === 'classic' ? 'rounded-sm' :
                                                style === 'modern' ? 'rounded-md' :
                                                    style === 'sharp' ? 'rounded-none' : 'rounded-full'
                                                }`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="text-sm font-medium text-text-secondary">Card Theme</label>
                                <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                    {['light', 'dark'].map(theme => (
                                        <button key={theme} onClick={() => setAppearance(prev => ({ ...prev, public_card_theme: theme as any }))} className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${appearance.public_card_theme === theme ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>{theme}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-text-secondary"><span>Card Glow</span><span>{appearance.public_card_glow}</span></div>
                                <input type="range" min="0" max="100" step="5" value={appearance.public_card_glow} onChange={e => setAppearance(prev => ({ ...prev, public_card_glow: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>

                        {/* ═══ SECTION 3: MY COLORS ═══ */}
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">✦ Accent & Colors</h2>
                                <button onClick={handleRandomize} className="text-xs text-primary hover:text-primary-light transition-colors flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Shuffle
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-text-secondary">Primary Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#ffffff'].map(color => (
                                        <button key={color} onClick={() => setAppearance(prev => ({ ...prev, primary_color: color }))} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${appearance.primary_color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                                    ))}
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-border cursor-pointer group">
                                        <input type="color" value={appearance.primary_color} onChange={e => setAppearance(prev => ({ ...prev, primary_color: e.target.value }))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-80" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-text-secondary">Icon Style</label>
                                    <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                        {['monochrome', 'color'].map(style => (
                                            <button key={style} onClick={() => setAppearance(prev => ({ ...prev, icon_style: style as any }))} className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${appearance.icon_style === style ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>{style}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ SECTION 5: BRANDING ═══ */}
                        <div className={`bg-surface border border-border rounded-xl p-5 space-y-4 ${layoutOrientation === 'horizontal' ? 'xl:col-span-2' : ''}`}>
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">✦ Branding & Logo</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    {/* Profile Picture Upload */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Profile Picture</label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-20 h-20 rounded-full border-2 border-border p-1 relative group overflow-hidden"
                                                style={{ borderColor: appearance.primary_color }}
                                            >
                                                <div className="w-full h-full rounded-full overflow-hidden bg-surface-light flex items-center justify-center">
                                                    {profile?.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-text-secondary">{profile?.display_name?.substring(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageUpload
                                                        onUpload={(url) => setProfile(prev => prev ? ({ ...prev, avatar_url: url }) : null)}
                                                        className="w-full h-full flex items-center justify-center cursor-pointer"
                                                    >
                                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </ImageUpload>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-text-secondary mb-2">Upload a profile picture. It will be displayed with a glowing effect matched to your theme.</p>
                                                {profile?.avatar_url && (
                                                    <button
                                                        onClick={() => setProfile(prev => prev ? ({ ...prev, avatar_url: '' }) : null)}
                                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        Remove Photo
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

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
                                </div>

                                {appearance.logo_position === 'scatter' && (
                                    <div className="space-y-6 pt-2 h-full justify-center flex flex-col animate-in fade-in slide-in-from-top-1 bg-surface-light/30 p-4 rounded-xl border border-border/50">
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
                            disabled={isSaving || isSuccess}
                            className={`btn-primary w-full md:w-auto mt-2 transition-all duration-300 min-w-[140px] flex items-center justify-center ${layoutOrientation === 'horizontal' ? 'xl:col-span-2' : ''} ${isSuccess ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}`}
                        >
                            {isSuccess ? (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" className="animate-[draw_0.5s_ease-in-out_forwards]" style={{ strokeDasharray: 24, strokeDashoffset: 0 }} />
                                    </svg>
                                    <span className="font-bold">Saved!</span>
                                </div>
                            ) : isSaving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                )}
            </div>
            {/* Right: Preview */}
            <div className="hidden lg:flex flex-col items-center justify-center p-8 min-h-screen sticky top-0 h-screen w-[450px]">
                <div className="mb-4 text-center">
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Live Preview</h3>
                    <p className="text-xs text-text-muted">Changes update in real-time</p>
                </div>

                {/* Mobile Frame */}
                <div className="relative w-[340px] h-[680px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-surface-dark overflow-hidden ring-4 ring-black/20">
                    {/* Screen Content */}
                    <div
                        className="w-full h-full overflow-y-auto scrollbar-hide relative transition-colors duration-500"
                        style={{
                            background: appearance.card_background_type === 'image' && appearance.background_image
                                ? `url(${appearance.background_image}) center/cover no-repeat`
                                : appearance.card_background_type === 'gradient' && appearance.card_background_gradient
                                    ? appearance.card_background_gradient
                                    : (appearance.background_color || '#000000'),
                            boxShadow: `0 40px 80px -12px rgba(0, 0, 0, 0.6)${appearance.public_card_glow > 0 ? `, 0 0 ${appearance.public_card_glow * 40}px ${appearance.primary_color}50` : ''}`
                        }}
                    >
                        {/* Overlays */}
                        {appearance.public_background_type === 'image' && (
                            <>
                                {appearance.public_background_overlay > 0 && <div className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300" style={{ opacity: appearance.public_background_overlay / 100 }} />}
                                {appearance.public_background_blur > 0 && <div className="absolute inset-0 backdrop-blur-[var(--blur)] pointer-events-none transition-all duration-300" style={{ '--blur': `${appearance.public_background_blur}px` } as any} />}
                            </>
                        )}
                        {appearance.public_background_vignette > 0 && <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ background: `radial-gradient(circle, transparent 50%, rgba(0,0,0, ${appearance.public_background_vignette / 100}))` }} />}
                        {appearance.public_background_grain > 0 && <div className="absolute inset-0 opacity-[var(--grain)] pointer-events-none mix-blend-overlay transition-opacity duration-300" style={{ backgroundImage: 'url("/grain.png")', '--grain': appearance.public_background_grain / 100 } as any} />}

                        {/* Logo Scatter */}
                        {appearance.logo_position === 'scatter' && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {scatterPositions.map((pos, i) => (
                                    <img
                                        key={i}
                                        src={appearance.logo_url || '/logo.png'}
                                        className="absolute w-8 h-8 opacity-[var(--op)] transition-all duration-1000"
                                        style={{
                                            top: `${pos.top}%`,
                                            left: `${pos.left}%`,
                                            transform: `rotate(${pos.rotate}deg)`,
                                            '--op': appearance.logo_opacity
                                        } as any}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Main Content Area */}
                        <div className="relative z-10 px-6 py-12 flex flex-col items-center gap-6 min-h-full">
                            {/* Logo (Top) */}
                            {(appearance.logo_position === 'center_top' || appearance.logo_position === 'top_left' || appearance.logo_position === 'top_right') && appearance.logo_url && (
                                <img
                                    src={appearance.logo_url}
                                    className={`h-8 w-auto absolute top-6 transition-all duration-500 ${appearance.logo_position === 'top_left' ? 'left-6' : appearance.logo_position === 'top_right' ? 'right-6' : 'left-1/2 -translate-x-1/2'}`}
                                />
                            )}

                            {/* Hero Avatar */}
                            <div className="relative mt-8 group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl relative z-10 bg-surface">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl font-bold">{profile?.display_name?.charAt(0)}</div>
                                    )}
                                </div>
                                {/* Glow */}
                                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-110 -z-0 transition-colors duration-300" style={{ backgroundColor: appearance.primary_color }} />
                            </div>

                            {/* Text Info */}
                            <div className="text-center space-y-1">
                                <h1 className="text-xl font-bold tracking-tight">{profile?.display_name || 'Your Name'}</h1>
                                <p className="text-sm opacity-70">@{profile?.handle || 'username'}</p>
                            </div>

                            {/* Links */}
                            <div className={`w-full gap-3 ${appearance.link_style === 'grid' ? 'grid grid-cols-2' :
                                appearance.link_style === 'row' ? 'flex flex-wrap justify-center' :
                                    'grid grid-cols-1'
                                }`}>
                                {links.filter(l => l.is_active).map(link => (
                                    <a
                                        key={link.id}
                                        href="#"
                                        onClick={e => e.preventDefault()}
                                        className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${appearance.card_style === 'pill' ? 'rounded-[2rem]' :
                                            appearance.card_style === 'modern' ? 'rounded-xl' :
                                                appearance.card_style === 'sharp' ? 'rounded-none' : 'rounded-lg'
                                            } ${appearance.link_style === 'row'
                                                ? 'w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md'
                                                : 'w-full p-3 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/5'
                                            } ${appearance.public_card_glow > 0 ? 'shadow-[0_0_var(--glow)_rgba(255,255,255,0.1)]' : ''}`}
                                        style={{
                                            backgroundColor: appearance.public_card_theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)',
                                            borderColor: appearance.public_card_theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                                            color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff',
                                            '--glow': `${appearance.public_card_glow}px`
                                        } as any}
                                    >
                                        {/* Grid Background Image */}
                                        {appearance.link_style === 'grid' && link.custom_image_url && (
                                            <div className="absolute inset-0 z-0">
                                                <img src={link.custom_image_url} className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/40" />
                                            </div>
                                        )}

                                        {appearance.link_style === 'row' ? (
                                            <div style={{ color: appearance.icon_style === 'color' ? undefined : 'currentColor' }}>
                                                <SocialIcon type={link.icon} variant={appearance.icon_style === 'monochrome' ? 'monochrome' : undefined} className="w-6 h-6 relative z-10" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${appearance.icon_style === 'color' ? '' : 'text-current'}`}>
                                                    <SocialIcon type={link.icon} variant={appearance.icon_style === 'monochrome' ? 'monochrome' : undefined} className="w-6 h-6 relative z-10" />
                                                </div>
                                                <span className={`font-medium text-sm truncate relative z-10 flex-1 ${appearance.link_style === 'grid' ? 'text-center' : 'text-left'}`}>{link.label}</span>
                                                {appearance.link_style === 'list' && (
                                                    <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                )}
                                            </>
                                        )}
                                    </a>
                                ))}
                                {links.filter(l => l.is_active).length === 0 && (
                                    <div className="col-span-full text-center py-8 opacity-50 text-xs">
                                        <p>Add active links to see them here</p>
                                    </div>
                                )}
                            </div>

                            {/* Verified Videos */}
                            {profile?.verified_videos && profile.verified_videos.length > 0 && (
                                <div className="w-full space-y-3 pt-4 border-t border-white/10">
                                    <h3 className="text-xs font-bold opacity-70 uppercase tracking-wider text-center" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>Verified Videos</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x w-full">
                                        {profile.verified_videos.map(video => (
                                            <a
                                                key={video.id}
                                                href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                                                target="_blank"
                                                className="min-w-[160px] max-w-[160px] snap-center rounded-lg overflow-hidden border border-white/10 group relative flex-shrink-0"
                                                style={{ backgroundColor: appearance.public_card_theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                                            >
                                                <div className="aspect-video relative">
                                                    <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                    <div className="absolute top-1.5 right-1.5 bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        VERIFIED
                                                    </div>
                                                </div>
                                                <div className="p-2">
                                                    <h4 className="text-[10px] font-medium truncate leading-tight mb-1" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>{video.title}</h4>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] opacity-60" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>{new Date(video.published_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Secure Badge */}
                            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group/badge cursor-help" title="This card is cryptographically signed and verified by AntiAI">
                                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ color: appearance.primary_color }}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Securely Signed
                                </div>
                                <div
                                    className="flex items-center gap-2 font-mono text-[9px] text-white/50 cursor-pointer select-none"
                                    onMouseDown={() => setIsTokenRevealed(true)}
                                    onMouseUp={() => setIsTokenRevealed(false)}
                                    onMouseLeave={() => setIsTokenRevealed(false)}
                                    onTouchStart={() => setIsTokenRevealed(true)}
                                    onTouchEnd={() => setIsTokenRevealed(false)}
                                >
                                    <span>hash:</span>
                                    <span className={`transition-colors ${isTokenRevealed ? 'text-white' : 'text-white/70 group-hover/badge:text-white'}`}>
                                        {isTokenRevealed
                                            ? (profile?.verification_token || profile?.id || 'preview-id')
                                            : (profile?.verification_token
                                                ? `${profile.verification_token.substring(0, 12)}...${profile.verification_token.substring(profile.verification_token.length - 8)}`
                                                : `0x${(profile?.id || 'preview-id').split('-')[0]}...${(profile?.id || 'preview-id').split('-').pop()}`)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
