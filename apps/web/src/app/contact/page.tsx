'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, ShieldAlert } from 'lucide-react'

// Contact Options Data
const contactOptions = [
    {
        id: 'support',
        title: 'Creator Support',
        description: 'Need help with your profile, verification, or have a general question?',
        icon: MessageSquare,
        actionText: 'Get Support',
        href: 'mailto:support@antiai.me',
        color: 'from-blue-500/20 to-blue-500/0',
        borderColor: 'group-hover:border-blue-500/50',
        iconColor: 'text-blue-400',
    },
    {
        id: 'partnerships',
        title: 'Partnerships & Agencies',
        description: 'Looking to secure your roster or discuss a potential partnership?',
        icon: Mail,
        actionText: 'Contact Sales',
        href: 'mailto:partnerships@antiai.me',
        color: 'from-purple-500/20 to-purple-500/0',
        borderColor: 'group-hover:border-purple-500/50',
        iconColor: 'text-purple-400',
    },
    {
        id: 'report',
        title: 'Report Abuse',
        description: 'Found a deepfake, fake profile, or need to report a bug?',
        icon: ShieldAlert,
        actionText: 'Report Issue',
        href: 'mailto:security@antiai.me?subject=Urgent:%20Report',
        color: 'from-red-500/20 to-red-500/0',
        borderColor: 'group-hover:border-red-500/50',
        iconColor: 'text-red-400',
    },
]

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
}

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center py-24 sm:py-32">

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container-custom max-w-5xl relative z-10 w-full px-4 text-center">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="mb-16 sm:mb-24"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight mb-6">
                        How can we <span className="text-primary">help?</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        Select the option that best describes what you need. We'll make sure you reach the right person, fast.
                    </p>
                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left"
                >
                    {contactOptions.map((option) => {
                        const Icon = option.icon
                        return (
                            <motion.a
                                href={option.href}
                                key={option.id}
                                variants={itemVariants}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative flex flex-col h-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-300 ${option.borderColor} overflow-hidden hover:bg-white/[0.04]`}
                            >
                                {/* Gradient Hover Background */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${option.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-white/10 transition-colors duration-300">
                                        <Icon className={`w-7 h-7 ${option.iconColor}`} />
                                    </div>

                                    <h3 className="text-2xl font-semibold text-text-primary mb-4 tracking-tight">
                                        {option.title}
                                    </h3>

                                    <p className="text-text-secondary leading-relaxed flex-grow mb-8">
                                        {option.description}
                                    </p>

                                    <div className="flex items-center text-sm font-medium text-text-primary group-hover:text-primary transition-colors duration-300 mt-auto">
                                        {option.actionText}
                                        <svg
                                            className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.a>
                        )
                    })}
                </motion.div>

                {/* Optional Fallback Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="mt-16 text-sm text-text-muted"
                >
                    Just want to say hi? Reach out to us on <a href="https://twitter.com/antiaime" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors hover:underline">Twitter</a>.
                </motion.p>
            </div>
        </div>
    )
}
