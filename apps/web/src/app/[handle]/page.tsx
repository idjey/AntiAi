import { PublicProfile } from '@/components/public/PublicProfile';

export const dynamic = 'force-dynamic';

import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
    params: {
        handle: string;
    };
}

async function getCreator(handle: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/creators/${handle}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

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
    const rawParam = params.handle;
    const isCustomDomain = rawParam.startsWith('_domain_');
    const identifier = isCustomDomain ? rawParam.replace('_domain_', '') : rawParam;

    const creator = isCustomDomain
        ? await getCreatorByDomain(identifier)
        : await getCreator(identifier);

    if (!creator) {
        return {
            title: 'Profile Not Found | AntiAI',
            description: 'The requested profile could not be found.',
        };
    }

    const displayName = creator.name || `@${creator.handle}`;
    const description = `Check out authenticated links, verified videos, and secure content from ${displayName}. This profile is cryptographically signed and verified by AntiAI.`;

    const ogImageUrl = isCustomDomain
        ? `https://antiai.me/${creator.handle}/opengraph-image`
        : `/${identifier}/opengraph-image`;

    const publicUrl = isCustomDomain
        ? `https://${identifier}`
        : `https://antiai.me/${identifier}`;

    return {
        title: `${displayName} | Verified on AntiAI`,
        description: description,
        openGraph: {
            title: `${displayName} | Verified on AntiAI`,
            description: description,
            url: publicUrl,
            siteName: isCustomDomain ? displayName : 'AntiAI',
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

export default async function PublicProfilePage({ params }: Props) {
    const rawParam = params.handle;
    const isCustomDomain = rawParam.startsWith('_domain_');
    const identifier = isCustomDomain ? rawParam.replace('_domain_', '') : rawParam;

    const creator = isCustomDomain
        ? await getCreatorByDomain(identifier)
        : await getCreator(identifier);

    if (!creator) {
        notFound();
    }

    return <PublicProfile creator={creator} />;
}
