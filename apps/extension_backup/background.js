/**
 * AntiAI.me Chrome Extension - Service Worker
 */

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'https://antiai.me' });
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AntiAI.me extension installed');
  }
});
