'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check local storage
        const consent = localStorage.getItem('cookie_consent')
        if (!consent) {
            // Small delay for smooth entrance
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted')
        setIsVisible(false)
    }

    const handleReject = () => {
        localStorage.setItem('cookie_consent', 'essential_only')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-float-up">
            <div className="container-custom max-w-5xl">
                <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl md:flex items-center justify-between gap-8">
                    <div className="mb-6 md:mb-0">
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Cookies on antiai.me</h3>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
                            We use essential cookies to keep the site secure and functional, and optional cookies to improve performance and analytics.
                            You can choose your preferences.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                        <button
                            onClick={handleReject}
                            className="btn-secondary text-sm py-2.5 px-5"
                        >
                            Reject optional
                        </button>
                        <button
                            onClick={handleAccept}
                            className="btn-primary text-sm py-2.5 px-5"
                        >
                            Accept all
                        </button>
                    </div>
                </div>
                <div className="text-center mt-2 md:hidden">
                    <Link href="/cookies" className="text-xs text-text-muted hover:text-text-primary underline">
                        Cookie Policy
                    </Link>
                </div>
            </div>
        </div>
    )
}
