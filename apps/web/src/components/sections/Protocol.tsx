import { ShieldCheck, Fingerprint, Network } from 'lucide-react'

export default function Protocol() {
    const features = [
        {
            icon: <Fingerprint className="w-8 h-8" />,
            title: "Cryptographic Signatures",
            description: "Creators sign their content using secure Ed25519 keys. The protocol establishes a unique mathematical identity that cannot be spoofed by AI or bad actors."
        },
        {
            icon: <Network className="w-8 h-8" />,
            title: "Tamper-Proof Ledger",
            description: "When a video is verified, AntiAI takes a unique fingerprint (a hash) of that specific content and records it immutably. Once logged, the record cannot be altered."
        },
        {
            icon: <ShieldCheck className="w-8 h-8" />,
            title: "Real-Time Verification",
            description: "The browser extension reads video data in real-time and asks the AAVP: 'Does this hash match the creator's signature?' If yes, you see the green Authenticated badge."
        }
    ]

    return (
        <section id="protocol" className="section relative overflow-hidden bg-[#0A0A0A]">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

            <div className="container-custom relative z-10">
                <header className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6" role="status">
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>Secured by AAVP</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                        The AntiAI Verification Protocol
                    </h2>

                    <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
                        A decentralized security framework built to distinguish authentic, creator-verified content from deepfakes and AI-generated fabrications.
                    </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <article key={idx} className="relative group">
                            {/* Card Background gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />

                            <div className="relative h-full bg-[#111] backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-colors duration-300">
                                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300" aria-hidden="true">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Tech Stack Banner */}
                <aside className="mt-16 pt-16 border-t border-white/5 text-center" aria-labelledby="tech-stack-title">
                    <p id="tech-stack-title" className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-8">
                        Powered by modern cryptographic standards
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {/* Interactive tech stack items with "ray of hope" green glow on hover */}
                        <div className="group flex items-center gap-2 font-mono text-xl font-bold text-slate-500 transition-all duration-500 hover:text-primary hover:scale-110 hover:[filter:drop-shadow(0_0_20px_currentColor)] cursor-default">
                            <ShieldCheck aria-hidden="true" className="w-7 h-7 transition-all duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-110" />
                            <span className="tracking-wide">Ed25519</span>
                        </div>
                        <div className="group flex items-center gap-2 font-mono text-xl font-bold text-slate-500 transition-all duration-500 hover:text-primary hover:scale-110 hover:[filter:drop-shadow(0_0_20px_currentColor)] cursor-default">
                            <Fingerprint aria-hidden="true" className="w-7 h-7 transition-all duration-500 ease-out group-hover:scale-125" />
                            <span className="tracking-wide">SHA-256</span>
                        </div>
                        <div className="group flex items-center gap-2 font-mono text-xl font-bold text-slate-500 transition-all duration-500 hover:text-primary hover:scale-110 hover:[filter:drop-shadow(0_0_20px_currentColor)] cursor-default">
                            <Network aria-hidden="true" className="w-7 h-7 transition-all duration-500 ease-out group-hover:rotate-[15deg] group-hover:scale-110" />
                            <span className="tracking-wide">Merkle Trees</span>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    )
}
