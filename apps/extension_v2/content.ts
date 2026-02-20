
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
        // Delegate API call to Background Script to avoid CORS/Mixed Content issues
        const data = await chrome.runtime.sendMessage({
            action: "checkUrl",
            videoId: videoId
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
            badge.href = `http://localhost:3000/verify/${data.youtube_video_id}`;
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
        console.log('[AntiAI] Title not found, observing DOM...');
        const observer = new MutationObserver((mutations, obs) => {
            if (tryInject()) {
                obs.disconnect(); // Stop observing once found
            }
        });

        const target = document.querySelector('ytd-app') || document.body;
        observer.observe(target, {
            childList: true,
            subtree: true
        });

        // Timeout to stop observing eventually
        setTimeout(() => observer.disconnect(), 10000);
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
