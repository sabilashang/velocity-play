/**
 * VelocityPlay - Background Service Worker
 * Handles keyboard commands and state management
 */

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  let messageType;
  switch (command) {
    case 'speed-up':
      messageType = 'INCREASE_SPEED';
      break;
    case 'speed-down':
      messageType = 'DECREASE_SPEED';
      break;
    case 'reset-speed':
      messageType = 'RESET_SPEED';
      break;
    default:
      return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: messageType });
    if (response?.speed) {
      updateBadge(response.speed);
    }
  } catch (err) {
    // Content script not loaded
  }
});

// Update extension badge with current speed
function updateBadge(speed) {
  const text = speed === 1 ? '' : `${speed}×`;
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#00d4ff' });
}

// Listen for speed changes from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SPEED_CHANGED') {
    updateBadge(message.speed);
  }
  return false;
});

// Initialize badge on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

