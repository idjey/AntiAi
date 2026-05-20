'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const comparisonData = [
    {
        feature: 'Accuracy Guarantee',
        antiAI: { value: '100% Deterministic Math', icon: CheckCircle2, color: 'text-primary' },
        detectors: { value: 'High False Positives', icon: XCircle, color: 'text-red-500/70' },
        watermarks: { value: 'Easily Stripped', icon: AlertTriangle, color: 'text-orange-500/70' },
    },
    {
        feature: 'Protects Human Creators',
        antiAI: { value: 'Yes (Signs Original Work)', icon: CheckCircle2, color: 'text-primary' },
        detectors: { value: 'No', icon: XCircle, color: 'text-red-500/70' },
        watermarks: { value: 'No (Tags AI Output)', icon: XCircle, color: 'text-red-500/70' },
    },
    {
        feature: 'Shelf Life',
        antiAI: { value: 'Permanent', icon: CheckCircle2, color: 'text-primary' },
        detectors: { value: 'Degrades as AI evolves', icon: AlertTriangle, color: 'text-orange-500/70' },
        watermarks: { value: 'Broken by compression', icon: AlertTriangle, color: 'text-orange-500/70' },
    },
    {
        feature: 'Requires Centralized AI',
        antiAI: { value: 'No (Decentralized Crypto)', icon: CheckCircle2, color: 'text-primary' },
        detectors: { value: 'Yes (Heavy GPU Inference)', icon: XCircle, color: 'text-red-500/70' },
        watermarks: { value: 'Yes (Proprietary Models)', icon: XCircle, color: 'text-red-500/70' },
    },
];

export default function Comparison() {
    return (
        <section className="py-24 relative overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

            <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                            The Paradigm Shift
                        </h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-4">
                            Why Detection is Dead
                        </h3>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Big Tech relies on guessing if content is fake (Detectors) or secretly tagging their own AI (Watermarks). AntiAI uses deterministic math to prove content is real.
                        </p>
                    </motion.div>
                </div>

                <div className="overflow-x-auto pb-8">
                    <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-4 mb-6 px-4">
                            <div className="font-semibold text-text-muted uppercase text-sm tracking-wider self-end pb-2">
                                Security Vector
                            </div>
                            <div className="bg-primary/10 border border-primary/20 rounded-t-2xl p-4 text-center">
                                <div className="text-primary font-bold text-lg">AntiAI</div>
                                <div className="text-primary/70 text-xs mt-1 font-mono">Ed25519 Cryptography</div>
                            </div>
                            <div className="bg-surface/30 border-t border-x border-white/5 rounded-t-2xl p-4 text-center">
                                <div className="text-text-primary font-bold text-lg">SynthID / Watermarks</div>
                                <div className="text-text-muted text-xs mt-1 font-mono">Steganography</div>
                            </div>
                            <div className="bg-surface/30 border-t border-x border-white/5 rounded-t-2xl p-4 text-center">
                                <div className="text-text-primary font-bold text-lg">AI Detectors</div>
                                <div className="text-text-muted text-xs mt-1 font-mono">Heuristics</div>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="space-y-3">
                            {comparisonData.map((row, index) => (
                                <motion.div
                                    key={row.feature}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="grid grid-cols-4 gap-4 items-center group"
                                >
                                    <div className="px-4 py-5 bg-surface/20 rounded-xl border border-white/5 font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                        {row.feature}
                                    </div>
                                    
                                    <div className="p-5 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3 relative overflow-hidden group-hover:bg-primary/10 transition-colors">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                                        <row.antiAI.icon className={`w-5 h-5 shrink-0 ${row.antiAI.color}`} />
                                        <span className="text-sm font-semibold text-text-primary">{row.antiAI.value}</span>
                                    </div>

                                    <div className="p-5 bg-surface/30 border border-white/5 rounded-xl flex items-center gap-3">
                                        <row.watermarks.icon className={`w-5 h-5 shrink-0 ${row.watermarks.color}`} />
                                        <span className="text-sm text-text-secondary">{row.watermarks.value}</span>
                                    </div>

                                    <div className="p-5 bg-surface/30 border border-white/5 rounded-xl flex items-center gap-3">
                                        <row.detectors.icon className={`w-5 h-5 shrink-0 ${row.detectors.color}`} />
                                        <span className="text-sm text-text-secondary">{row.detectors.value}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
