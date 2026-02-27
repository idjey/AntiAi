'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/sections/Footer'
import { Download, Info, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

type BrowserType = 'chrome' | 'firefox' | 'edge' | 'brave' | 'safari' | 'other'

// Extracted SVG components to keep the main component clean
const ChromeLogo = () => (
    <svg viewBox="0 0 256 256" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <path d="M256 128C256 198.693 198.693 256 128 256C57.307 256 0 198.693 0 128C0 57.307 57.307 0 128 0C198.693 0 256 57.307 256 128Z" fill="#F1F3F4" />
        <path d="M128 51.2C85.5891 51.2 51.2 85.5891 51.2 128C51.2 170.411 85.5891 204.8 128 204.8C170.411 204.8 204.8 170.411 204.8 128C204.8 85.5891 170.411 51.2 128 51.2ZM128 179.2C99.7335 179.2 76.8 156.266 76.8 128C76.8 99.7335 99.7335 76.8 128 76.8C156.266 76.8 179.2 99.7335 179.2 128C179.2 156.266 156.266 179.2 128 179.2Z" fill="#1A73E8" />
        <path d="M204.8 128H256C256 57.307 198.693 0 128 0V51.2C170.411 51.2 204.8 85.5891 204.8 128Z" fill="#EA4335" />
        <path d="M51.2 128L0 128C0 198.693 57.307 256 128 256L164.6 192.6C163.6 193 162.7 193.3 161.7 193.7L128 256H128.1C164.128 255.88 196.34 238.291 216.924 209.789L161.859 114.398C154.673 151.728 124.646 179.2 89.6 179.2C84.9754 179.2 80.5097 178.508 76.2415 177.202L64.1219 198.243C82.5937 210.371 104.577 217.6 128 217.6C160.033 217.6 189.28 204.603 210.875 183.167L154.664 85.8033C146.522 81.3905 137.5 78.9 128 78.9V51.2C151.042 51.2 171.933 60.3396 187.525 75.1L243.6 51.2H128V0C57.307 0 0 57.307 0 128H51.2Z" fill="#FBBC04" />
        <path d="M128 256V204.8C85.5891 204.8 51.2 170.411 51.2 128H0C0 198.693 57.307 256 128 256Z" fill="#34A853" />
        <circle cx="128" cy="128" r="38.4" fill="#34A853" />
    </svg>
)

const FirefoxLogo = () => (
    <svg viewBox="0 0 256 256" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <path d="M128 256C198.693 256 256 198.693 256 128C256 57.307 198.693 0 128 0C57.307 0 0 57.307 0 128C0 198.693 57.307 256 128 256Z" fill="#20123A" />
        <path d="M228.6 172.9C217.3 221.7 176.6 256 128 256V204.8C156.4 204.8 179.8 181.7 182.4 153H228.6C228.6 159.9 228.6 166.4 228.6 172.9Z" fill="#0090ED" />
        <path d="M182.4 153C179.7 181.7 156.3 204.8 128 204.8V256C69.4 256 20.8 214.6 2.4 159.2L42 144.3C49 179.9 79.5 206.8 116.2 206.8V155.6C90.2 155.6 68.6 136.3 65.4 111L20.2 122.9C27.5 174.6 72.8 214.3 128 214.3V163.1C107.5 163.1 90.7 147.2 89 127.3L44 135.2C50.6 168.8 79.4 194.2 114.7 194.2V143C104.1 143 95 135.9 92.5 125.7L57.5 123C63.2 150.3 87.8 170.8 116.7 170.8V119.6C128 119.6 132.8 122 135.5 125L200.7 114C193.3 86.8 168.5 67 139.7 67V15.8C188.7 15.8 230 52.4 240.2 99.4L182.4 153Z" fill="#E66000" />
        <path d="M240.2 99.4C230 52.4 188.7 15.8 139.7 15.8V67C168.5 67 193.3 86.8 200.7 114L240.2 99.4Z" fill="#FF9500" />
        <path d="M139.7 15.8C91.4 15.8 50.8 51.5 39.8 97.5L88.8 80.2C93.4 57.5 113.8 40.5 138.2 40.5V15.8C138.7 15.8 139.2 15.8 139.7 15.8Z" fill="#FFCB00" />
        <path d="M116.2 206.8V155.6C90.2 155.6 68.6 136.3 65.4 111L20.2 122.9C27.5 174.6 72.8 214.3 128 214.3V256C69.4 256 20.8 214.6 2.4 159.2L42 144.3C49 179.9 79.5 206.8 116.2 206.8Z" fill="#D70022" />
        <path d="M65.4 111C68.6 136.3 90.2 155.6 116.2 155.6V206.8C79.5 206.8 49 179.9 42 144.3L65.4 111Z" fill="#C1004C" />
    </svg>
)

const EdgeLogo = () => (
    <svg viewBox="0 0 256 256" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
        <path d="M0 128C0 57.307 57.307 0 128 0C198.693 0 256 57.307 256 128C256 198.693 198.693 256 128 256C57.307 256 0 198.693 0 128Z" fill="#1B1464" />
        <path d="M211.2 128C211.2 142.946 206.402 156.782 198.243 168.32H168.32C176.479 156.782 181.277 142.946 181.277 128C181.277 113.054 176.479 99.2183 168.32 87.6801H198.243C206.402 99.2183 211.2 113.054 211.2 128Z" fill="#00E6FF" />
        <path d="M168.32 168.32C156.782 176.479 142.946 181.277 128 181.277H87.6801C99.2183 173.118 113.054 168.32 128 168.32C142.946 168.32 156.782 173.118 168.32 181.277V168.32Z" fill="#0072C6" />
        <path d="M87.6801 168.32C99.2183 176.479 113.054 181.277 128 181.277C113.054 181.277 99.2183 176.479 87.6801 168.32V168.32Z" fill="#0035A0" />
        <path d="M128 168.32C113.054 168.32 99.2183 173.118 87.6801 181.277C99.2183 189.436 113.054 194.234 128 194.234C142.946 194.234 156.782 189.436 168.32 181.277C156.782 173.118 142.946 168.32 128 168.32Z" fill="#024D99" />
        <path d="M128 194.234C113.054 194.234 99.2183 189.436 87.6801 181.277H57.7571C65.916 198.412 79.521 213.385 96.398 223.774L128 194.234H128Z" fill="#D3D3D3" />
        <path d="M87.6801 87.6801C76.1419 99.2183 71.3439 113.054 71.3439 128C71.3439 142.946 76.1419 156.782 87.6801 168.32C90.3592 165.641 93.3082 163.264 96.398 161.27V94.7303C93.3082 92.7364 90.3592 90.3592 87.6801 87.6801Z" fill="#FFF" />
        <path d="M168.32 87.6801C156.782 76.1419 142.946 71.3439 128 71.3439H87.6801C99.2183 79.5029 113.054 84.3009 128 84.3009C142.946 84.3009 156.782 79.5029 168.32 71.3439V87.6801Z" fill="#FFF" />
        <path d="M128 84.3009C113.054 84.3009 99.2183 79.5029 87.6801 71.3439C99.2183 63.1849 113.054 58.3869 128 58.3869C142.946 58.3869 156.782 63.1849 168.32 71.3439C156.782 79.5029 142.946 84.3009 128 84.3009Z" fill="#FFF" />
        <path d="M128 58.3869C113.054 58.3869 99.2183 63.1849 87.6801 71.3439H57.7571C65.916 54.2089 79.521 39.2359 96.398 28.8469L128 58.3869H128Z" fill="#FFF" />
    </svg>
)


export default function ExtensionDownloadPage() {
    const [browser, setBrowser] = useState<BrowserType>('other')
    const [mounted, setMounted] = useState(false)

    // Store Links
    const LINKS = {
        chrome: "https://chrome.google.com/webstore/detail/antiai", // Update with actual CWS ID when deployed
        firefox: "https://addons.mozilla.org/en-US/firefox/addon/antiai-me/",
        edge: "https://microsoftedge.microsoft.com/addons/detail/antiai", // Update with actual Edge ID
        brave: "https://chrome.google.com/webstore/detail/antiai", // Brave uses Chrome store
    }

    useEffect(() => {
        setMounted(true)
        const ua = window.navigator.userAgent.toLowerCase()

        if (ua.includes('firefox')) {
            setBrowser('firefox')
        } else if (ua.includes('edg/')) {
            setBrowser('edge')
        } else if (ua.includes('brave')) {
            // Brave doesn't reliably expose itself in UA anymore, but just in case
            setBrowser('brave')
        } else if (ua.includes('chrome') && !ua.includes('edg/')) {
            // Check for navigator.brave asynchronously (optional, but Chrome is safe fallback)
            // @ts-ignore
            if (navigator.brave && navigator.brave.isBrave) {
                setBrowser('brave')
            } else {
                setBrowser('chrome')
            }
        } else if (ua.includes('safari') && !ua.includes('chrome')) {
            setBrowser('safari')
        } else {
            setBrowser('other')
        }
    }, [])

    // Prevent hydration mismatch
    if (!mounted) return null

    const renderPrimaryCTA = () => {
        if (browser === 'safari') {
            return (
                <div className="flex flex-col items-center bg-surface-light border border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Safari is not supported yet</h2>
                    <p className="text-slate-400 mb-6">
                        The AntiAI extension is currently available for Chromium-based browsers and Firefox. Safari support is coming soon!
                    </p>
                    <Link href="/" className="btn-secondary">Return to Homepage</Link>
                </div>
            )
        }

        const browserMap: Record<Exclude<BrowserType, 'safari' | 'other'>, { name: string, icon: JSX.Element, bg: string }> = {
            chrome: { name: 'Google Chrome', icon: <ChromeLogo />, bg: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
            firefox: { name: 'Mozilla Firefox', icon: <FirefoxLogo />, bg: 'hover:border-orange-500/50 hover:bg-orange-500/5' },
            edge: { name: 'Microsoft Edge', icon: <EdgeLogo />, bg: 'hover:border-cyan-500/50 hover:bg-cyan-500/5' },
            brave: { name: 'Brave Browser', icon: <ChromeLogo />, bg: 'hover:border-orange-500/50 hover:bg-orange-500/5' }, // Uses Chrome logo/store
        }

        const currentConf = browser !== 'other' ? browserMap[browser] : browserMap['chrome']
        const currentLink = browser !== 'other' ? LINKS[browser] : LINKS['chrome']

        return (
            <div className={`group flex flex-col items-center bg-[#111] backdrop-blur-sm border border-white/5 rounded-3xl p-10 max-w-xl mx-auto text-center ${currentConf.bg} transition-all duration-500 shadow-xl relative overflow-hidden`}>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                    <div className="mb-8 flex justify-center">
                        {currentConf.icon}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                        Install for {currentConf.name}
                    </h2>

                    <p className="text-slate-400 text-lg mb-8 max-w-sm mx-auto">
                        Instantly see cryptographic verification badges directly on YouTube. Protect yourself from deepfakes.
                    </p>

                    <a
                        href={currentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center btn-primary-lg w-full sm:w-auto shadow-primary/30 shadow-lg text-lg group-hover:scale-105 transition-transform duration-300"
                    >
                        <Download className="w-5 h-5 mr-3" />
                        Add to {currentConf.name}
                    </a>

                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Free forever</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> No tracking</span>
                        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Open source</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen flex flex-col bg-[#0A0A0A]">
            <Navbar />

            <div className="flex-1 flex flex-col justify-center py-24 relative overflow-hidden">
                {/* Ambient Backgrounds */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

                <div className="container-custom relative z-10 text-center">
                    <header className="mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            <span>AntiAI Protocol Extension</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white">
                            Get the Extension
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Know exactly who created a video before you even press play.
                        </p>
                    </header>

                    {/* Primary Detected Download Component */}
                    {renderPrimaryCTA()}

                    {/* Alternative Browser Links */}
                    {browser !== 'safari' && (
                        <div className="mt-24">
                            <h3 className="text-slate-500 font-medium mb-8">Looking for another browser?</h3>
                            <div className="flex flex-wrap justify-center gap-6">
                                {browser !== 'chrome' && (
                                    <a href={LINKS.chrome} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-blue-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><ChromeLogo /></div>
                                        <span className="font-semibold">Google Chrome</span>
                                    </a>
                                )}
                                {browser !== 'firefox' && (
                                    <a href={LINKS.firefox} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-orange-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><FirefoxLogo /></div>
                                        <span className="font-semibold">Mozilla Firefox</span>
                                    </a>
                                )}
                                {browser !== 'edge' && (
                                    <a href={LINKS.edge} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-cyan-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><EdgeLogo /></div>
                                        <span className="font-semibold">Microsoft Edge</span>
                                    </a>
                                )}
                                {browser !== 'brave' && browser !== 'chrome' && (
                                    <a href={LINKS.brave} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-4 rounded-xl bg-surface border border-white/5 hover:border-orange-500/30 hover:bg-surface-light transition-all text-slate-300 hover:text-white">
                                        <div className="w-6 h-6"><ChromeLogo /></div>
                                        <span className="font-semibold">Brave</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    )
}
