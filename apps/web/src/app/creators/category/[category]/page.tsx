import React from 'react';
import CreatorsDirectoryClient from '../../CreatorsClient';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
    params: {
        category: string;
    };
}

const ALL_CATEGORIES = ['All', 'Technology', 'Design', 'Lifestyle', 'Gaming', 'Education', 'Comedy', 'Business', 'Art', 'Music', 'Fitness', 'Finance', 'Food', 'Travel', 'Science', 'Sports'];

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const category = params.category;
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

    return {
        title: `Verified ${formattedCategory} Creators | AntiAI`,
        description: `Explore the verified network of authentic ${formattedCategory} creators on AntiAI.me.`,
        openGraph: {
            title: `Verified ${formattedCategory} Creators | AntiAI`,
            description: `Explore the verified network of authentic ${formattedCategory} creators on AntiAI.me.`,
            type: 'website',
            url: `https://antiai.me/creators/category/${category}`,
        },
    };
}

export default async function CategoryDirectoryPage({ params }: Props) {
    const category = params.category;
    
    // Check if category is valid (case-insensitive)
    const validCategory = ALL_CATEGORIES.find(c => c.toLowerCase() === category.toLowerCase());
    
    if (!validCategory && category.toLowerCase() !== 'all') {
        notFound();
    }

    let trending = [];
    let recent = [];

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/creators?category=${validCategory || category}`, {
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            trending = data.trending || [];
            recent = data.recent || [];
        }
    } catch (err) {
        console.error(`Failed to fetch ${category} creators:`, err);
    }

    return (
        <CreatorsDirectoryClient initialTrending={trending} initialRecent={recent} />
    );
}
