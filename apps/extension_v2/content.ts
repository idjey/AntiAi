
import type { PlasmoCSConfig } from "plasmo"
import "./style.css"

export const config: PlasmoCSConfig = {
    matches: ["https://www.youtube.com/*"],
    all_frames: true
}

let currentVideoId: string | null = null

// Helper to get video ID from URL
const getVideoId = (url: string) => {
    try {
        const urlObj = new URL(url)
        return urlObj.searchParams.get("v")
    } catch (e) {
        return null
    }
}

// Function to check content
const checkContent = async (videoId: string) => {
    console.log(`[AntiAI] Checking video: ${videoId}`)

    try {
        // Call the API
        // GET /public/verify?youtube_video_id=...
        const res = await fetch(`http://localhost:4000/public/verify?youtube_video_id=${videoId}`)
        const data = await res.json()

        // PublicService.verifyVideo returns { status: 'verified' | 'unverified' | ... }
        // We verify against that.
        const isVerified = data && data.status === 'verified'

        console.log(`[AntiAI] Verified: ${isVerified}`, data)

        // Notify background to change icon
        chrome.runtime.sendMessage({
            action: "updateIcon",
            verified: isVerified
        })

        if (isVerified) {
            injectBadge(data)
        } else {
            removeBadge()
        }

        // Also dispatch event for Popup or CSUI
        window.postMessage({ type: "ANTIAI_STATUS", verified: isVerified }, "*")

    } catch (err) {
        console.error(`[AntiAI] Verification failed`, err)
        // On error, assume unverified or keep default? 
        // User said: "If channel/video is not verified, logo will turn red".
        // Error == Unverified usually.
        chrome.runtime.sendMessage({
            action: "updateIcon",
            verified: false
        })
        removeBadge()
    }
}

function injectBadge(data: any) {
    removeBadge(); // Clear existing

    // Retry finding the title element (SPA dynamic loading)
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts

    const findAndInject = () => {
        // Try multiple selectors
        const selectors = [
            'h1.style-scope.ytd-watch-metadata',
            '#title h1',
            '#above-the-fold #title h1',
            '.ytd-watch-metadata #title h1',
            'ytd-watch-metadata h1'
        ];

        let titleElement: Element | null = null;
        for (const sel of selectors) {
            titleElement = document.querySelector(sel);
            if (titleElement) break;
        }

        if (titleElement) {
            const badge = document.createElement('a');
            badge.className = 'antiai-badge';
            // Use local verify link or similar
            badge.href = `http://localhost:3000/verify/${data.youtube_video_id}`;
            badge.target = '_blank';

            // Inline SVG to avoid checking asset paths for now
            badge.innerHTML = `
                <svg viewBox="0 0 24 24" class="antiai-icon">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <span class="antiai-text">Verified</span>
                <div class="antiai-tooltip">
                    <strong>Authenticated Content</strong><br>
                    This video has a cryptographic proof on the AntiAI Transparency Log.<br>
                    <span>Click to verify</span>
                </div>
            `;

            // Insert after title
            titleElement.parentElement?.insertBefore(badge, titleElement.nextSibling);
            // Or use appendChild if parent is flex container? 
            // Legacy used: titleElement.parentNode.insertBefore(badge, titleElement.nextSibling);

            console.log('[AntiAI] Badge injected successfully');
        } else {
            attempts++;
            if (attempts < maxAttempts) {
                // console.log(`[AntiAI] Title not found, retrying (${attempts}/${maxAttempts})...`);
                setTimeout(findAndInject, 500); // Retry every 500ms
            } else {
                console.error('[AntiAI] Could not find video title element after retries');
            }
        }
    };

    findAndInject();
}

function removeBadge() {
    const existing = document.querySelectorAll('.antiai-badge');
    existing.forEach(el => el.remove());
}

// Initial check
const vId = getVideoId(window.location.href)
if (vId) {
    currentVideoId = vId
    checkContent(vId)
}

// Listen for navigation (SPA)
// YouTube uses history API.
let lastUrl = location.href
new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
        lastUrl = url
        const newVid = getVideoId(url)
        if (newVid && newVid !== currentVideoId) {
            currentVideoId = newVid
            checkContent(newVid)
        } else if (!newVid) {
            // Not a video page, reset to default (Green)?
            // User said "If www.youtube.com is not opened..." but inside YT navigation?
            // "logo will stay default green color".
            // So reset to green.
            currentVideoId = null
            chrome.runtime.sendMessage({
                action: "updateIcon",
                verified: true
            })
        }
    }
}).observe(document, { subtree: true, childList: true })
