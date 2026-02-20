import iconGreen from "url:./assets/status/verified.svg"
import iconRed from "url:./assets/status/unverified.svg"

export { }

console.log("AntiAI Background Service Started")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateIcon" && sender.tab?.id) {
        const isVerified = message.verified
        const path = isVerified ? iconGreen : iconRed

        // In Plasmo, imported assets via "url:..." give the actual path in the build (e.g. "verified.hash.svg")
        // So we should use the imported variable directly.
        const iconPath = isVerified ? iconGreen : iconRed

        chrome.action.setIcon({
            tabId: sender.tab.id,
            path: iconPath
        })

        console.log(`Updated icon for tab ${sender.tab.id} to ${isVerified ? 'Green' : 'Red'} (${iconPath})`)
    }
})
