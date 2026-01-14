/**
 * VelocityPlay - Popup Script
 */

(function () {
  'use strict';

  // DOM Elements
  const speedValue = document.getElementById('speedValue');
  const speedSlider = document.getElementById('speedSlider');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const resetBtn = document.getElementById('resetBtn');
  const rememberBtn = document.getElementById('rememberBtn');
  const statusText = document.getElementById('statusText');

  // State
  let currentSpeed = 1.0;
  let currentTabId = null;
  let retryCount = 0;
  const MAX_RETRIES = 5;

  /**
   * Format speed for display
   * Shows clean numbers: 1, 1.5, 1.25, etc.
   */
  function formatSpeed(speed) {
    // Round to 2 decimal places
    speed = Math.round(speed * 100) / 100;
    
    // If it's a whole number, show without decimals
    if (speed === Math.floor(speed)) {
      return speed.toString();
    }
    
    // If it ends in 0 (like 1.50), show as 1.5
    const str = speed.toFixed(2);
    if (str.endsWith('0')) {
      return speed.toFixed(1);
    }
    
    return str;
  }

  /**
   * Update UI to reflect current speed
   */
  function updateUI(speed) {
    // Ensure speed is a valid number
    speed = parseFloat(speed) || 1.0;
    speed = Math.max(0.25, Math.min(16, speed));
    speed = Math.round(speed * 100) / 100;
    
    currentSpeed = speed;

    // Update speed display with clean formatting
    speedValue.textContent = formatSpeed(speed);
    
    // Update slider position
    speedSlider.value = Math.min(speed, parseFloat(speedSlider.max));

    // Update speed color class
    speedValue.classList.remove('slow', 'normal', 'fast', 'extreme');
    if (speed < 1) {
      speedValue.classList.add('slow');
    } else if (speed === 1) {
      speedValue.classList.add('normal');
    } else if (speed <= 2) {
      speedValue.classList.add('fast');
    } else {
      speedValue.classList.add('extreme');
    }

    // Update active preset - highlight if matches exactly
    presetBtns.forEach((btn) => {
      const btnSpeed = parseFloat(btn.dataset.speed);
      const isActive = Math.abs(btnSpeed - speed) < 0.001;
      btn.classList.toggle('active', isActive);
    });
  }

  /**
   * Send speed to content script
   */
  async function setSpeed(speed) {
    // Validate and round
    speed = parseFloat(speed) || 1.0;
    speed = Math.max(0.25, Math.min(16, speed));
    speed = Math.round(speed * 100) / 100;
    
    // Update UI immediately for responsiveness
    updateUI(speed);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', speed });
        if (response?.mediaCount !== undefined) {
          updateStatus(response.mediaCount);
        }
      }
    } catch (err) {
      console.log('Could not set speed:', err.message);
      injectContentScript();
    }
  }

  /**
   * Inject content script if not loaded
   */
  async function injectContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content/content.js']
      });

      setTimeout(getState, 300);
    } catch (err) {
      console.log('Could not inject script:', err.message);
    }
  }

  /**
   * Get current state from content script
   */
  async function getState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        updateStatus(0, 'No active tab');
        return;
      }

      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('about:')) {
        updateStatus(0, 'Cannot run on this page');
        return;
      }

      currentTabId = tab.id;

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' });
      if (response) {
        updateUI(response.speed);
        updateStatus(response.mediaCount);
        retryCount = 0;
      }
    } catch (err) {
      console.log('Could not get state:', err.message);
      
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(getState, 500);
        updateStatus(0, 'Connecting...');
      } else {
        updateStatus(0, 'Refresh page to activate');
      }
    }
  }

  /**
   * Update status bar
   */
  function updateStatus(mediaCount, customMessage) {
    if (customMessage) {
      statusText.textContent = customMessage;
      statusText.classList.remove('active');
      return;
    }

    if (mediaCount > 0) {
      statusText.textContent = `${mediaCount} media element${mediaCount > 1 ? 's' : ''} found`;
      statusText.classList.add('active');
    } else {
      statusText.textContent = 'No media detected on this page';
      statusText.classList.remove('active');
    }
  }

  /**
   * Initialize event listeners
   */
  function initEvents() {
    // Slider - real-time updates while dragging
    speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      setSpeed(speed);
    });

    // Preset buttons
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        setSpeed(speed);
      });
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      setSpeed(1.0);
    });

    // Remember button
    rememberBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          const url = new URL(tab.url);
          await chrome.storage.local.set({
            [`domain_${url.hostname}`]: currentSpeed,
          });
          statusText.textContent = `✓ Saved ${formatSpeed(currentSpeed)}× for ${url.hostname}`;
          statusText.classList.add('active');
          setTimeout(() => getState(), 2000);
        }
      } catch (err) {
        console.log('Could not save:', err);
      }
    });

    // Listen for speed changes from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SPEED_CHANGED') {
        updateUI(message.speed);
        updateStatus(message.mediaCount);
      }
    });

    // Keyboard shortcuts in popup
    document.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.1 : 0.25; // Shift for fine control
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        setSpeed(currentSpeed + step);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        setSpeed(currentSpeed - step);
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        setSpeed(1.0);
        e.preventDefault();
      }
    });
  }

  // Initialize
  initEvents();
  getState();
})();
