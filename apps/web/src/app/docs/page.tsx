import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import Link from 'next/link';
import { Shield, Key, FileText, Globe, Code, CheckCircle, Lock, Layout } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Documentation & Technical Protocol | AntiAI',
    description: 'Learn how the AntiAI cryptographic protocol protects creators from deepfakes and impersonation. Read our API documentation, verification guides, and technical overview.',
    openGraph: {
        title: 'Documentation | AntiAI Protocol',
        description: 'Understand the technical foundations of the AntiAI cryptographic verification protocol. Secure your digital identity.',
        url: 'https://antiai.me/docs',
        type: 'article',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Documentation | AntiAI Protocol',
        description: 'Learn how the AntiAI cryptographic protocol protects creators from deepfakes.',
    }
};

export default function DocsPage() {
    // Structured Data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': 'AntiAI Documentation & Technical Protocol',
        'description': 'Comprehensive documentation on the AntiAI cryptographic verification protocol for preventing deepfakes.',
        'author': {
            '@type': 'Organization',
            'name': 'AntiAI'
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'AntiAI',
            'logo': {
                '@type': 'ImageObject',
                'url': 'https://antiai.me/logo.png'
            }
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': 'https://antiai.me/docs'
        }
    };

    return (
        <main className="min-h-screen bg-background flex flex-col selection:bg-primary/30">
            {/* Inject JSON-LD Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            <Navbar />

            {/* Docs Header */}
            <div className="pt-32 pb-16 px-6 lg:px-8 border-b border-white/5 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="max-w-7xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-6">
                        <TerminalIcon className="w-3.5 h-3.5" /> ANTIAI PROTOCOL V1
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 drop-shadow-sm">
                        Documentation
                    </h1>
                    <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
                        Learn how the AntiAI cryptographic protocol secures digital identities, prevents deepfakes, and provides undeniable proof of authenticity.
                    </p>
                </div>
            </div>

            {/* Main Docs Content Layout */}
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12 px-6 lg:px-8 py-12 flex-1">
                
                {/* Sidebar Navigation (Static for now, great for SEO structure) */}
                <aside className="w-full md:w-64 shrink-0">
                    <nav className="sticky top-24 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Getting Started</h3>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#introduction" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Introduction</a></li>
                                <li><a href="#how-it-works" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/10" /> How it Works</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Core Components</h3>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#cryptography" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/10" /> Cryptographic Proofs</a></li>
                                <li><a href="#extension" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/10" /> Browser Extension</a></li>
                                <li><a href="#creator-hub" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/10" /> Verified Profiles</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Developers</h3>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#api" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/10" /> Public API</a></li>
                            </ul>
                        </div>
                    </nav>
                </aside>

                {/* Content Area */}
                <div className="flex-1 max-w-3xl prose-invert prose-p:text-text-secondary prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tight space-y-16">
                    
                    {/* Section 1 */}
                    <section id="introduction" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold">Introduction</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed mb-4">
                            In the era of generative AI and deepfakes, establishing the authenticity of digital media is more critical than ever. We are using <strong>The AntiAI Verification Protocol (AAVP)</strong>.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            AAVP is a decentralized security framework built to distinguish authentic, creator-verified content from deepfakes and AI-generated fabrications. Instead of relying on imperfect AI detection models, we use immutable cryptographic signatures to prove that a piece of media was explicitly authorized by the claimed creator.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section id="how-it-works" className="scroll-mt-24 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Key className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold">How Verification Works</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6 mb-8">
                            <div className="bg-surface p-6 rounded-2xl border border-white/5">
                                <div className="text-xl font-bold mb-2">1. Cryptographic Signatures</div>
                                <p className="text-sm text-text-secondary">Creators sign their content using secure Ed25519 keys. The protocol establishes a unique mathematical identity that cannot be spoofed by AI or bad actors.</p>
                            </div>
                            <div className="bg-surface p-6 rounded-2xl border border-white/5">
                                <div className="text-xl font-bold mb-2">2. Tamper-Proof Ledger</div>
                                <p className="text-sm text-text-secondary">When a video is verified, AntiAI takes a unique fingerprint (a hash) of that specific content and records it immutably. Once logged, the record cannot be altered.</p>
                            </div>
                            <div className="bg-surface p-6 rounded-2xl border border-white/5 sm:col-span-2">
                                <div className="text-xl font-bold mb-2">3. Real-Time Verification</div>
                                <p className="text-sm text-text-secondary">The browser extension reads video data in real-time and asks the AAVP: "Does this hash match the creator's signature?" If yes, you see the green Authenticated badge.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section id="cryptography" className="scroll-mt-24 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold">Cryptographic Proofs</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed mb-6">
                            Every verified piece of content is backed by a JSON Web Signature (JWS) using the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">EdDSA</code> (Ed25519) algorithm. This ensures that the proof cannot be tampered with or forged.
                        </p>
                        <div className="bg-[#0d1117] border border-white/10 rounded-xl p-5 overflow-x-auto">
                            <pre className="text-sm font-mono text-slate-300">
                                <code>{`{
  "alg": "EdDSA",
  "typ": "JWT",
  "kid": "antiai-key-ed25519"
}
.
{
  "sub": "youtube_channel_id",
  "platform": "youtube",
  "platform_id": "dQw4w9WgXcQ",
  "iat": 1715846400,
  "exp": 1747382400,
  "iss": "https://antiai.me"
}
.
[Cryptographic Signature]`}</code>
                            </pre>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section id="api" className="scroll-mt-24 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                                <Code className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold">Public API Reference</h2>
                        </div>
                        <p className="text-text-secondary leading-relaxed mb-6">
                            Developers and third-party platforms can integrate with AntiAI to independently verify content. Our public API requires no authentication for verification checks.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="border border-white/10 rounded-xl overflow-hidden bg-surface">
                                <div className="bg-surface-light border-b border-white/5 px-4 py-3 flex items-center gap-3">
                                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold font-mono">GET</span>
                                    <code className="text-sm font-mono text-white">/public/verify?platform=youtube&platform_id=ID</code>
                                </div>
                                <div className="p-4 text-sm text-text-secondary">
                                    Checks if a specific piece of media is cryptographically verified. Returns the verification status, creator details, and the full cryptographic proof token.
                                </div>
                            </div>

                            <div className="border border-white/10 rounded-xl overflow-hidden bg-surface">
                                <div className="bg-surface-light border-b border-white/5 px-4 py-3 flex items-center gap-3">
                                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold font-mono">GET</span>
                                    <code className="text-sm font-mono text-white">/public/keys</code>
                                </div>
                                <div className="p-4 text-sm text-text-secondary">
                                    Retrieves the active public Ed25519 keys (in JWKS format) required to independently validate the cryptographic signatures generated by the AntiAI protocol.
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
            
            <Footer />
        </main>
    );
}

function TerminalIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
    )
}
