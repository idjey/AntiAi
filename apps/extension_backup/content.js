/**
 * AntiAI.me Chrome Extension - Content Script
 * Injects verification badges into YouTube video pages
 */

const API_URL = 'https://api.antiai.me';
const BADGE_ID = 'antiai-verify-badge';
const API_TIMEOUT_MS = 8000;

// ==================== HELPERS ====================

function getYouTubeVideoId() {
  const url = new URL(location.href);
  
  // Standard watch URL
  const v = url.searchParams.get('v');
  if (v) return v;
  
  // Shorts URL
  const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch) return shortsMatch[1];
  
  return null;
}

function waitForElement(selector, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);
    
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });
    
    obs.observe(document.documentElement, { childList: true, subtree: true });
    
    setTimeout(() => {
      obs.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// ==================== BADGE UI ====================

function createBadge() {
  const badge = document.createElement('div');
  badge.id = BADGE_ID;
  badge.className = 'antiai-badge antiai-badge--checking';
  
  badge.innerHTML = `
    <span class="antiai-badge__dot"></span>
    <span class="antiai-badge__text">Checking…</span>
  `;
  
  return badge;
}

function setBadgeState(badge, state, details = {}) {
  const dot = badge.querySelector('.antiai-badge__dot');
  const text = badge.querySelector('.antiai-badge__text');
  
  badge.className = `antiai-badge antiai-badge--${state}`;
  
  const states = {
    checking: 'Checking…',
    verified: 'Verified by antiai.me',
    unverified: 'Unverified',
    expired: 'Proof expired',
    error: 'Verification error',
    suspicious: 'Suspicious',
  };
  
  text.textContent = states[state] || 'Unknown';
  
  if (details.channelName) {
    badge.title = `${states[state]} - ${details.channelName}`;
  } else {
    badge.title = 'antiai.me: authenticity verification for creators';
  }
}

// ==================== API ====================

async function verifyVideo(videoId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    
    const response = await fetch(
      `${API_URL}/public/verify?youtube_video_id=${encodeURIComponent(videoId)}`,
      { 
        method: 'GET',
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { status: 'error', reason: 'api_error' };
    }
    
    return await response.json();
  } catch (e) {
    if (e.name === 'AbortError') {
      return { status: 'error', reason: 'timeout' };
    }
    return { status: 'error', reason: 'network_error' };
  }
}

// ==================== INJECTION ====================

async function findBadgeAnchor() {
  const selectors = [
    'ytd-watch-metadata #title h1',
    'ytd-watch-metadata #title',
    'ytd-watch-metadata',
    'ytd-reel-video-renderer h2',
  ];
  
  for (const sel of selectors) {
    const el = await waitForElement(sel, 3000);
    if (el) return el;
  }
  
  return null;
}

let lastVideoId = null;

async function injectBadge() {
  const videoId = getYouTubeVideoId();
  if (!videoId) return;
  
  // Skip if same video and badge exists
  if (videoId === lastVideoId && document.getElementById(BADGE_ID)) {
    return;
  }
  
  lastVideoId = videoId;
  
  // Remove old badge
  const oldBadge = document.getElementById(BADGE_ID);
  if (oldBadge) oldBadge.remove();
  
  // Find anchor and inject
  const anchor = await findBadgeAnchor();
  if (!anchor) return;
  
  const badge = createBadge();
  setBadgeState(badge, 'checking');
  
  if (anchor.tagName === 'H1') {
    anchor.insertAdjacentElement('afterend', badge);
  } else {
    anchor.appendChild(badge);
  }
  
  // Verify
  const result = await verifyVideo(videoId);
  
  switch (result.status) {
    case 'verified':
      setBadgeState(badge, 'verified', { channelName: result.channel_name });
      break;
    case 'unverified':
      setBadgeState(badge, 'unverified');
      break;
    case 'expired':
      setBadgeState(badge, 'expired');
      break;
    case 'revoked':
      setBadgeState(badge, 'suspicious');
      break;
    default:
      setBadgeState(badge, 'error');
  }
}

// ==================== SPA WATCHER ====================

function startSpaWatcher() {
  let prevUrl = location.href;
  
  // Poll for URL changes
  setInterval(() => {
    if (location.href !== prevUrl) {
      prevUrl = location.href;
      const oldBadge = document.getElementById(BADGE_ID);
      if (oldBadge) oldBadge.remove();
      lastVideoId = null;
      injectBadge();
    }
  }, 700);
  
  // Initial injection
  injectBadge();
  
  // Re-inject on DOM changes
  const obs = new MutationObserver(() => {
    if (getYouTubeVideoId() && !document.getElementById(BADGE_ID)) {
      injectBadge();
    }
  });
  
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

// Boot
startSpaWatcher();
