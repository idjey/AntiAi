import { PublicProfile } from '@/components/public/PublicProfile';

export const dynamic = 'force-dynamic';

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

export default async function PublicProfilePage({ params }: Props) {
    const creator = await getCreator(params.handle);

    if (!creator) {
        notFound();
    }

    return <PublicProfile creator={creator} />;
}
