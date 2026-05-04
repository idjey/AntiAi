
import type { PlasmoCSConfig } from "plasmo"
import "./content.css"

export const config: PlasmoCSConfig = {
    matches: ["https://www.youtube.com/*"],
    all_frames: true
}

let currentVideoId: string | null = null
let lastCheckedChannelId: string | null = null
let isExtensionEnabled: boolean = true

// Helper to get video ID from URL
const getVideoId = (url: string) => {
    try {
        const urlObj = new URL(url)
        return urlObj.searchParams.get("v")
    } catch (e) {
        return null
    }
}

// ── Channel-level check ────────────────────────────────────────────
// Scrapes the channel identifier from the YouTube watch page and
// asks the background service to verify it. This triggers a one-time
// icon blink (green = verified channel, red = unverified channel).
const checkChannel = async () => {
    if (!isExtensionEnabled) return

    let channelId: string | null = null

    // First, check if we are currently ON a channel page (URL-based)
    const urlObj = new URL(window.location.href)
    const path = urlObj.pathname
    if (path.startsWith('/@')) {
        channelId = path // e.g. "/@MrBeast"
    } else if (path.startsWith('/channel/')) {
        channelId = path.split('/channel/')[1] || null
    } else if (path.startsWith('/c/')) {
        channelId = path.split('/c/')[1] || null
    }

    // If not on a channel page, try to extract from watch page metadata
    if (!channelId) {
        const channelLink =
            document.querySelector('ytd-watch-metadata ytd-channel-name a') ||
            document.querySelector('#owner a[href*="/@"]') ||
            document.querySelector('#channel-name a')

        if (channelLink) {
            const href = channelLink.getAttribute('href') || ''
            if (href.startsWith('/@')) {
                channelId = href
            } else if (href.includes('/channel/')) {
                channelId = href.split('/channel/')[1] || null
            }
        }
    }

    if (!channelId) {
        console.log('[AntiAI] Channel link not found yet, will retry...')
        return
    }

    if (channelId === lastCheckedChannelId) return
    lastCheckedChannelId = channelId

    console.log(`[AntiAI] Checking channel: ${channelId}`)

    try {
        await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                action: "checkChannel",
                channelId: channelId
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[AntiAI] sendMessage error:", chrome.runtime.lastError)
                    resolve(null)
                    return
                }
                console.log(`[AntiAI] Channel response:`, response)
                resolve(response)
            })
        })
    } catch (err) {
        console.error('[AntiAI] Channel check failed', err)
    }
}

// ── Video-level check ──────────────────────────────────────────────
const checkContent = async (videoId: string) => {
    if (!isExtensionEnabled) return;
    console.log(`[AntiAI] Checking video: ${videoId}`)

    try {
        // Delegate API call to Background Script to avoid CORS/Mixed Content issues
        const data = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
                action: "checkUrl",
                videoId: videoId
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[AntiAI] sendMessage error:", chrome.runtime.lastError);
                    resolve(null);
                    return;
                }
                resolve(response);
            });
        });

        const isVerified = data && data.status === 'verified'

        console.log(`[AntiAI] Verified: ${isVerified}`, data)

        if (isVerified) {
            injectBadge(data)
        } else {
            removeBadge()
        }

        // Also dispatch event for Popup or CSUI
        window.postMessage({ type: "ANTIAI_STATUS", verified: isVerified }, "*")

    } catch (err) {
        console.error(`[AntiAI] Verification failed`, err)
        removeBadge()
    }
}

function injectBadge(data: any) {
    // avoid duplicates
    if (document.querySelector('.antiai-badge')) return;

    const tryInject = () => {
        const titleH1 = document.querySelector('ytd-watch-metadata h1') ||
            document.querySelector('#title > h1');

        if (titleH1) {
            if (titleH1.querySelector('.antiai-badge')) return; // already there

            console.log('[AntiAI] Found title element:', titleH1);

            const badge = document.createElement('a');
            badge.className = 'antiai-badge';
            badge.href = `https://antiai.me/verify/${data.youtube_video_id}`;
            badge.target = '_blank';
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("class", "antiai-icon");
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z");
            svg.appendChild(path);

            const span = document.createElement('span');
            span.className = 'antiai-text';
            span.textContent = 'Verified';

            const tooltip = document.createElement('div');
            tooltip.className = 'antiai-tooltip';
            
            const strong = document.createElement('strong');
            strong.textContent = 'Authenticated Content';
            
            const br1 = document.createElement('br');
            
            const textNode = document.createTextNode('This video has a cryptographic proof on the AntiAI Transparency Log.');
            
            const br2 = document.createElement('br');
            
            const clickSpan = document.createElement('span');
            clickSpan.textContent = 'Click to verify';

            tooltip.appendChild(strong);
            tooltip.appendChild(br1);
            tooltip.appendChild(textNode);
            tooltip.appendChild(br2);
            tooltip.appendChild(clickSpan);

            badge.appendChild(svg);
            badge.appendChild(span);
            badge.appendChild(tooltip);

            titleH1.appendChild(badge);
            console.log('[AntiAI] Badge injected into H1.');
            return true;
        }
        return false;
    };

    if (!tryInject()) {
        console.log('[AntiAI] Title not found, checking periodically...');
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (tryInject() || attempts > 20) {
                clearInterval(interval);
            }
        }, 500);
    }
}

function removeBadge() {
    const existing = document.querySelectorAll('.antiai-badge');
    existing.forEach(el => el.remove());
}

// ── Initialization ─────────────────────────────────────────────────
const vId = getVideoId(window.location.href)
if (vId) {
    currentVideoId = vId
}

chrome.storage.local.get(["antiAiEnabled"], (res) => {
    isExtensionEnabled = res.antiAiEnabled !== false; // default true
    if (isExtensionEnabled) {
        if (currentVideoId) {
            checkContent(currentVideoId)
        }
        // Always check channel, whether on video page or channel page
        setTimeout(checkChannel, 2000)
    } else {
        // Set default icon
        chrome.runtime.sendMessage({ action: "updateIcon", verified: true })
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "toggleEnabled") {
        isExtensionEnabled = msg.enabled;
        if (!isExtensionEnabled) {
            removeBadge();
            chrome.runtime.sendMessage({ action: "updateIcon", verified: true })
        } else {
            if (currentVideoId) {
                checkContent(currentVideoId);
            }
            setTimeout(checkChannel, 1000)
        }
    }
});

// ── SPA Navigation ─────────────────────────────────────────────────
let lastUrl = location.href;

const handleNavigation = () => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        lastCheckedChannelId = null; // Reset channel check on navigation
        const newVid = getVideoId(url);
        
        if (newVid && newVid !== currentVideoId) {
            currentVideoId = newVid;
            if (isExtensionEnabled) {
                checkContent(newVid);
                // Channel check with delay for DOM to load
                setTimeout(checkChannel, 2000)
            }
        } else if (!newVid) {
            currentVideoId = null;
            if (isExtensionEnabled) {
                setTimeout(checkChannel, 2000)
            } else {
                chrome.runtime.sendMessage({
                    action: "updateIcon",
                    verified: true
                });
            }
        }
    }
};

// YouTube specific event for SPA navigation
window.addEventListener('yt-navigate-finish', handleNavigation);
// Fallback standard history events
window.addEventListener('popstate', handleNavigation);
