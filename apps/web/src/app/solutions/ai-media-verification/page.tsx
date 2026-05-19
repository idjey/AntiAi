import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import HowItWorks from '@/components/sections/HowItWorks'
import FinalCTA from '@/components/sections/FinalCTA'
import Protocol from '@/components/sections/Protocol'

export const metadata: Metadata = {
    title: 'AI Media Verification | AntiAI Trust Layer',
    description: 'Verify AI-generated content and establish trust. AntiAI provides cryptographically signed media verification to distinguish human creators from AI.',
    keywords: ['AI media verification', 'verify AI-generated content', 'AI authenticity layer', 'AI content detection', 'signed digital media'],
}

export default function AIMediaVerificationPage() {
    return (
        <main className="min-h-screen bg-background text-text-primary">
            <Navbar />
            
            {/* SEO Targeted Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" aria-hidden="true" />
                <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" aria-hidden="true" />
                
                <div className="container-custom relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
                        <span className="text-sm font-medium text-primary">Enterprise-Grade Solution</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-8 max-w-5xl mx-auto">
                        The ultimate standard for <br className="hidden md:block" />
                        <span className="text-gradient">AI media verification.</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto">
                        Stop guessing if content is real or AI-generated. AntiAI provides verifiable cryptographic proof, establishing a definitive authenticity layer for all digital media.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="btn-primary-lg px-8">
                            Start verifying media
                        </Link>
                    </div>
                </div>
            </section>

            {/* Reusable existing components to build out the page content and trust */}
            <Protocol />
            <HowItWorks />
            <FinalCTA />
            
            <Footer />
        </main>
    )
}
