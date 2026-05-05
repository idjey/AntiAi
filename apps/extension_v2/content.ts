import type { PlasmoCSConfig } from "plasmo"
import "./content.css"

export const config: PlasmoCSConfig = {
    matches: [
        "https://www.youtube.com/*",
        "https://*.tiktok.com/*",
        "https://*.instagram.com/*",
        "https://*.facebook.com/*"
    ],
    all_frames: true
}

let currentVideoId: string | null = null
let currentPlatform: string | null = null
let lastCheckedChannelId: string | null = null
let isExtensionEnabled: boolean = true

// ── Multi-Platform Adapters ─────────────────────────────────────────

interface PlatformAdapter {
    id: string;
    detect: (url: string) => boolean;
    getVideoId: (url: string) => string | null;
    getChannelId: (url: string) => string | null;
    injectBadge: (isVerified: boolean, data: any) => void;
    removeBadge: () => void;
}

const adapters: PlatformAdapter[] = [
    {
        id: "youtube",
        detect: (url) => url.includes("youtube.com"),
        getVideoId: (url) => {
            try {
                const urlObj = new URL(url)
                if (urlObj.pathname.startsWith('/shorts/')) {
                    return urlObj.pathname.split('/shorts/')[1] || null
                }
                return urlObj.searchParams.get("v")
            } catch (e) {
                return null
            }
        },
        getChannelId: (url) => {
            const urlObj = new URL(url)
            const path = urlObj.pathname
            if (path.startsWith('/@')) return path
            if (path.startsWith('/channel/')) return path.split('/channel/')[1] || null
            if (path.startsWith('/c/')) return path.split('/c/')[1] || null
            
            // Fallback to DOM parsing for YouTube
            const channelLink = document.querySelector('ytd-watch-metadata ytd-channel-name a') ||
                document.querySelector('#owner a[href*="/@"]') ||
                document.querySelector('#channel-name a') ||
                document.querySelector('ytd-reel-channel-bar-renderer a') // Shorts
            if (channelLink) {
                const href = channelLink.getAttribute('href') || ''
                if (href.startsWith('/@')) return href
                if (href.includes('/channel/')) return href.split('/channel/')[1] || null
            }
            return null
        },
        removeBadge: () => {
            const existing = document.querySelectorAll('.antiai-badge')
            existing.forEach(el => el.remove())
        },
        injectBadge: (isVerified, data) => {
            const isShorts = window.location.pathname.startsWith('/shorts/')
            const existing = document.querySelector('.antiai-badge')
            if (existing) existing.remove()

            const tryInject = () => {
                // Determine target element (Watch Page vs Shorts)
                let targetEl = null
                if (isShorts) {
                    targetEl = document.querySelector('ytd-reel-video-renderer[is-active] h2.title') || 
                               document.querySelector('ytd-reel-video-renderer[is-active] .title')
                } else {
                    targetEl = document.querySelector('ytd-watch-metadata h1') ||
                               document.querySelector('#title > h1')
                }

                if (targetEl) {
                    if (targetEl.querySelector('.antiai-badge')) return true

                    const badge = document.createElement('a')
                    // Add shorts specific class if needed
                    badge.className = `antiai-badge ${!isVerified ? 'antiai-badge-unverified' : ''} ${isShorts ? 'antiai-badge-shorts' : ''}`
                    
                    if (isVerified && data?.youtube_video_id) {
                        badge.href = `https://antiai.me/verify/${data.youtube_video_id}`
                        badge.target = '_blank'
                    } else {
                        badge.href = 'javascript:void(0)'
                        badge.style.cursor = 'default'
                    }

                    const svgNS = "http://www.w3.org/2000/svg"
                    const svg = document.createElementNS(svgNS, "svg")
                    svg.setAttribute("viewBox", "0 0 24 24")
                    svg.setAttribute("class", "antiai-icon")
                    const path = document.createElementNS(svgNS, "path")
                    
                    if (isVerified) {
                        path.setAttribute("d", "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z")
                    } else {
                        path.setAttribute("d", "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v4h-2V7zm0 6h2v2h-2v-2z")
                    }
                    svg.appendChild(path)
                    badge.appendChild(svg)

                    // Shorts badge is micro, so we hide text
                    if (!isShorts) {
                        const span = document.createElement('span')
                        span.className = 'antiai-text'
                        span.textContent = isVerified ? 'Verified' : 'Unverified'
                        badge.appendChild(span)
                    }

                    const tooltip = document.createElement('div')
                    tooltip.className = 'antiai-tooltip'
                    
                    const strong = document.createElement('strong')
                    strong.textContent = isVerified ? 'Authenticated Content' : 'Unverified Content'
                    
                    const textNode = document.createTextNode(
                        isVerified 
                        ? 'This video has a cryptographic proof on the AntiAI Transparency Log.' 
                        : 'No cryptographic proof found for this video.'
                    )
                    
                    tooltip.appendChild(strong)
                    tooltip.appendChild(document.createElement('br'))
                    tooltip.appendChild(textNode)

                    badge.appendChild(tooltip)
                    targetEl.appendChild(badge)
                    return true
                }
                return false
            }

            if (!tryInject()) {
                let attempts = 0
                const interval = setInterval(() => {
                    attempts++
                    if (tryInject() || attempts > 20) clearInterval(interval)
                }, 500)
            }
        }
    },
    {
        id: "tiktok",
        detect: (url) => url.includes("tiktok.com"),
        getVideoId: (url) => {
            try {
                const match = url.match(/\/video\/(\d+)/)
                return match ? match[1] : null
            } catch (e) { return null }
        },
        getChannelId: (url) => {
            try {
                const match = url.match(/@([\w.-]+)/)
                return match ? match[1] : null
            } catch(e) { return null }
        },
        removeBadge: () => {
            const existing = document.querySelectorAll('.antiai-badge')
            existing.forEach(el => el.remove())
        },
        injectBadge: (isVerified, data) => {
            // Scaffold for TikTok DOM Injection
            console.log(`[AntiAI] TikTok adapter injection triggered. isVerified=${isVerified}`)
        }
    },
    {
        id: "instagram",
        detect: (url) => url.includes("instagram.com"),
        getVideoId: (url) => {
            try {
                const match = url.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/)
                return match ? match[1] : null
            } catch(e) { return null }
        },
        getChannelId: (url) => null,
        removeBadge: () => {
            const existing = document.querySelectorAll('.antiai-badge')
            existing.forEach(el => el.remove())
        },
        injectBadge: (isVerified, data) => {
            // Scaffold for Instagram DOM Injection
            console.log(`[AntiAI] Instagram adapter injection triggered. isVerified=${isVerified}`)
        }
    },
    {
        id: "facebook",
        detect: (url) => url.includes("facebook.com"),
        getVideoId: (url) => {
            try {
                // FB video URLs vary wildly
                const urlObj = new URL(url)
                if (urlObj.pathname.includes('/videos/')) {
                    const parts = urlObj.pathname.split('/')
                    return parts[parts.length - 1] || parts[parts.length - 2]
                }
                return urlObj.searchParams.get("v")
            } catch(e) { return null }
        },
        getChannelId: (url) => null,
        removeBadge: () => {
            const existing = document.querySelectorAll('.antiai-badge')
            existing.forEach(el => el.remove())
        },
        injectBadge: (isVerified, data) => {
            // Scaffold for Facebook DOM Injection
            console.log(`[AntiAI] Facebook adapter injection triggered. isVerified=${isVerified}`)
        }
    }
]

// ── Core Verification Engine ────────────────────────────────────────

const getActiveAdapter = (): PlatformAdapter | null => {
    return adapters.find(a => a.detect(window.location.href)) || null
}

const checkChannel = async () => {
    if (!isExtensionEnabled) return
    const adapter = getActiveAdapter()
    if (!adapter) return

    const channelId = adapter.getChannelId(window.location.href)
    if (!channelId || channelId === lastCheckedChannelId) return
    
    lastCheckedChannelId = channelId
    console.log(`[AntiAI] Checking channel on ${adapter.id}: ${channelId}`)

    try {
        await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                action: "checkChannel",
                channelId: channelId,
                platform: adapter.id
            }, (response) => {
                if (chrome.runtime.lastError) resolve(null)
                else resolve(response)
            })
        })
    } catch (err) {
        console.error('[AntiAI] Channel check failed', err)
    }
}

const checkContent = async (videoId: string, platform: string) => {
    if (!isExtensionEnabled) return
    const adapter = adapters.find(a => a.id === platform)
    if (!adapter) return

    console.log(`[AntiAI] Checking video on ${platform}: ${videoId}`)

    try {
        const data = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                action: "checkUrl",
                videoId: videoId,
                platform: platform
            }, (response) => {
                if (chrome.runtime.lastError) resolve(null)
                else resolve(response)
            })
        })

        const isVerified = data && data.status === 'verified'
        adapter.injectBadge(isVerified, data)
        window.postMessage({ type: "ANTIAI_STATUS", verified: isVerified, platform }, "*")

    } catch (err) {
        console.error(`[AntiAI] Verification failed`, err)
        adapter.injectBadge(false, null)
    }
}

// ── Initialization & SPA Routing ────────────────────────────────────

const init = () => {
    const adapter = getActiveAdapter()
    if (!adapter) return

    currentPlatform = adapter.id
    const vId = adapter.getVideoId(window.location.href)
    if (vId) currentVideoId = vId

    chrome.storage.local.get(["antiAiEnabled"], (res) => {
        isExtensionEnabled = res.antiAiEnabled !== false
        if (isExtensionEnabled) {
            if (currentVideoId) checkContent(currentVideoId, currentPlatform!)
            setTimeout(checkChannel, 2000)
        } else {
            chrome.runtime.sendMessage({ action: "updateIcon", verified: true })
        }
    })
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggleEnabled") {
        isExtensionEnabled = msg.enabled
        const adapter = getActiveAdapter()
        if (!isExtensionEnabled) {
            if (adapter) adapter.removeBadge()
            chrome.runtime.sendMessage({ action: "updateIcon", verified: true })
        } else {
            if (currentVideoId && adapter) checkContent(currentVideoId, adapter.id)
            setTimeout(checkChannel, 1000)
        }
    }
})

// Unified SPA Navigation Handler
let lastUrl = location.href
const handleNavigation = () => {
    const url = location.href
    if (url !== lastUrl) {
        lastUrl = url
        lastCheckedChannelId = null
        
        const adapter = getActiveAdapter()
        if (!adapter) return

        const newVid = adapter.getVideoId(url)
        
        if (newVid && newVid !== currentVideoId) {
            currentVideoId = newVid
            if (isExtensionEnabled) {
                checkContent(newVid, adapter.id)
                setTimeout(checkChannel, 2000)
            }
        } else if (!newVid) {
            currentVideoId = null
            if (isExtensionEnabled) {
                setTimeout(checkChannel, 2000)
            } else {
                chrome.runtime.sendMessage({ action: "updateIcon", verified: true })
            }
        }
    }
}

// Standard Browser History APIs
window.addEventListener('popstate', handleNavigation)

// YouTube SPA Event
window.addEventListener('yt-navigate-finish', handleNavigation)

// MutationObserver for infinite scroll platforms (TikTok/Shorts)
let timeoutId: any = null
const observer = new MutationObserver(() => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
        if (location.href !== lastUrl) handleNavigation()
    }, 100)
})
observer.observe(document.body, { childList: true, subtree: true })

// Boot
init()
