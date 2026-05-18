import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/sections/Footer';
import Pricing from '@/components/sections/Pricing';

export const metadata: Metadata = {
    title: 'Pricing — AntiAI.me | Cryptographic Video Verification',
    description: 'Prove your videos are real. AntiAI.me offers cryptographic verification badges for YouTube and TikTok creators. Free to start. Pro from $24.99/month.',
    openGraph: {
        title: 'Pricing — AntiAI.me | Prove Your Videos Are Real',
        description: 'Tamper-proof Ed25519 badges for every video you publish. Start free. Pro from $24.99/month.',
        url: 'https://antiai.me/pricing',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pricing — AntiAI.me | Prove Your Videos Are Real',
        description: 'Tamper-proof Ed25519 badges for every video you publish. Start free. Pro from $24.99/month.',
    },
};

export default function PricingPage() {
    // Structured data: SoftwareApplication
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'AntiAI.me',
        'applicationCategory': 'SecurityApplication',
        'offers': [
            {
                '@type': 'Offer',
                'name': 'Pro',
                'price': '24.99',
                'priceCurrency': 'USD',
                'billingIncrement': 'P1M',
            },
            {
                '@type': 'Offer',
                'name': 'Business',
                'price': '49.99',
                'priceCurrency': 'USD',
                'billingIncrement': 'P1M',
            },
            {
                '@type': 'Offer',
                'name': 'Elite',
                'price': '99.99',
                'priceCurrency': 'USD',
                'billingIncrement': 'P1M',
            },
        ],
    };

    return (
        <main className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />
            <div className="pt-20">
                <Pricing />
            </div>
            <Footer />
        </main>
    );
}
