// AntiAI Background Script
// Handles API requests

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "check_proof") {
        checkProof(request.videoId).then(sendResponse);
        return true; // Indicates async response
    }
});

async function checkProof(videoId) {
    try {
        // TODO: Replace with production URL when deployed
        const API_URL = 'http://localhost:4000'; 
        
        // We first need to find the internal ID or check by YouTube ID directly
        // Currently our public endpoint expects the internal ID, but for the extension
        // we likely need an endpoint that accepts youtube_video_id.
        // For MVP, let's assume we search by youtube_id if the API supports it,
        // OR we modify the API to support lookup by youtube_id.
        
        // Let's try fetching the proof using a new endpoint or query param if available.
        // Since we only have GET /proofs/public/verify/:id (internal ID), 
        // we might need to update the backend to support YouTube ID lookup.
        
        // FOR NOW: Let's assume the public endpoint can handle lookup or we add a query param.
        // Actually, looking at the code, ProofsService.getPublicProof takes an ID and does `findUnique({ where: { id: videoId } })`.
        // This won't work with YouTube IDs (e.g., dQw4w9WgXcQ).
        
        // WORKAROUND: We will need to update the backend to allow lookup by youtube_video_id.
        // For this step, I will implement the fetch assuming the endpoint will be updated.
        
        const response = await fetch(`${API_URL}/proofs/public/verify/yt/${videoId}`);
        
        if (response.ok) {
            const data = await response.json();
            return { verified: true, data };
        }
        return { verified: false };
    } catch (error) {
        console.error('[AntiAI] API Error:', error);
        return { verified: false, error: error.message };
    }
}
