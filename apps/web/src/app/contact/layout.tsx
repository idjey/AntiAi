import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Contact Us | antiai.me',
    description: 'Get in touch with the antiai.me team. We are here to help creators protect their identity and combat deepfakes.',
    openGraph: {
        title: 'Contact Us | antiai.me',
        description: 'Get in touch with the antiai.me team. We are here to help creators protect their identity and combat deepfakes.',
        url: 'https://antiai.me/contact',
        siteName: 'antiai.me',
        images: [
            {
                url: 'https://antiai.me/logo.png', // Replace with your actual OG image
                width: 1200,
                height: 630,
                alt: 'antiai.me',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Contact Us | antiai.me',
        description: 'Get in touch with the antiai.me team. We are here to help creators protect their identity and combat deepfakes.',
        images: ['https://antiai.me/logo.png'], // Replace with your actual OG image
    },
}

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
