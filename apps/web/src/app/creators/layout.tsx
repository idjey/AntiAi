import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Creator Directory | antiai.me',
    description: 'Discover the verified network of authentic humans on antiai.me. Explore creators, gamers, designers, and more—all verified to be 100% human.',
    openGraph: {
        title: 'Creator Directory | antiai.me - The Hall of Authenticity',
        description: 'Discover the verified network of authentic humans on antiai.me. No bots, no deepfakes.',
        url: 'https://antiai.me/creators',
        siteName: 'antiai.me',
        images: [
            {
                url: 'https://antiai.me/logo.png', // Fallback or dynamic OG image
                width: 1200,
                height: 630,
                alt: 'antiai.me Creator Directory',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Creator Directory | antiai.me',
        description: 'Discover the verified network of authentic humans. No bots, no deepfakes.',
        images: ['https://antiai.me/logo.png'],
    },
}

export default function CreatorsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
