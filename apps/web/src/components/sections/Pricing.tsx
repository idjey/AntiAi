'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    const plans = [
        {
            name: 'Free',
            monthlyPrice: '0',
            yearlyPrice: '0',
            description: 'Get started with the basics',
            features: [
                '10 videos per month',
                '1 Shop Product',
                'Public Creator Page',
                'Content Verification',
                'Basic Color Themes',
            ],
            cta: 'Get Started',
            featured: false,
            href: '/signup'
        },
        {
            name: 'Pro',
            monthlyPrice: '15.99',
            yearlyPrice: '12.99',
            yearlyTotal: '155.88',
            savings: '36.00',
            description: 'For serious creators',
            features: [
                '100 videos per month',
                'Unlimited Shop Products',
                'Analytics Dashboard',
                'Custom Backgrounds & Effects',
                'Change Your Handle',
                'Email Support',
            ],
            cta: 'Upgrade to Pro',
            featured: true,
        },
        {
            name: 'Elite',
            monthlyPrice: '99.99',
            yearlyPrice: '89.99',
            yearlyTotal: '1,079.88',
            savings: '120.00',
            description: 'For power creators',
            features: [
                'Unlimited Videos & Products',
                'Everything in Pro',
                'Custom Domain Support',
                'White-label (Hide Logo)',
                'Email Support',
            ],
            cta: 'Upgrade to Elite',
            featured: false,
        },
    ]

    return (
        <section id="pricing" className="section bg-surface/50">
            <div className="container-custom">
                {/* Section header */}
                <header className="text-center mb-12">
                    <h2 className="section-title">
                        Simple, transparent <span className="text-primary">pricing.</span>
                    </h2>
                    <p className="section-subtitle mb-8">
                        Start free. Upgrade when you need more.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-text-primary' : 'text-text-secondary'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative w-14 h-8 bg-surface border border-border rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                            aria-label="Toggle billing cycle"
                        >
                            <div
                                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-primary transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span id="yearly-billing" className={`text-sm font-medium transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-text-primary' : 'text-text-secondary'}`}>
                            Yearly
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                Save up to $120
                            </span>
                        </span>
                    </div>
                </header>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, index) => {
                        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
                        const period = billingCycle === 'monthly' ? '/month' : '/year'

                        return (
                            <article
                                key={index}
                                className={`relative rounded-card p-6 lg:p-8 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] ${plan.featured
                                    ? 'bg-surface border-2 border-primary shadow-glow scale-105 lg:scale-110 z-10'
                                    : 'bg-surface border border-border hover:border-primary/50'
                                    }`}
                            >
                                {/* Featured badge */}
                                {plan.featured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-background shadow-[0_0_15px_rgba(34,197,94,0.4)]" role="status">
                                        Most Popular
                                    </div>
                                )}

                                {/* Plan header */}
                                <header className="text-center mb-6">
                                    <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-text-primary">
                                            ${price}
                                        </span>
                                        <span className="text-text-secondary text-sm">
                                            {price === '0' ? 'forever' : period}
                                        </span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.yearlyTotal && (
                                        <div className="mt-2 text-sm text-text-muted">
                                            Billed <span className="font-semibold text-text-primary">${plan.yearlyTotal}</span>/year
                                            <br />
                                            <span className="text-green-500 font-medium whitespace-nowrap bg-green-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">
                                                Save ${plan.savings}
                                            </span>
                                        </div>
                                    )}
                                    {billingCycle === 'monthly' && plan.yearlyTotal && (
                                        <div className="mt-2 text-sm text-transparent select-none">
                                            {/* Spacer to prevent layout shift */}
                                            Billed ${plan.yearlyTotal}/year<br /><span className="inline-block mt-2 px-2 py-0.5">Save</span>
                                        </div>
                                    )}
                                    <p className="text-sm text-text-secondary mt-3">
                                        {plan.description}
                                    </p>
                                </header>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center gap-3">
                                            <svg
                                                className={`w-5 h-5 flex-shrink-0 ${plan.featured ? 'text-primary' : 'text-text-muted group-hover:text-primary transition-colors'
                                                    }`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href={`/signup?plan=${plan.name.toUpperCase()}&interval=${billingCycle === 'monthly' ? 'month' : 'year'}`}
                                    className={`block w-full text-center py-3 rounded-button font-semibold transition-all duration-300 ${plan.featured
                                        ? 'bg-primary text-background hover:brightness-110 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                        : 'bg-surface-light text-text-primary group-hover:bg-primary group-hover:text-background'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </article>
                        )
                    })}
                </div>

                {/* Note */}
                <p className="text-center text-sm text-text-muted mt-8">
                    No credit card required for the Free plan. Upgrade anytime.
                </p>
            </div>
        </section>
    )
}
