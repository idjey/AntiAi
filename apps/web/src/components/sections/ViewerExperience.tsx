import Link from 'next/link'

export default function ViewerExperience() {
    return (
        <section className="section bg-surface/50">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left side - Content */}
                    <header>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            How viewers know it's{' '}
                            <span className="text-primary">really you.</span>
                        </h2>
                        <p className="text-lg text-text-secondary leading-relaxed mb-8">
                            Our browser extension shows verification badges directly on YouTube.
                            Viewers can instantly see which videos are authentic — no extra steps required.
                        </p>

                        {/* Features list */}
                        <ul className="space-y-4">
                            {[
                                'Works automatically on YouTube',
                                'Shows verified badge on authentic videos',
                                'Flags suspicious or unverified content',
                                'One-click to view proof details',
                            ].map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-text-primary">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA */}
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link href="/extension" className="btn-primary">
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                                Install Extension
                            </Link>
                            <Link href="#protocol" className="btn-secondary">
                                Learn more
                            </Link>
                        </div>
                    </header>

                    {/* Right side - Browser mockup */}
                    <div className="relative" aria-hidden="true">
                        <div className="bg-surface rounded-xl border border-white/10 shadow-card overflow-hidden">
                            {/* Browser chrome */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-surface-light border-b border-white/5">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                </div>
                                <div className="flex-1 ml-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-lg max-w-md">
                                        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-sm text-text-secondary">youtube.com/watch?v=abc123</span>
                                    </div>
                                </div>
                            </div>

                            {/* YouTube mockup */}
                            <div className="p-4 bg-background">
                                {/* Video area */}
                                <div className="aspect-video bg-surface-light rounded-lg relative mb-4">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Verified badge overlay */}
                                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary backdrop-blur-sm shadow-lg">
                                        <svg className="w-4 h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-background">Verified by antiai.me</span>
                                    </div>
                                </div>

                                {/* Video title */}
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-text-primary text-sm mb-1">
                                            Breaking: Important Market Update
                                        </h3>
                                        <p className="text-xs text-text-secondary">
                                            Alex Crypto • 45K views • 1 hour ago
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extension popup mockup */}
                        <div className="absolute -bottom-4 -right-4 bg-surface rounded-xl p-4 border border-white/10 shadow-card-hover w-64 animate-float">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-primary">Video Verified</p>
                                    <p className="text-xs text-text-secondary">Proof issued 2h ago</p>
                                </div>
                            </div>
                            <button className="w-full text-xs text-center py-2 bg-surface-light rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                                View proof details →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
