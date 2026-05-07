'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Hero() {
    const [handle, setHandle] = useState('')

    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />

            {/* Gradient orbs */}
            <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
            <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" aria-hidden="true" />

            <div className="container-custom relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Trusted by 2,000+ creators</span>
                    </motion.div>

                    {/* Headline - Apple-style big text */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8"
                    >
                        Prove your videos{' '}
                        <br className="hidden sm:block" />
                        are <span style={{ color: '#22C55E' }}>real.</span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl sm:text-2xl text-text-secondary leading-relaxed mb-12 max-w-2xl mx-auto"
                    >
                        Cryptographic verification for creators on YouTube, TikTok, Instagram, and Facebook.
                        Stop deepfakes. Protect your audience.
                    </motion.p>

                    {/* Handle input + CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto mb-6"
                    >
                        <div className="relative flex-1 w-full">
                            <label htmlFor="hero-handle-input" className="sr-only">Your AntiAI handle</label>
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium" aria-hidden="true">
                                antiai.me/
                            </span>
                            <input
                                id="hero-handle-input"
                                type="text"
                                placeholder="yourname"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                className="w-full pl-[108px] pr-4 py-4 bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <Link
                            href={`/signup${handle ? `?handle=${handle}` : ''}`}
                            className="btn-primary-lg w-full sm:w-auto whitespace-nowrap rounded-xl"
                        >
                            Get started free
                        </Link>
                    </motion.div>

                    {/* Platform logos */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex items-center justify-center gap-8 mt-16"
                    >
                        <span className="text-xs text-text-muted uppercase tracking-widest">Works on</span>
                        {/* YouTube */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-text-muted hover:text-[#FF0000] transition-colors cursor-default" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                        </svg>
                        {/* TikTok */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-text-muted hover:text-[#00F2EA] transition-colors cursor-default" fill="currentColor">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                        {/* Instagram */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-text-muted hover:text-[#E4405F] transition-colors cursor-default" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        {/* Facebook */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-text-muted hover:text-[#1877F2] transition-colors cursor-default" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
