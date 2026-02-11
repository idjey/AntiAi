'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function Hero() {
    const [handle, setHandle] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            })
        }

        container.addEventListener('mousemove', handleMouseMove)
        return () => container.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden group">
            {/* Spotlight effect */}
            <div
                className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgb(var(--primary) / 0.30), transparent 40%)`,
                }}
            />

            {/* Background grid */}
            <div className="absolute inset-0 bg-grid opacity-50" />

            {/* Gradient orb */}
            <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />

            <div className="container-custom relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left side - Content */}
                    <div className="text-center lg:text-left">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-medium text-primary">Trusted by 2,000+ creators</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            The authenticity badge for{' '}
                            <span className="text-gradient">real creators.</span>
                        </h1>

                        {/* Subtext */}
                        <p className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                            Verify your videos with cryptographic proof.
                            <br className="hidden sm:block" />
                            Protect your audience from deepfakes and impersonators.
                        </p>

                        {/* Handle input + CTA */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto lg:mx-0 mb-6">
                            <div className="relative flex-1 w-full">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">
                                    antiai.me/
                                </span>
                                <input
                                    type="text"
                                    placeholder="yourname"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    className="w-full pl-[108px] pr-4 py-3.5 bg-surface border border-white/10 rounded-button text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <Link
                                href={`/signup${handle ? `?handle=${handle}` : ''}`}
                                className="btn-primary-lg w-full sm:w-auto whitespace-nowrap"
                            >
                                Get started free
                            </Link>
                        </div>

                        {/* Secondary link */}
                        <Link
                            href="#how-it-works"
                            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
                        >
                            <span>See how it works</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Right side - Mockup */}
                    <div className="relative lg:pl-8">
                        <div className="animate-float">
                            {/* YouTube player mockup */}
                            <div className="relative bg-surface rounded-xl overflow-hidden border border-white/10 shadow-card">
                                {/* Video thumbnail area */}
                                <div className="aspect-video bg-surface-light relative">
                                    {/* Play button */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                                            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Verified badge overlay */}
                                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/90 backdrop-blur-sm">
                                        <svg className="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-background">Verified</span>
                                    </div>
                                </div>

                                {/* Video info */}
                                <div className="p-4">
                                    <div className="flex gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-primary truncate mb-1">
                                                How to Protect Your Content Online
                                            </h3>
                                            <p className="text-sm text-text-secondary">
                                                Alex Crypto • 125K views • 2 days ago
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Creator profile card */}
                            <div className="absolute -bottom-6 -right-4 bg-surface rounded-xl p-4 border border-white/10 shadow-card w-64">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary" />
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-text-primary">Alex Crypto</span>
                                            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-text-secondary">antiai.me/alexcrypto</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                                        12 verified videos
                                    </span>
                                    <span className="px-2 py-1 rounded bg-surface-light text-text-secondary">
                                        2 channels
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
