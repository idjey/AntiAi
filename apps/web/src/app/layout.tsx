import './globals.css'
import type { Metadata } from 'next'
import CookieConsent from '@/components/CookieConsent'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

// All pages are dynamic (server-rendered on request, not statically generated at build time).
// This is required because UI libraries used in the root layout (ThemeProvider, Toaster)
// use React context that is incompatible with Next.js SSG worker isolation.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    metadataBase: new URL('https://antiai.me'),
    title: {
        default: 'AntiAI Media Verification | Cryptographic Provenance Layer',
        template: '%s | AntiAI Media Verification'
    },
    description: 'Provide cryptographic proof of your content authenticity. AntiAI Proof protects your audience from deepfakes and AI-generated fabrications using verifiable signatures and content provenance, not reactive detection.',
    keywords: ['AI media verification', 'deepfake detection verification', 'cryptographically signed media', 'content provenance', 'verify AI-generated content', 'authentic media proof', 'tamper-proof media verification', 'signed media verification', 'C2PA verification', 'AI authenticity layer', 'proof-of-origin media'],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'AntiAI Media Verification | Cryptographic Authenticity',
        description: 'Provide cryptographic proof of your content authenticity. Protect your audience from deepfakes with the AntiAI Trust Layer.',
        url: 'https://antiai.me',
        siteName: 'AntiAI Authenticity Protocol',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'AntiAI Media Verification - Cryptographic Proof for Creators',
            }
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AntiAI Signed Media | Cryptographic Proof for Creators',
        description: 'Provide cryptographic proof of your content authenticity. Protect your audience from deepfakes with the AntiAI Trust Layer.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "AntiAI Media Verification",
                            "operatingSystem": "Web",
                            "applicationCategory": "SecurityApplication",
                            "description": "Cryptographic media verification and provenance platform using Ed25519 digital signatures to protect against deepfakes.",
                            "url": "https://antiai.me",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            },
                            "author": {
                                "@type": "Organization",
                                "name": "AntiAI Authenticity Protocol",
                                "url": "https://antiai.me"
                            }
                        })
                    }}
                />
            </head>
            <body className="bg-background text-text-primary antialiased" suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    storageKey="antiai-theme"
                    disableTransitionOnChange
                >
                    {children}
                    <CookieConsent />
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}
