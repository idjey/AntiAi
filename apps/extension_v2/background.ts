import iconGreen from "data-base64:~assets/status/verified.png"
import iconRed from "data-base64:~assets/status/unverified.png"

export { }

console.log("AntiAI Background Service Started")

// ── Icon blink helper ──────────────────────────────────────────────
// Rapidly toggles the extension icon between the coloured version and
// transparent, producing a single "blink" effect visible in the toolbar.
function blinkIcon(tabId: number, colorIcon: string, times = 2, intervalMs = 200) {
    let count = 0
    const total = times * 2 // on-off pairs

    // Create a 1×1 transparent PNG as "off" frame
    const canvas = new OffscreenCanvas(16, 16)
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, 16, 16)
    const blankImageData = ctx.getImageData(0, 0, 16, 16)

    const actionAPI: any = chrome.action || (chrome as any).browserAction
    if (!actionAPI?.setIcon) return

    const tick = setInterval(() => {
        if (count >= total) {
            clearInterval(tick)
            // End on the final coloured icon
            actionAPI.setIcon({ tabId, path: colorIcon })
            return
        }
        if (count % 2 === 0) {
            // "off" frame — transparent
            actionAPI.setIcon({ tabId, imageData: blankImageData })
        } else {
            // "on" frame — coloured
            actionAPI.setIcon({ tabId, path: colorIcon })
        }
        count++
    }, intervalMs)
}

// ── Message handler ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateIcon" && sender.tab?.id) {
        const isVerified = message.verified
        const iconPath = isVerified ? iconGreen : iconRed

        const actionAPI: any = chrome.action || (chrome as any).browserAction
        if (actionAPI?.setIcon) {
            actionAPI.setIcon({ tabId: sender.tab.id, path: iconPath })
        }

        console.log(`Updated icon for tab ${sender.tab.id} to ${isVerified ? 'Green' : 'Red'}`)
    }

    // ── Video-level verification ───────────────────────────────────
    if (message.action === "checkUrl") {
        const videoId = message.videoId
        console.log(`[Background] Checking video: ${videoId}`)

        fetch(`https://antiaiapi-production.up.railway.app/public/verify?youtube_video_id=${videoId}`)
            .then(res => res.json())
            .then(data => {
                const isVerified = data && data.status === 'verified'
                console.log(`[Background] Verified: ${isVerified}`, data)

                const iconPath = isVerified ? iconGreen : iconRed
                const actionAPI: any = chrome.action || (chrome as any).browserAction
                if (actionAPI?.setIcon && sender.tab?.id) {
                    actionAPI.setIcon({ tabId: sender.tab.id, path: iconPath })
                }

                sendResponse(data)
            })
            .catch(err => {
                console.error(`[Background] Verification failed`, err)
                const actionAPI: any = chrome.action || (chrome as any).browserAction
                if (actionAPI?.setIcon && sender.tab?.id) {
                    actionAPI.setIcon({ tabId: sender.tab.id, path: iconRed })
                }
                sendResponse({ status: 'error', error: err.toString() })
            })

        return true // Keep channel open for async response
    }

    // ── Channel-level verification ─────────────────────────────────
    // Content script sends the channel identifier; we check if
    // *any* video from that channel is verified on AntiAI.
    if (message.action === "checkChannel") {
        const channelId = message.channelId
        console.log(`[Background] Checking channel: ${channelId}`)

        fetch(`https://antiaiapi-production.up.railway.app/public/channel/status?channelId=${encodeURIComponent(channelId)}`)
            .then(res => res.json())
            .then(data => {
                const isVerified = data && data.verified === true
                console.log(`[Background] Channel verified: ${isVerified}`, data)

                // Blink icon once — green for verified, red for not
                if (sender.tab?.id) {
                    blinkIcon(sender.tab.id, isVerified ? iconGreen : iconRed)
                }

                sendResponse({ verified: isVerified })
            })
            .catch(err => {
                console.error(`[Background] Channel check failed`, err)

                if (sender.tab?.id) {
                    blinkIcon(sender.tab.id, iconRed)
                }
                sendResponse({ verified: false, error: err.toString() })
            })

        return true
    }
})
