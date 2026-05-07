'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const steps = [
    {
        number: '01',
        title: 'Creator signs their content',
        description: 'When you upload a video, AntiAI generates a unique cryptographic fingerprint using Ed25519 — the same standard used by SSH and blockchain wallets.',
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Signature animation */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                        </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                </div>
            </div>
        ),
    },
    {
        number: '02',
        title: 'Proof is locked in the ledger',
        description: 'The fingerprint, timestamp, and your verified identity are permanently recorded in our tamper-proof Transparency Log. Once written, it can never be altered.',
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-surface-light border border-white/5"
                            style={{ opacity: 1 - i * 0.2 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="font-mono text-xs text-text-secondary">
                                {i === 0 && 'sha256:a9f3...e7d1'}
                                {i === 1 && 'sha256:c4b2...8fa3'}
                                {i === 2 && 'sha256:7e91...2bc5'}
                            </span>
                            <svg className="w-4 h-4 text-primary ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        number: '03',
        title: 'Viewers see the truth instantly',
        description: 'Our free browser extension checks every video in real-time. Authentic content gets a green badge. Deepfakes get flagged with a warning. No guesswork.',
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="flex gap-4">
                    {/* Real */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-16 rounded-lg bg-surface-light border border-primary/30 flex items-center justify-center relative">
                            <svg className="w-6 h-6 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-primary">AUTHENTIC</span>
                    </div>
                    {/* Fake */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-16 rounded-lg bg-surface-light border border-red-500/30 flex items-center justify-center relative">
                            <svg className="w-6 h-6 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-red-500">DEEPFAKE</span>
                    </div>
                </div>
            </div>
        ),
    },
]

export default function HowItWorks() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    })

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

    return (
        <section ref={sectionRef} id="how-it-works" className="py-32 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

            <motion.div className="container-custom relative z-10" style={{ opacity }}>
                <header className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                        3 Simple Steps
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
                    >
                        How AntiAI{' '}
                        <span style={{ color: '#22C55E' }}>protects you.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto"
                    >
                        A mathematical proof that your content is real. Not AI guesswork — cryptographic certainty.
                    </motion.p>
                </header>

                <div className="space-y-24">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.6 }}
                            className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-lg">
                                        {step.number}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                                    {step.title}
                                </h3>
                                <p className="text-lg text-text-secondary leading-relaxed">
                                    {step.description}
                                </p>
                            </div>

                            <div className={`${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                                <div className="bg-surface border border-white/5 rounded-2xl p-10 h-52 flex items-center justify-center">
                                    {step.visual}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    )
}
