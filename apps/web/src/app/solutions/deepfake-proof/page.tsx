import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import ProblemStatement from '@/components/sections/ProblemStatement'
import Protocol from '@/components/sections/Protocol'
import FinalCTA from '@/components/sections/FinalCTA'

export const metadata: Metadata = {
    title: 'Deepfake Proof & Detection Alternative | AntiAI',
    description: 'Stop relying on flawed deepfake detection. Secure your digital identity with tamper-proof cryptographic signatures and true content provenance.',
    keywords: ['deepfake detection verification', 'deepfake proof', 'tamper-proof media verification', 'cryptographically signed media', 'protect from deepfakes'],
}

export default function DeepfakeProofPage() {
    return (
        <main className="min-h-screen bg-background text-text-primary">
            <Navbar />
            
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-500/5 blur-[150px] pointer-events-none" />
                
                <div className="container-custom relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-8">
                        <span className="text-sm font-medium text-red-500">The Post-Truth Era Solution</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-8 max-w-5xl mx-auto">
                        Deepfake detection is failing. <br className="hidden md:block" />
                        <span className="text-red-500">Cryptographic proof works.</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-12 max-w-3xl mx-auto">
                        AI models are outpacing deepfake detection algorithms. The only way to prove media authenticity is through mathematical certainty and tamper-proof verification.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="btn-primary-lg px-8 bg-red-500 hover:bg-red-600 text-white border-none">
                            Secure your identity
                        </Link>
                    </div>
                </div>
            </section>

            <ProblemStatement />
            <Protocol />
            <FinalCTA />
            
            <Footer />
        </main>
    )
}
