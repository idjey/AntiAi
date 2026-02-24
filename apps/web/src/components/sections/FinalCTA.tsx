import Link from 'next/link'

export default function FinalCTA() {
    return (
        <section className="section">
            <div className="container-custom">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-surface-light p-8 md:p-12 lg:p-16 text-center">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" aria-hidden="true" />
                    <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-[80px]" aria-hidden="true" />

                    {/* Content */}
                    <div className="relative z-10 max-w-2xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8" role="status">
                            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                            <span className="font-medium text-primary">Join 2,000+ verified creators</span>
                        </div>

                        {/* Headline */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            Protect your audience.
                            <br />
                            <span className="text-gradient">Prove your videos are real.</span>
                        </h2>

                        {/* Subtext */}
                        <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto">
                            Start verifying your content today. Set up takes less than 2 minutes.
                            No credit card required.
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/signup" className="btn-primary-lg px-10">
                                Get started for free
                            </Link>
                            <Link href="#how-it-works" className="btn-secondary px-6">
                                See how it works
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
