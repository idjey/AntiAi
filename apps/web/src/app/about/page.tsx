import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'

export const metadata = {
    title: 'About | AntiAI.me',
    description: 'Why we built AntiAI.me — the story behind cryptographic authenticity for creators.',
}

const values = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 013 10c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622A11.955 11.955 0 0120.402 6a11.959 11.959 0 01-3.002-1.036m-3.36-2.928A12.002 12.002 0 0112 2.964c-.73 0-1.44.076-2.13.218" />
            </svg>
        ),
        title: 'Proof over promises',
        body: "Anyone can claim they're real. We built a system where the math does the talking. No trust required."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
        ),
        title: 'Creators first',
        body: "We built this for creators who've spent years earning their audience's trust. That trust is worth protecting."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
        ),
        title: 'Open by design',
        body: "Verification should be public. Anyone should be able to check a proof without creating an account, paying, or trusting us."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        title: 'Ship and learn',
        body: "We're not academics. We're builders who got frustrated and decided to do something about it. We'll make mistakes. We'll fix them."
    },
]

export default function AboutPage() {
    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

                <div className="container-custom relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Our story
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                        We got tired of watching
                        <span className="text-gradient bg-gradient-to-r from-primary to-secondary"> fake content win.</span>
                    </h1>
                    <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
                        AntiAI.me started with a simple frustration — deepfakes were getting good, detection tools weren't keeping up,
                        and real creators were paying the price. So we built something different.
                    </p>
                </div>
            </section>

            {/* Origin story */}
            <section className="py-16 border-t border-white/5">
                <div className="container-custom max-w-3xl">
                    <div className="prose prose-lg max-w-none">
                        <div className="space-y-6 text-text-secondary leading-relaxed text-[17px]">
                            <p>
                                It started with a YouTube video. Someone had created a convincing deepfake of a creator we follow —
                                same voice, same face, same editing style — promoting a scam. The comments were full of people who
                                had already fallen for it. The original creator had to put out a damage-control video explaining it
                                wasn't them.
                            </p>
                            <p>
                                That felt wrong to us. The burden was entirely on the victim. After years of building an audience
                                and establishing trust, one well-crafted fake can do real damage — and there's basically nothing
                                you can do to stop it after the fact.
                            </p>
                            <p>
                                We looked at the existing tools. AI detection models. Watermarking services. They all had the same
                                fundamental problem: they're <em className="text-text-primary">reactive</em>. They try to detect
                                manipulation after it happens. And as AI gets better, so do the fakes. It's a losing arms race.
                            </p>
                            <p>
                                The insight was simple: instead of detecting what's fake, prove what's real. Cryptographic
                                signatures have existed for decades. They're how HTTPS works, how software updates are verified,
                                how financial systems stay secure. We just applied the same idea to video content.
                            </p>
                            <p>
                                When a creator publishes through AntiAI.me, they sign their content with a private key that only
                                they control. Anyone — a viewer, a journalist, a platform — can verify that signature against our
                                public registry. If the signature checks out, the content is real. If it doesn't, it isn't.
                                No machine learning required.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The gap we're filling */}
            <section className="py-16 border-t border-white/5">
                <div className="container-custom max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                                Why this matters now
                            </h2>
                            <div className="space-y-4 text-text-secondary text-[17px] leading-relaxed">
                                <p>
                                    In 2020, you could spot a deepfake if you looked hard enough. Today, you often can't.
                                    By 2026 — and we're already there — the gap between real and synthetic has effectively closed for most people.
                                </p>
                                <p>
                                    Platforms are overwhelmed. Viewers are confused. Creators are vulnerable. The internet's default
                                    assumption used to be "if it looks real, it probably is." That assumption is broken now, and nothing
                                    has replaced it.
                                </p>
                                <p>
                                    We think the answer is provenance — knowing where content came from, who made it, and being able
                                    to verify that independently. Not as a checkbox. As an actual cryptographic guarantee.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Creators protected', value: 'Growing' },
                                { label: 'Proofs issued', value: 'Real-time' },
                                { label: 'Verification method', value: 'Ed25519' },
                                { label: 'Trust model', value: 'Zero-trust' },
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-text-secondary text-sm">{stat.label}</span>
                                    <span className="text-primary font-medium text-sm">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 border-t border-white/5">
                <div className="container-custom max-w-4xl">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">What we believe</h2>
                    <p className="text-text-secondary mb-10">
                        These aren't mission statements we put on a wall. They're the actual decisions we make every week.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        {values.map((v) => (
                            <div key={v.title} className="p-6 rounded-2xl bg-surface border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                                    {v.icon}
                                </div>
                                <h3 className="font-semibold text-text-primary mb-2">{v.title}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed">{v.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team / human touch */}
            <section className="py-16 border-t border-white/5">
                <div className="container-custom max-w-3xl">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">Who's building this</h2>
                    <div className="space-y-5 text-text-secondary text-[17px] leading-relaxed">
                        <p>
                            We're a small team — the kind where everyone ships code, talks to users, and handles support tickets.
                            We didn't come from a big AI research lab. We came from building products and watching the internet change
                            around us faster than most people expected.
                        </p>
                        <p>
                            We're not here to eliminate AI — that ship has sailed, and honestly we use it too. We're here to make sure
                            that authenticity still means something. That when a creator puts their name on something, that name
                            actually carries weight.
                        </p>
                        <p>
                            If you have thoughts on what we're building — what's missing, what's broken, what you'd actually use —
                            we genuinely want to hear it. <a href="mailto:hello@antiai.me" className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors">hello@antiai.me</a>
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 border-t border-white/5">
                <div className="container-custom max-w-2xl text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                        Protect your content before you need to
                    </h2>
                    <p className="text-text-secondary mb-8">
                        It only takes one deepfake to shake years of audience trust. Start building your proof record now.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup" className="btn-primary px-8 py-3">
                            Get started free
                        </Link>
                        <Link href="/" className="btn-secondary px-8 py-3">
                            See how it works
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
