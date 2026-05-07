'use client'

import { motion } from 'framer-motion'

const roadmap = [
    {
        phase: 'Now',
        title: 'Browser Extension',
        description: 'Our Chrome extension verifies videos in real-time on YouTube, TikTok, Instagram, and Facebook, right in your desktop browser.',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            </svg>
        ),
        status: 'active',
    },
    {
        phase: 'Soon',
        title: 'Mobile App (Share Sheet)',
        description: 'See a suspicious video on your phone? Tap "Share" → AntiAI and get an instant verification notification. Works with any app.',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
        ),
        status: 'upcoming',
    },
    {
        phase: 'Vision',
        title: 'Enterprise API',
        description: 'The "Stripe for Content Authenticity." Platforms like X, Meta, and TikTok integrate our API natively, no extension needed.',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
        ),
        status: 'future',
    },
]

export default function Roadmap() {
    return (
        <section className="py-32 px-4 relative overflow-hidden bg-[#0A0A0A]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-primary/3 blur-[150px] rounded-full pointer-events-none" />

            <div className="container-custom relative z-10">
                <header className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
                    >
                        Where we're{' '}
                        <span style={{ color: '#22C55E' }}>headed.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        From browser extension to the global standard for content authenticity.
                    </motion.p>
                </header>

                <div className="max-w-3xl mx-auto relative">
                    {/* Vertical connector line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />

                    <div className="space-y-12">
                        {roadmap.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.15 }}
                                className="flex gap-6 md:gap-8 items-start"
                            >
                                {/* Timeline dot */}
                                <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${item.status === 'active'
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : item.status === 'upcoming'
                                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                            : 'bg-white/5 border-white/10 text-text-muted'
                                    }`}>
                                    {item.icon}
                                    {item.status === 'active' && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${item.status === 'active' ? 'text-primary' : item.status === 'upcoming' ? 'text-yellow-500' : 'text-text-muted'
                                            }`}>
                                            {item.phase}
                                        </span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
