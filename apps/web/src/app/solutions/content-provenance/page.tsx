import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import HowItWorks from '@/components/sections/HowItWorks'
import PlatformShowcase from '@/components/sections/PlatformShowcase'
import FinalCTA from '@/components/sections/FinalCTA'

export const metadata: Metadata = {
    title: 'Content Provenance & Signed Media | AntiAI',
    description: 'Establish indisputable content provenance. AntiAI issues cryptographically signed media passports to track the origin and authenticity of digital assets.',
    keywords: ['content provenance', 'cryptographically signed media', 'signed media verification', 'C2PA verification', 'proof-of-origin media'],
}

export default function ContentProvenancePage() {
    return (
        <main className="min-h-screen bg-background text-text-primary">
            <Navbar />
            
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.1),transparent_50%)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
                
                <div className="container-custom relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                        <span className="text-sm font-medium text-blue-500">Origin Tracking Infrastructure</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-8 max-w-5xl mx-auto">
                        Establish undeniable <br className="hidden md:block" />
                        <span className="text-blue-500">content provenance.</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto">
                        Track the origin and authenticity of digital assets across the web. AntiAI issues cryptographically signed media passports to prove who made what.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="btn-primary-lg px-8 bg-blue-500 hover:bg-blue-600 text-white border-none">
                            Establish Provenance
                        </Link>
                    </div>
                </div>
            </section>

            <HowItWorks />
            <PlatformShowcase />
            <FinalCTA />
            
            <Footer />
        </main>
    )
}
