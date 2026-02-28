import { PublicProfile } from '@/components/public/PublicProfile';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
    params: {
        domain: string;
    };
}

// Note: This fetches by customDomain instead of handle
async function getCreatorByDomain(domain: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/creators/domain/${domain}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const domain = params.domain;
    const creator = await getCreatorByDomain(domain);

    if (!creator) {
        return {
            title: 'Profile Not Found | AntiAI',
            description: 'The requested profile could not be found.',
        };
    }

    const displayName = creator.name || `@${creator.handle}`;
    const description = `Check out authenticated links, verified videos, and secure content from ${displayName}. This profile is cryptographically signed and verified by AntiAI.`;

    // Re-use the existing opengraph logic mapped to their underlying handle
    const ogImageUrl = `https://antiai.me/${creator.handle}/opengraph-image`;

    return {
        title: `${displayName} | Verified on AntiAI`,
        description: description,
        openGraph: {
            title: `${displayName} | Verified on AntiAI`,
            description: description,
            url: `https://${domain}`,
            siteName: displayName,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${displayName}'s Verified Profile on AntiAI`,
                },
            ],
            type: 'profile',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${displayName} | Verified on AntiAI`,
            description: description,
            images: [ogImageUrl],
        },
    };
}

export default async function CustomDomainProfilePage({ params }: Props) {
    const creator = await getCreatorByDomain(params.domain);

    if (!creator) {
        notFound();
    }

    // Reuse the exact same component as the standard /handle page
    return <PublicProfile creator={creator} />;
}
