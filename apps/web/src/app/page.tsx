import Hero from '@/components/sections/Hero'
import ProblemStatement from '@/components/sections/ProblemStatement'
import Comparison from '@/components/sections/Comparison'
import HowItWorks from '@/components/sections/HowItWorks'
import PlatformShowcase from '@/components/sections/PlatformShowcase'
import Protocol from '@/components/sections/Protocol'
import CreatorPage from '@/components/sections/CreatorPage'
import Roadmap from '@/components/sections/Roadmap'
import Pricing from '@/components/sections/Pricing'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/sections/Footer'
import Navbar from '@/components/Navbar'

export default function HomePage() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <ProblemStatement />
            <Comparison />
            <HowItWorks />
            <PlatformShowcase />
            <Protocol />
            <Roadmap />
            <CreatorPage />
            <Pricing />
            <FinalCTA />
            <Footer />
        </main>
    )
}
