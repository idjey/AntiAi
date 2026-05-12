import React from 'react';
import CreatorsDirectoryClient from './CreatorsClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Verified Creators Directory | AntiAI',
    description: 'Explore the verified network of authentic human creators on AntiAI.me.',
    openGraph: {
        title: 'Verified Creators Directory | AntiAI',
        description: 'Explore the verified network of authentic human creators on AntiAI.me.',
        type: 'website',
    },
};

export default async function CreatorsDirectoryPage() {
    let trending = [];
    let recent = [];

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/creators`, {
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            trending = data.trending || [];
            recent = data.recent || [];
        }
    } catch (err) {
        console.error("Failed to fetch creators:", err);
    }

    return (
        <CreatorsDirectoryClient initialTrending={trending} initialRecent={recent} />
    );
}
