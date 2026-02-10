export default function Problem() {
    const problems = [
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
            ),
            title: 'Fake videos stealing views',
            description: 'AI-generated content impersonating creators is flooding platforms, stealing views and misleading audiences.',
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
            ),
            title: 'Scammers impersonating creators',
            description: 'Bad actors use deepfake technology to run scams, promote fraud, and damage creator reputations.',
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            ),
            title: 'Audiences losing trust',
            description: 'Viewers can no longer tell what\'s real. Trust in online content is collapsing across every platform.',
        },
    ]

    return (
        <section className="section bg-surface/50">
            <div className="container-custom">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="section-title">
                        Deepfakes are{' '}
                        <span className="text-red-500">eroding trust</span> online.
                    </h2>
                    <p className="section-subtitle">
                        Every day, millions of viewers are fooled by AI-generated content.
                        The problem is only getting worse.
                    </p>
                </div>

                {/* Problem cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="card-hover text-center p-8 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:border-red-500/50 transition-all duration-300"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mb-6">
                                {problem.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-text-primary mb-3">
                                {problem.title}
                            </h3>
                            <p className="text-text-secondary leading-relaxed">
                                {problem.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
