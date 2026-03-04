'use client'

import { useRef, useState, useEffect } from 'react'

export default function CreatorPage() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [centerIndex, setCenterIndex] = useState(0)

    const creators = [
        {
            name: 'Alex Crypto',
            handle: 'alexcrypto',
            bio: 'Making crypto simple. 500K+ subscribers on YouTube. No financial advice.',
            gradient: 'from-primary/20 via-secondary/20 to-primary/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary border-4 border-surface" />
            ),
            links: [
                { icon: 'website', label: 'Website', url: '#' },
                { icon: 'twitter', label: 'Twitter', url: '#' },
                { icon: 'instagram', label: 'Instagram', url: '#' },
                { icon: 'youtube', label: 'Course', url: '#' },
            ],
            videos: [
                { title: 'How to avoid crypto scams', views: '125K', time: '2 days ago' },
                { title: 'Market analysis June 2026', views: '89K', time: '1 week ago' },
            ]
        },
        {
            name: 'Daily Truth News',
            handle: 'dailytruth',
            bio: 'Unbiased reporting. Verified facts. Fighting misinformation one story at a time.',
            gradient: 'from-red-500/20 via-orange-500/20 to-red-500/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-4 border-surface flex items-center justify-center text-3xl">
                    📰
                </div>
            ),
            links: [
                { icon: 'website', label: 'Website', url: '#' },
                { icon: 'twitter', label: 'Twitter', url: '#' },
                { icon: 'youtube', label: 'Channel', url: '#' },
            ],
            videos: [
                { title: 'Election Interference Exposed', views: '2.1M', time: '5 hours ago' },
                { title: 'Climate Summit: Real or Fake?', views: '1.5M', time: '1 day ago' },
            ]
        },
        {
            name: 'Bella Glow',
            handle: 'bellaglow',
            bio: 'Authentic beauty reviews. No filters, just real results. ✨',
            gradient: 'from-pink-500/20 via-purple-500/20 to-pink-500/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-4 border-surface flex items-center justify-center text-3xl">
                    💄
                </div>
            ),
            links: [
                { icon: 'instagram', label: 'Instagram', url: '#' },
                { icon: 'youtube', label: 'YouTube', url: '#' },
                { icon: 'website', label: 'Shop', url: '#' },
            ],
            videos: [
                { title: 'Testing Viral Foundation (Honest Review)', views: '450K', time: '3 days ago' },
                { title: 'My Skincare Routine 2026', views: '320K', time: '1 week ago' },
            ]
        },
        {
            name: 'Chef Marco',
            handle: 'chefmarco',
            bio: 'Real food, real passion. Italian classics made simple. 🍝',
            gradient: 'from-green-600/20 via-red-600/20 to-green-600/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-red-600 border-4 border-surface flex items-center justify-center text-3xl">
                    👨‍🍳
                </div>
            ),
            links: [
                { icon: 'website', label: 'Recipes', url: '#' },
                { icon: 'instagram', label: 'Instagram', url: '#' },
                { icon: 'youtube', label: 'Cook', url: '#' },
            ],
            videos: [
                { title: 'Authentic Carbonara (No Cream!)', views: '890K', time: '2 days ago' },
                { title: 'Pizza Dough Masterclass', views: '1.2M', time: '2 weeks ago' },
            ]
        },
        {
            name: 'Tech Titan',
            handle: 'techtitan',
            bio: 'Gadget reviews, setups, and future tech. 💻',
            gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-4 border-surface flex items-center justify-center text-3xl">
                    💻
                </div>
            ),
            links: [
                { icon: 'youtube', label: 'Reviews', url: '#' },
                { icon: 'twitter', label: 'Twitter', url: '#' },
                { icon: 'website', label: 'Gear', url: '#' },
            ],
            videos: [
                { title: 'iPhone 18 Pro Max Review', views: '3.5M', time: '1 day ago' },
                { title: 'Best Desk Setup 2026', views: '1.8M', time: '4 days ago' },
            ]
        },
        {
            name: 'Yoga w/ Sarah',
            handle: 'yogasarah',
            bio: 'Find your flow. Daily yoga and meditation for everyone. 🧘‍♀️',
            gradient: 'from-teal-400/20 via-emerald-400/20 to-teal-400/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 border-4 border-surface flex items-center justify-center text-3xl">
                    🧘‍♀️
                </div>
            ),
            links: [
                { icon: 'youtube', label: 'Classes', url: '#' },
                { icon: 'instagram', label: 'Instagram', url: '#' },
                { icon: 'website', label: 'Retreats', url: '#' },
            ],
            videos: [
                { title: '20 Min Morning Stretch', views: '890K', time: '12 hours ago' },
                { title: 'Sleep Meditation', views: '2.1M', time: '3 weeks ago' },
            ]
        },
        {
            name: 'Retro Rick',
            handle: 'retrorick',
            bio: 'Collecting and playing reliability. 8-bit to 128-bit. 🕹️',
            gradient: 'from-purple-600/20 via-pink-600/20 to-purple-600/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 border-4 border-surface flex items-center justify-center text-3xl">
                    👾
                </div>
            ),
            links: [
                { icon: 'youtube', label: 'Gameplay', url: '#' },
                { icon: 'twitter', label: 'Twitter', url: '#' },
                { icon: 'instagram', label: 'Collection', url: '#' },
            ],
            videos: [
                { title: 'Hidden Gems of PS2', views: '650K', time: '2 days ago' },
                { title: 'Restoring a GameBoy Color', views: '920K', time: '1 week ago' },
            ]
        },
        {
            name: 'DIY Dave',
            handle: 'diydave',
            bio: 'Build it, fix it, improve it. Home renovation made easy. 🛠️',
            gradient: 'from-orange-500/20 via-yellow-500/20 to-orange-500/20',
            avatar: (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 border-4 border-surface flex items-center justify-center text-3xl">
                    🔨
                </div>
            ),
            links: [
                { icon: 'website', label: 'Plans', url: '#' },
                { icon: 'youtube', label: 'Builds', url: '#' },
                { icon: 'instagram', label: 'Projects', url: '#' },
            ],
            videos: [
                { title: 'Build a Floating Shelf', views: '1.1M', time: '3 days ago' },
                { title: 'Fix Leaky Faucet FAST', views: '2.5M', time: '1 month ago' },
            ]
        }
    ]

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return

            const container = containerRef.current
            const center = container.scrollLeft + (container.clientWidth / 2)
            const cardWidth = 400 + 24 // card width + gap estimated

            // Calculate which index is closest to center
            const index = Math.round(container.scrollLeft / cardWidth)
            setCenterIndex(index)
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener('scroll', handleScroll)
            // Initial calculation
            handleScroll()
        }

        return () => container?.removeEventListener('scroll', handleScroll)
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        if (containerRef.current) {
            const cardWidth = 424 // approximate width including gap
            const container = containerRef.current
            const targetScroll = direction === 'left'
                ? container.scrollLeft - cardWidth
                : container.scrollLeft + cardWidth

            container.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section id="creators" className="section group overflow-hidden">
            <div className="container-custom">
                <header className="text-center mb-12 flex flex-col items-center">
                    {/* Trust Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                        <span>✦</span>
                        <span>Cryptographically Verified</span>
                    </div>

                    <h2 className="section-title flex items-center justify-center gap-2 flex-wrap">
                        Claim your official{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
                            Creator Card.
                            {/* Logo as Verification Icon */}
                            <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                <rect width="32" height="32" rx="8" fill="#22C55E" />
                                <g transform="translate(4, 4)">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B0F14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                </g>
                            </svg>
                        </span>
                    </h2>
                    <p className="section-subtitle max-w-2xl mx-auto mt-4">
                        A cryptographically secured profile that proves authenticity across the web. One link for everything.
                    </p>
                </header>

                {/* Horizontal Scrollable Container */}
                <div className="relative py-10">
                    {/* Navigation Buttons */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center text-text-primary shadow-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 -ml-6 hidden md:flex hover:bg-white/5 hover:scale-110"
                        aria-label="Scroll left"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center text-text-primary shadow-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 -mr-6 hidden md:flex hover:bg-white/5 hover:scale-110"
                        aria-label="Scroll right"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div
                        ref={containerRef}
                        className="flex overflow-x-auto pb-12 pt-8 gap-6 snap-x snap-mandatory px-[10vw] md:px-[calc(50%-200px)] scrollbar-hide relative z-0"
                    >
                        {creators.map((creator, index) => {
                            // Simple distance logic for basic effect
                            const isFocused = index === centerIndex

                            return (
                                <article
                                    key={index}
                                    className={`
                                        card border border-white/10 overflow-hidden shrink-0 w-[85vw] md:w-[400px] snap-center 
                                        transition-all duration-500 ease-out
                                        ${isFocused ? 'scale-100 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10' : 'scale-90 opacity-60 grayscale-[0.5] z-0'}
                                    `}
                                >
                                    {/* Banner */}
                                    <div className={`h-24 bg-gradient-to-r ${creator.gradient}`} aria-hidden="true" />

                                    {/* Profile */}
                                    <div className="px-6 pb-6 -mt-10">
                                        {/* Avatar */}
                                        <div className="relative inline-block mb-4">
                                            {creator.avatar}
                                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-surface">
                                                <svg className="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Name and handle */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-text-primary">{creator.name}</h3>
                                                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 0121 12z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-text-secondary">antiai.me/{creator.handle}</p>
                                        </div>

                                        {/* Bio */}
                                        <p className="text-text-secondary text-sm leading-relaxed mb-6 line-clamp-2">
                                            {creator.bio}
                                        </p>

                                        {/* Official Links */}
                                        <div className="mb-6">
                                            <div className="flex flex-wrap gap-2">
                                                {creator.links.map((link, i) => (
                                                    <a
                                                        key={i}
                                                        href={link.url}
                                                        title={link.label}
                                                        className="w-9 h-9 rounded-lg bg-surface-light border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-primary/50 hover:scale-105 transition-all text-lg"
                                                    >
                                                        {link.icon === 'website' && '🌐'}
                                                        {link.icon === 'twitter' && '𝕏'}
                                                        {link.icon === 'instagram' && '📸'}
                                                        {link.icon === 'youtube' && '🎓'}
                                                        {link.icon === 'channel' && '📺'}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Verified Videos */}
                                        <div>
                                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                                                Verified Videos
                                            </p>
                                            <div className="space-y-2">
                                                {creator.videos.map((video, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-light"
                                                    >
                                                        {/* Thumbnail placeholder */}
                                                        <div className="w-12 h-8 rounded bg-background flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-3 h-3 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <p className="text-xs font-medium text-text-primary truncate">
                                                                    {video.title}
                                                                </p>
                                                                <svg className="w-3 h-3 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 0121 12z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-[10px] text-text-muted">
                                                                {video.views} views • {video.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
