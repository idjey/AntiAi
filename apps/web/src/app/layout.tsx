import './globals.css'
import type { Metadata } from 'next'
import CookieConsent from '@/components/CookieConsent'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
    metadataBase: new URL('https://antiai.me'),
    title: {
        default: 'AntiAI.me | The Cryptographic Proof for Real Creators',
        template: '%s | AntiAI.me'
    },
    description: 'Provide cryptographic proof of your content authenticity. AntiAI.me protects your audience from deepfakes and AI-generated fabrications using verifiable signatures, not reactive detection.',
    keywords: ['AI content verification', 'cryptographic proof for creators', 'prove content authenticity', 'deepfake protection platform', 'content provenance for video', 'verifiable creator identity'],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'AntiAI.me | Cryptographic Authenticity for Creators',
        description: 'Provide cryptographic proof of your content authenticity. Protect your audience from deepfakes with a verifiable creator identity.',
        url: 'https://antiai.me',
        siteName: 'AntiAI.me',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'AntiAI.me - The Cryptographic Proof for Real Creators',
            }
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AntiAI.me | The Cryptographic Proof for Creators',
        description: 'Provide cryptographic proof of your content authenticity. Protect your audience from deepfakes.',
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
            </head>
            <body className="bg-background text-text-primary antialiased">
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
