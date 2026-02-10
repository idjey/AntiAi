'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault()
        const element = document.getElementById(id)
        if (element) {
            const offsetTop = element.offsetTop - 80 // Adjust for fixed header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            })
            // Update URL hash without jumping
            window.history.pushState(null, '', `#${id}`)
        }
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-background/80 backdrop-blur-xl border-b border-white/5'
                : 'bg-transparent'
                }`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-text-primary">
                            antiai<span className="text-primary">.me</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="link text-sm font-medium cursor-pointer">
                            How it works
                        </a>
                        <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="link text-sm font-medium cursor-pointer">
                            Pricing
                        </a>
                        <a href="#creators" onClick={(e) => scrollToSection(e, 'creators')} className="link text-sm font-medium cursor-pointer">
                            Creator Directory
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Log in
                        </Link>
                        <Link href="/signup" className="btn-primary text-sm px-4 py-2">
                            Get started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
