
import type { PlasmoCSConfig } from "plasmo"
import "./content.css"

export const config: PlasmoCSConfig = {
    matches: ["https://www.youtube.com/*"],
    all_frames: true
}

let currentVideoId: string | null = null
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

// Function to check content
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

        // Background handles icon update now.
        // We just handle the badge.

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

    // Use a simpler, more robust search or observer
    // YouTube title: ytd-watch-metadata h1

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

            // Append to the H1 itself so it stays with the title
            titleH1.appendChild(badge);
            console.log('[AntiAI] Badge injected into H1.');
            return true;
        }
        return false;
    };

    if (!tryInject()) {
        // If not found yet, observe the DOM
        console.log('[AntiAI] Title not found, checking periodically...');
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (tryInject() || attempts > 20) { // Max 10 seconds (500ms * 20)
                clearInterval(interval);
            }
        }, 500);
    }
}

function removeBadge() {
    const existing = document.querySelectorAll('.antiai-badge');
    existing.forEach(el => el.remove());
}

// Initial check
const vId = getVideoId(window.location.href)
if (vId) {
    currentVideoId = vId
}

chrome.storage.local.get(["antiAiEnabled"], (res) => {
    isExtensionEnabled = res.antiAiEnabled !== false; // default true
    if (isExtensionEnabled && currentVideoId) {
        checkContent(currentVideoId)
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
        } else if (currentVideoId) {
            checkContent(currentVideoId);
        }
    }
});

// Listen for navigation (SPA)
// YouTube dispatches custom events for navigation which is much more efficient than observing all DOM mutations.
let lastUrl = location.href;

const handleNavigation = () => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        const newVid = getVideoId(url);
        if (newVid && newVid !== currentVideoId) {
            currentVideoId = newVid;
            if (isExtensionEnabled) {
                checkContent(newVid);
            }
        } else if (!newVid) {
            currentVideoId = null;
            chrome.runtime.sendMessage({
                action: "updateIcon",
                verified: true
            });
        }
    }
};

// YouTube specific event for SPA navigation
window.addEventListener('yt-navigate-finish', handleNavigation);
// Fallback standard history events
window.addEventListener('popstate', handleNavigation);
