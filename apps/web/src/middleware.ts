import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}

export function middleware(req: NextRequest) {
    const url = req.nextUrl

    // Get hostname of request (e.g. proof.johndoe.com, antiai.me, localhost:3000)
    let hostname = req.headers.get('host') || 'antiai.me'

    // Remove port if present (for local development)
    hostname = hostname.replace(/:\d+$/, '')

    // Special case for Vercel preview domains if applicable
    if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
        hostname = 'antiai.me' // Treat previews as main domain
    }

    const searchParams = req.nextUrl.searchParams.toString()
    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

    // If it's a known non-custom domain, just proceed normally
    if (
        hostname === 'localhost' ||
        hostname === 'antiai.me' ||
        hostname === 'www.antiai.me'
    ) {
        return NextResponse.next()
    }

    // It is a custom domain (e.g., proof.johndoe.com)
    // Rewrite everything to the `/[domain]/[...path]` dynamic route
    return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url))
}
