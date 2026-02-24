import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://antiai.me',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://antiai.me/pricing',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://antiai.me/creators',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        // We do not map dynamic /creator/[id] routes here yet
        // as they should be built dynamically from DB query
    ]
}
