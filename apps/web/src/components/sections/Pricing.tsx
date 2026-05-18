'use client'

import Link from 'next/link'
import { useState } from 'react'

// ==================== TRUST BAR ====================
function TrustBar() {
    const stats = [
        { value: '12,400+', label: 'Videos verified' },
        { value: '340+', label: 'Creators protected' },
        { value: '38', label: 'Countries' },
        { value: '5', label: 'Browsers supported' },
    ]
    return (
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-12 py-4">
            {stats.map((s, i) => (
                <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-text-primary">{s.value}</div>
                    <div className="text-xs uppercase tracking-wider text-text-muted mt-1">{s.label}</div>
                </div>
            ))}
        </div>
    )
}

// ==================== LIVE PROOF CALLOUT ====================
function LiveProofCallout() {
    return (
        <div className="rounded-lg bg-secondary/5 border border-secondary/20 p-3 my-3 text-xs text-text-secondary">
            <strong className="text-secondary">Live Proof</strong> — Issue a real-time liveness challenge
            that proves you're genuinely on camera. Viewers can verify it
            instantly. No competitor offers this.
        </div>
    )
}

// ==================== FEATURE TABLE ====================
function FeatureTable() {
    const [open, setOpen] = useState(false)
    const sections = [
        {
            title: 'VERIFICATION', rows: [
                ['Verified videos per month', '5', '100', '500', '∞', '∞'],
                ['Cryptographic proof badge', '✓', '✓', '✓', '✓', '✓'],
                ['Ed25519 digital signature', '✓', '✓', '✓', '✓', '✓'],
                ['Public verification URL', '✓', '✓', '✓', '✓', '✓'],
                ['Live Proof challenges', '–', '–', '✓', '✓', '✓'],
                ['Proof expiry', '90 days', '1 yr', '1 yr', '1 yr', 'Custom'],
                ['White-label badge', '–', '–', '–', '✓', '✓'],
                ['Transparency log export', '–', '–', '–', '✓', '✓'],
            ]
        },
        {
            title: 'CREATOR PAGE', rows: [
                ['Shop products', '1', '∞', '∞', '∞', '∞'],
                ['Custom backgrounds & effects', '–', '✓', '✓', '✓', '✓'],
                ['Change @handle', '–', '✓', '✓', '✓', '✓'],
                ['Custom domain', '–', '–', '✓', '✓', '✓'],
                ['Featured in directory', '–', '–', '–', '✓', '✓'],
            ]
        },
        {
            title: 'ANALYTICS & API', rows: [
                ['Analytics dashboard', '–', '✓', '✓', '✓', '✓'],
                ['API access (calls/month)', '–', '–', '10,000', '∞', '∞'],
            ]
        },
        {
            title: 'SUPPORT', rows: [
                ['Email support', '–', '✓', '✓', '✓', '✓'],
                ['Priority support', '–', '–', '✓', '✓', '✓'],
                ['Dedicated account manager', '–', '–', '–', '–', '✓'],
                ['SLA guarantee', '–', '–', '–', '–', '✓'],
            ]
        },
    ]
    const tiers = ['Free', 'Pro', 'Business', 'Elite', 'Enterprise']

    return (
        <div className="mt-16 max-w-6xl mx-auto">
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-center py-3 text-sm font-semibold text-primary hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
            >
                {open ? 'Hide' : 'Compare all features'}
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="mt-4 overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-surface-light">
                                <th className="text-left py-3 px-4 text-text-muted font-medium w-1/3">Feature</th>
                                {tiers.map((t, i) => (
                                    <th key={i} className={`py-3 px-3 text-center font-semibold ${t === 'Business' ? 'text-primary bg-primary/5' : 'text-text-primary'}`}>{t}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sections.map((section, si) => (
                                <>
                                    <tr key={`section-${si}`} className="bg-surface">
                                        <td colSpan={6} className="py-2 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">{section.title}</td>
                                    </tr>
                                    {section.rows.map((row, ri) => (
                                        <tr key={`${si}-${ri}`} className="border-t border-border/50 hover:bg-surface/50">
                                            <td className="py-2.5 px-4 text-text-secondary">{row[0]}</td>
                                            {row.slice(1).map((cell, ci) => (
                                                <td key={ci} className={`py-2.5 px-3 text-center ${ci === 2 ? 'bg-primary/5' : ''} ${cell === '✓' ? 'text-green-500 font-bold' : cell === '–' ? 'text-text-muted' : 'text-text-primary font-medium'}`}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ==================== FAQ ====================
function PricingFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const faqs = [
        {
            q: 'What happens to my verified videos if I cancel?',
            a: 'All proofs you\'ve issued remain valid and publicly verifiable — forever. Cancelling your subscription stops new proof issuance, but never invalidates existing ones. Your viewers can still verify past videos.'
        },
        {
            q: 'Can YouTube or TikTok see my verification?',
            a: 'No. AntiAI.me operates independently of platforms using a browser extension. Verification happens client-side in the viewer\'s browser — platforms have no visibility into our cryptographic layer.'
        },
        {
            q: 'How is this different from YouTube\'s AI disclosure labels?',
            a: 'YouTube\'s labels are self-reported. Our badges are cryptographically signed — mathematically impossible to fake without your private key. They prove the video was uploaded by you, from your verified channel, at a specific point in time.'
        },
        {
            q: 'What is "Live Proof" and why does it matter?',
            a: 'Live Proof (Business+) lets you issue a real-time challenge during a livestream or video — a random object or phrase that proves you\'re genuinely on camera at that moment. No deepfake can respond to an unknown challenge.'
        },
        {
            q: 'Is my content stored by AntiAI.me?',
            a: 'No. We never store your video files. We sign cryptographic metadata about your video (channel ID, video ID, timestamp) — not the content itself. Your videos stay entirely on YouTube or TikTok.'
        },
        {
            q: 'What happens if my signing keys are compromised?',
            a: 'We can instantly revoke any proof and issue new ones. Our transparency log records every issuance and revocation publicly, so anyone can audit the history of your verified content.'
        },
        {
            q: 'Do you offer refunds?',
            a: 'Yes — 14-day full refund, no questions asked. Contact enterprise@antiai.me.'
        },
    ]
    return (
        <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
            <div className="space-y-3">
                {faqs.map((faq, i) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                        >
                            <span className="font-semibold text-sm text-text-primary">{faq.q}</span>
                            <svg className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openIndex === i && (
                            <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">{faq.a}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ==================== MAIN PRICING COMPONENT ====================
export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    const plans = [
        {
            name: 'Free',
            monthlyPrice: '0',
            yearlyPrice: '0',
            tagline: 'See how verified content looks before you commit.',
            features: [
                { text: 'View cryptographic badges on verified videos', included: true },
                { text: '5 verified videos per month', included: true },
                { text: 'Public creator profile page', included: true },
                { text: '1 shop product', included: true },
                { text: 'Basic colour themes', included: true },
            ],
            note: 'Free proofs display the AntiAI.me badge. Upgrade to hide it.',
            cta: 'Get Started Free',
            featured: false,
            badge: null,
        },
        {
            name: 'Pro',
            monthlyPrice: '24.99',
            yearlyPrice: '19.99',
            yearlyTotal: '239.88',
            savings: '60',
            tagline: "For creators who've been deepfaked — or don't want to be.",
            features: [
                { text: 'Cryptographic proof badge on every video', included: true },
                { text: '100 verified videos per month', included: true },
                { text: 'Tamper-proof Ed25519 digital signature', included: true },
                { text: 'Public verification URL for every video', included: true },
                { text: 'Analytics dashboard', included: true },
                { text: 'Unlimited shop products', included: true },
                { text: 'Custom backgrounds & effects', included: true },
                { text: 'Change your @handle', included: true },
                { text: 'Email support', included: true },
                { text: 'Live Proof challenges (Business+)', included: false },
                { text: 'Custom domain (Business+)', included: false },
            ],
            cta: 'Upgrade to Pro',
            featured: true,
            badge: 'Most Popular',
        },
        {
            name: 'Business',
            monthlyPrice: '49.99',
            yearlyPrice: '39.99',
            yearlyTotal: '479.88',
            savings: '120',
            tagline: 'For high-volume creators and agencies managing multiple channels.',
            features: [
                { text: 'Everything in Pro', included: true },
                { text: '500 verified videos per month', included: true },
                { text: 'Live Proof challenges (liveness verification)', included: true, hero: true },
                { text: 'Custom domain for your creator profile', included: true },
                { text: 'API access (10,000 calls/month)', included: true },
                { text: 'Priority email support', included: true },
                { text: 'White-label badge (Elite only)', included: false },
                { text: 'Unlimited API calls (Elite only)', included: false },
            ],
            showLiveProofCallout: true,
            cta: 'Upgrade to Business',
            featured: false,
            badge: 'New',
        },
        {
            name: 'Elite',
            monthlyPrice: '99.99',
            yearlyPrice: '79.99',
            yearlyTotal: '959.88',
            savings: '240',
            tagline: 'Unlimited everything. Your reputation, fully protected.',
            features: [
                { text: 'Everything in Business', included: true },
                { text: 'Unlimited verified videos', included: true },
                { text: 'Unlimited API calls', included: true },
                { text: 'White-label badge (hide AntiAI.me branding)', included: true },
                { text: 'Transparency log export (PDF/CSV)', included: true },
                { text: 'Featured in creator directory', included: true },
                { text: 'Dedicated support', included: true },
            ],
            cta: 'Upgrade to Elite',
            featured: false,
            badge: null,
        },
    ]

    return (
        <section id="pricing" className="section bg-surface/50">
            <div className="container-custom">
                {/* Trust Bar */}
                <TrustBar />

                {/* Header */}
                <header className="text-center mb-12">
                    <h2 className="section-title">
                        Prove every video is really <span className="text-primary">you.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-2">
                        Cryptographic verification — not just a checkmark.<br className="hidden sm:inline" />
                        One badge that makes deepfakes provably impossible to fake.
                    </p>
                    <p className="text-sm text-text-muted mb-8">
                        Start free. No credit card required. Upgrade when your audience grows.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-text-primary' : 'text-text-secondary'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative w-14 h-8 bg-surface border border-border rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                            aria-label="Toggle billing cycle"
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-primary transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-text-primary' : 'text-text-secondary'}`}>
                            Yearly
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">✦ Save up to 20%</span>
                        </span>
                    </div>
                </header>

                {/* Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan, index) => {
                        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

                        return (
                            <article
                                key={index}
                                className={`relative rounded-card p-6 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] flex flex-col ${plan.featured
                                    ? 'bg-surface border-2 border-primary shadow-glow z-10'
                                    : 'bg-surface border border-border hover:border-primary/50'
                                    }`}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-background shadow-lg ${plan.badge === 'Most Popular' ? 'bg-primary' : 'bg-secondary'}`}>
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Plan header */}
                                <header className="text-center mb-4">
                                    <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-text-primary">${price}</span>
                                        <span className="text-text-secondary text-sm">{price === '0' ? 'forever' : '/month'}</span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.savings && (
                                        <div className="mt-1 text-xs text-green-500 font-medium">Save ${plan.savings}/year</div>
                                    )}
                                    <p className="text-xs text-text-muted mt-2 leading-relaxed">{plan.tagline}</p>
                                </header>

                                {/* CTA */}
                                <Link
                                    href={`/signup?plan=${plan.name.toUpperCase()}&interval=${billingCycle === 'monthly' ? 'month' : 'year'}`}
                                    className={`block w-full text-center py-2.5 rounded-button font-semibold text-sm transition-all duration-300 mb-4 ${plan.featured
                                        ? 'bg-primary text-background hover:brightness-110 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                        : 'bg-surface-light text-text-primary group-hover:bg-primary group-hover:text-background'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>

                                {/* Divider */}
                                <div className="border-t border-border mb-4" />

                                {/* Features */}
                                <ul className="space-y-2.5 flex-1">
                                    {plan.features.map((feature, fi) => (
                                        <li key={fi} className="flex items-start gap-2.5">
                                            {feature.included ? (
                                                <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? 'text-primary' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4 mt-0.5 shrink-0 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            )}
                                            <span className={`text-xs leading-relaxed ${feature.included ? 'text-text-secondary' : 'text-text-muted/60'}`}>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Live Proof Callout (Business only) */}
                                {'showLiveProofCallout' in plan && plan.showLiveProofCallout && <LiveProofCallout />}

                                {/* Note (Free only) */}
                                {plan.note && <p className="text-[10px] text-text-muted mt-3 text-center leading-relaxed">{plan.note}</p>}
                            </article>
                        )
                    })}
                </div>

                {/* Enterprise Card */}
                <div className="mt-10 max-w-7xl mx-auto bg-surface border border-border rounded-card p-8 md:p-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-4">
                                For newsrooms, talent agencies, political campaigns, and legal evidence authentication. Custom pricing, SLA, and dedicated support.
                            </p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-text-secondary">
                                {[
                                    'Everything in Elite', 'Bulk creator seats',
                                    'SLA guarantee (99.9%)', 'Custom key management',
                                    'White-label badge + domain', 'Compliance reporting',
                                    'Dedicated account manager', 'Custom contract terms',
                                ].map((f, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        <span className="text-xs">{f}</span>
                                    </div>
                                ))}
                                <div className="flex flex-col gap-3 shrink-0">
                                    <a href="mailto:enterprise@antiai.me" className="btn-primary text-sm px-8">Contact Us</a>
                                </div>
                            </div>
                        </div>

                        {/* Feature Comparison Table */}
                        <FeatureTable />

                        {/* FAQ */}
                        <PricingFAQ />

                        {/* Enterprise CTA Strip */}
                        <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8 bg-surface border-y border-border py-12 px-6 text-center">
                            <h3 className="text-2xl font-bold mb-2">Protecting content at scale?</h3>
                            <p className="text-sm text-text-secondary max-w-xl mx-auto mb-6">
                                Newsrooms, talent agencies, and political campaigns use AntiAI.me to verify content across entire rosters of creators.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <a href="mailto:enterprise@antiai.me" className="btn-primary text-sm">Book a Demo →</a>
                                <a href="#pricing" className="btn-secondary text-sm">View Enterprise Features →</a>
                            </div>
                            <p className="text-xs text-text-muted mt-4">Trusted by creators in 38 countries. No credit card required to start.</p>
                        </div>
                    </div>
                </section>
                )
}
