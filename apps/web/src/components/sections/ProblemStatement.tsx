'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const stats = [
    { value: '96%', label: 'of people can\'t detect deepfakes', color: 'text-red-500' },
    { value: '500%', label: 'increase in AI-generated video in 2025', color: 'text-red-500' },
    { value: '$25B', label: 'lost to deepfake fraud globally', color: 'text-red-500' },
]

export default function ProblemStatement() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    })

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
    const scale = useTransform(scrollYProgress, [0, 0.3], [0.95, 1])

    return (
        <section ref={sectionRef} className="relative py-32 px-4 overflow-hidden">
            {/* Dark vignette background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06),transparent_70%)] pointer-events-none" />

            <motion.div className="container-custom relative z-10" style={{ opacity, scale }}>
                {/* Big statement */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
                    >
                        AI can clone{' '}
                        <span className="text-red-500">anyone's</span> face and voice.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-text-secondary leading-relaxed"
                    >
                        Deepfakes are flooding YouTube, TikTok, Instagram, and Facebook.
                        <br className="hidden md:block" />
                        Your audience can no longer tell what's real.
                    </motion.p>
                </div>

                {/* Stats row */}
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 + idx * 0.15 }}
                            className="text-center"
                        >
                            <div className={`text-5xl md:text-6xl font-black mb-3 ${stat.color}`}>
                                {stat.value}
                            </div>
                            <p className="text-text-secondary text-sm md:text-base">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    )
}
