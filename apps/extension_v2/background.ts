import iconGreen from "data-base64:~assets/status/verified.png"
import iconRed from "data-base64:~assets/status/unverified.png"

export { }

console.log("AntiAI Background Service Started")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateIcon" && sender.tab?.id) {
        const isVerified = message.verified
        const path = isVerified ? iconGreen : iconRed

        // In Plasmo, imported assets via "url:..." give the actual path in the build (e.g. "verified.hash.svg")
        // So we should use the imported variable directly.
        const iconPath = isVerified ? iconGreen : iconRed

        const setExtIcon = (opts: any) => {
            const actionAPI = chrome.action || chrome.browserAction;
            if (actionAPI && actionAPI.setIcon) {
                actionAPI.setIcon(opts);
            }
        };

        setExtIcon({
            tabId: sender.tab.id,
            path: iconPath
        })

        console.log(`Updated icon for tab ${sender.tab.id} to ${isVerified ? 'Green' : 'Red'} (${iconPath})`)
    }

    if (message.action === "checkUrl") {
        const videoId = message.videoId;
        console.log(`[Background] Checking video: ${videoId}`);

        fetch(`http://localhost:4000/public/verify?youtube_video_id=${videoId}`)
            .then(res => res.json())
            .then(data => {
                const isVerified = data && data.status === 'verified';
                console.log(`[Background] Verified: ${isVerified}`, data);

                // Update icon immediately from background
                const iconPath = isVerified ? iconGreen : iconRed;
                const setExtIcon = (opts: any) => {
                    const actionAPI = chrome.action || chrome.browserAction;
                    if (actionAPI && actionAPI.setIcon) {
                        actionAPI.setIcon(opts);
                    }
                };

                if (sender.tab?.id) {
                    setExtIcon({
                        tabId: sender.tab.id,
                        path: iconPath
                    });
                }

                // Send response back to content script
                sendResponse(data);
            })
            .catch(err => {
                console.error(`[Background] Verification failed`, err);
                // Default to unverified on error
                if (sender.tab?.id) {
                    const setExtIcon = (opts: any) => {
                        const actionAPI = chrome.action || chrome.browserAction;
                        if (actionAPI && actionAPI.setIcon) {
                            actionAPI.setIcon(opts);
                        }
                    };
                    setExtIcon({
                        tabId: sender.tab.id,
                        path: iconRed
                    });
                }
                sendResponse({ status: 'error', error: err.toString() });
            });

        return true; // Keep channel open for async response
    }
})
