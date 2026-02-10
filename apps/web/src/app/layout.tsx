import './globals.css'
import type { Metadata } from 'next'
import CookieConsent from '@/components/CookieConsent'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
    title: 'AntiAI.me - The Authenticity Badge for Real Creators',
    description: 'Verify your videos with cryptographic proof. Protect your audience from deepfakes and impersonators. Get the authenticity badge that proves you are real.',
    keywords: ['video verification', 'deepfake protection', 'creator authenticity', 'YouTube verification', 'digital trust'],
    openGraph: {
        title: 'AntiAI.me - The Authenticity Badge for Real Creators',
        description: 'Verify your videos with cryptographic proof. Protect your audience from deepfakes and impersonators.',
        url: 'https://antiai.me',
        siteName: 'AntiAI.me',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AntiAI.me - The Authenticity Badge for Real Creators',
        description: 'Verify your videos with cryptographic proof. Protect your audience from deepfakes.',
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-background text-text-primary antialiased">
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                    {children}
                    <CookieConsent />
                </ThemeProvider>
            </body>
        </html>
    )
}
