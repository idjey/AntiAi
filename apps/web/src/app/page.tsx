import Hero from '@/components/sections/Hero'
import Problem from '@/components/sections/Problem'
import Solution from '@/components/sections/Solution'
import ViewerExperience from '@/components/sections/ViewerExperience'
import Protocol from '@/components/sections/Protocol'
import CreatorPage from '@/components/sections/CreatorPage'
import Pricing from '@/components/sections/Pricing'
import FinalCTA from '@/components/sections/FinalCTA'
import Footer from '@/components/sections/Footer'
import Navbar from '@/components/Navbar'

export default function HomePage() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <Problem />
            <Solution />
            <Protocol />
            <ViewerExperience />
            <CreatorPage />
            <Pricing />
            <FinalCTA />
            <Footer />
        </main>
    )
}
