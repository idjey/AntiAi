import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        {
            url: 'https://antiai.me',
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 1,
        },
        {
            url: 'https://antiai.me/pricing',
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: 'https://antiai.me/creators',
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
    ]

    let dynamicRoutes: MetadataRoute.Sitemap = []

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/sitemap`, {
            next: { revalidate: 3600 } // revalidate every hour
        })
        
        if (res.ok) {
            const data = await res.json()
            
            if (data.creators) {
                dynamicRoutes.push(...data.creators.map((c: any) => ({
                    url: c.url,
                    lastModified: new Date(c.lastModified),
                    changeFrequency: 'daily' as const,
                    priority: 0.8
                })))
            }

            if (data.videos) {
                dynamicRoutes.push(...data.videos.map((v: any) => ({
                    url: v.url,
                    lastModified: new Date(v.lastModified),
                    changeFrequency: 'weekly' as const,
                    priority: 0.7
                })))
            }
        }
    } catch (e) {
        console.error("Failed to fetch dynamic sitemap data", e)
    }

    return [...staticRoutes, ...dynamicRoutes]
}
