// ============================================================
// SHASHN PROFANITY MUTER — Service Worker (MV3)
// ============================================================

// Track mute stats per tab
const tabStats = {};

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    muteCount: 0,
    sensitivity: 'all',       // 'all' | 'moderate' | 'severe'
    showBadge: true,
    languages: {
      english: true,
      hindi: true,
      hinglish: true,
      punjabi: true,
      telugu: true,
      internet_slang: true,
    },
  });
  console.log('[ProfanityMuter] Extension installed.');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (msg.type === 'MUTED') {
    if (tabId) {
      if (!tabStats[tabId]) tabStats[tabId] = { count: 0, words: [] };
      tabStats[tabId].count++;
      tabStats[tabId].words.push(msg.word);
      // Update badge
      chrome.storage.sync.get('showBadge', ({ showBadge }) => {
        if (showBadge) {
          chrome.action.setBadgeText({ text: String(tabStats[tabId].count), tabId });
          chrome.action.setBadgeBackgroundColor({ color: '#e53e3e', tabId });
        }
      });
    }
    // Persist total count
    chrome.storage.sync.get('muteCount', ({ muteCount }) => {
      chrome.storage.sync.set({ muteCount: (muteCount || 0) + 1 });
    });
  }

  if (msg.type === 'GET_TAB_STATS') {
    sendResponse(tabStats[tabId] || { count: 0, words: [] });
    return true;
  }

  if (msg.type === 'RESET_BADGE' && tabId) {
    tabStats[tabId] = { count: 0, words: [] };
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Clear badge when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabStats[tabId] = { count: 0, words: [] };
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
