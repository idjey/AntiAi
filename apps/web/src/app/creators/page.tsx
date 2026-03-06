'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShieldCheck, CheckCircle2, TrendingUp, Sparkles, Filter, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// --- Mock Data for UI Design ---
const categories = ['All', 'Technology', 'Design', 'Lifestyle', 'Gaming', 'Education']

const mockCreators = [
    {
        id: '1',
        name: 'Alex Rivera',
        handle: 'arivera',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        category: 'Technology',
        verifiedDate: '2023-11-15',
        bio: 'Software Engineer & AI Researcher. Building the future of open source.',
        followers: '124K',
        featured: true,
    },
    {
        id: '2',
        name: 'Sarah Chen',
        handle: 'sarahcodes',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
        category: 'Design',
        verifiedDate: '2024-01-05',
        bio: 'Digital artist creating surreal landscapes and teaching UI/UX design daily.',
        followers: '89K',
        featured: true,
    },
    {
        id: '3',
        name: 'Marcus Johnson',
        handle: 'marcus_j',
        avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
        category: 'Lifestyle',
        verifiedDate: '2023-09-22',
        bio: 'Documenting minimal living and sustainable habits across the globe.',
        followers: '210K',
        featured: false,
    },
    {
        id: '4',
        name: 'Elena Rostova',
        handle: 'elena_plays',
        avatar: 'https://i.pravatar.cc/150?u=a048581f4e29026701d',
        category: 'Gaming',
        verifiedDate: '2024-02-14',
        bio: 'Pro competitive player & variety streamer. Welcome to the community!',
        followers: '450K',
        featured: true,
    },
    {
        id: '5',
        name: 'Dr. James Wilson',
        handle: 'jwilson_phd',
        avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d',
        category: 'Education',
        verifiedDate: '2023-12-01',
        bio: 'Making complex physics simple. Weekly deep dives into the universe.',
        followers: '55K',
        featured: false,
    },
    {
        id: '6',
        name: 'Mia Wong',
        handle: 'miawong',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
        category: 'Design',
        verifiedDate: '2024-03-02',
        bio: 'Typography nerd and brand strategist helping startups find their voice.',
        followers: '32K',
        featured: false,
    },
]

// --- Animations ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
}

export default function CreatorsDirectoryPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Filter Logic
    const filteredCreators = mockCreators.filter((creator) => {
        const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            creator.handle.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory === 'All' || creator.category === activeCategory
        return matchesSearch && matchesCategory
    })

    const featuredCreators = filteredCreators.filter(c => c.featured)
    const regularCreators = filteredCreators.filter(c => !c.featured)

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-24">

            {/* Background Glow Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* --- Hero Section --- */}
            <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 px-4">
                <div className="container-custom max-w-4xl text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            The Hall of Authenticity
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight mb-6">
                            Discover <span className="text-primary italic">Real</span> Creators
                        </h1>
                        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                            Explore the verified network of authentic humans. No bots, no deepfakes—just genuine people building communities.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* --- Search & Filters --- */}
            <section className="sticky top-[72px] z-40 bg-background/80 backdrop-blur-xl border-y border-white/5 py-4 mb-12">
                <div className="container-custom max-w-6xl px-4 flex flex-col sm:flex-row gap-4 items-center justify-between">

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-96 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search creators by name or @handle..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                        />
                    </div>

                    {/* Desktop Category Pills */}
                    <div className="hidden md:flex flex-wrap gap-2 items-center justify-end">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeCategory === category
                                        ? 'bg-primary text-background shadow-lg shadow-primary/25'
                                        : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary border border-transparent hover:border-white/10'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Filter Toggle */}
                    <button
                        className="md:hidden w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <Filter className="w-4 h-4" />
                        {activeCategory === 'All' ? 'Filters' : `Filter: ${activeCategory}`}
                    </button>
                </div>

                {/* Mobile Dropdown Filters */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden bg-white/[0.02] border-t border-white/5 mt-4"
                        >
                            <div className="container-custom px-4 py-4 flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setActiveCategory(category)
                                            setIsFilterOpen(false)
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === category
                                                ? 'bg-primary text-background'
                                                : 'bg-white/5 text-text-secondary'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* --- Main Content Grid --- */}
            <div className="container-custom max-w-6xl px-4 relative z-10">

                {filteredCreators.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                            <Search className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">No creators found</h3>
                        <p className="text-text-secondary">Try adjusting your search or filters to find what you're looking for.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                            className="mt-6 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                        >
                            Clear all filters
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-16">

                        {/* Featured Section */}
                        {featuredCreators.length > 0 && (
                            <motion.section
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-text-primary tracking-tight">Trending Authentic Profiles</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {featuredCreators.map(creator => (
                                        <CreatorCard key={creator.id} creator={creator} featured />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Regular Grid */}
                        {regularCreators.length > 0 && (
                            <motion.section
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                        <TrendingUp className="w-4 h-4 text-text-secondary" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-text-primary tracking-tight">Recently Verified</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {regularCreators.map(creator => (
                                        <CreatorCard key={creator.id} creator={creator} compact />
                                    ))}
                                </div>
                            </motion.section>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Subcomponents ---

function CreatorCard({ creator, featured = false, compact = false }: { creator: any, featured?: boolean, compact?: boolean }) {
    return (
        <motion.div variants={itemVariants} className="h-full">
            <Link href={`/${creator.handle}`} className="block h-full group">
                <div className={`relative h-full flex flex-col bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20 hover:shadow-2xl hover:shadow-primary/5 ${featured ? 'p-8' : 'p-6'}`}>

                    {/* Floating Badge (Hover) */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5 shadow-xl">
                            <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">View</span>
                            <TrendingUp className="w-3 h-3 text-primary" />
                        </div>
                    </div>

                    {/* Header: Avatar + Top Info */}
                    <div className={`flex ${compact ? 'flex-col items-start gap-4' : 'items-center gap-5'} mb-6`}>
                        {/* Avatar Wrapper with verification ring */}
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/30 group-hover:border-primary transition-colors duration-500 scale-105" />
                            <div className={`relative rounded-full overflow-hidden ${featured ? 'w-20 h-20' : 'w-16 h-16'}`}>
                                <Image
                                    src={creator.avatar}
                                    alt={creator.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                            </div>
                        </div>

                        <div>
                            <h3 className={`font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1 ${featured ? 'text-xl' : 'text-lg'}`}>
                                {creator.name}
                            </h3>
                            <p className="text-primary/80 font-medium text-sm mt-0.5">@{creator.handle}</p>
                        </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className={`text-text-secondary leading-relaxed flex-grow ${compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-3'} mb-6`}>
                        {creator.bio}
                    </p>

                    {/* Footer Stats / Category */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 text-text-secondary border border-white/5">
                            {creator.category}
                        </span>

                        {featured && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500/80 animate-pulse" />
                                {creator.followers} followers
                            </div>
                        )}
                    </div>

                </div>
            </Link>
        </motion.div>
    )
}
