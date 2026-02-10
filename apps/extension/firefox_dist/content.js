// AntiAI Content Script
// Injects verification badges into YouTube UI

let currentVideoId = null;

// Listen for page navigation (YouTube is a SPA)
setInterval(() => {
    const videoId = getVideoId();
    if (videoId && videoId !== currentVideoId) {
        currentVideoId = videoId;
        console.log('[AntiAI] New video detected:', videoId);
        checkVerification(videoId);
    }
}, 1000);

function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function checkVerification(videoId) {
    console.log('[AntiAI] Checking verification for:', videoId);
    // Send message to background script to check API
    chrome.runtime.sendMessage({ action: "check_proof", videoId }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('[AntiAI] Runtime error:', chrome.runtime.lastError);
            return;
        }
        console.log('[AntiAI] Background response:', response);
        if (response && response.verified) {
            injectBadge(response.data);
        } else {
            console.log('[AntiAI] Video not verified or API error');
            removeBadge();
        }
    });
}

function injectBadge(data) {
    removeBadge(); // Clear existing

    // Retry finding the title element (SPA dynamic loading)
    let attempts = 0;
    const maxAttempts = 10;
    
    const findAndInject = () => {
        // Try multiple selectors
        const selectors = [
            'h1.style-scope.ytd-watch-metadata', 
            '#title h1', 
            '#above-the-fold #title h1',
            '.ytd-watch-metadata #title h1'
        ];

        let titleElement = null;
        for (const sel of selectors) {
            titleElement = document.querySelector(sel);
            if (titleElement) break;
        }

        if (titleElement) {
            const badge = document.createElement('a');
            badge.className = 'antiai-badge';
            badge.href = `http://localhost:3000/verify/${data.video.id}`;
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
            
            titleElement.parentNode.insertBefore(badge, titleElement.nextSibling);
            console.log('[AntiAI] Badge injected successfully');
        } else {
            attempts++;
            if (attempts < maxAttempts) {
                console.log(`[AntiAI] Title not found, retrying (${attempts}/${maxAttempts})...`);
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
