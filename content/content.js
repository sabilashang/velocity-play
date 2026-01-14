/**
 * VelocityPlay - Content Script
 * Detects and controls video/audio playback speed on any page
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__velocityPlayLoaded) return;
  window.__velocityPlayLoaded = true;

  // State
  let currentSpeed = 1.0;
  let mediaElements = new Set();
  let overlay = null;

  // Speed settings
  const SPEED_STEP = 0.25;
  const SPEED_MIN = 0.25;
  const SPEED_MAX = 16;

  /**
   * Format speed for display
   */
  function formatSpeed(speed) {
    speed = Math.round(speed * 100) / 100;
    if (speed === Math.floor(speed)) {
      return speed.toString();
    }
    const str = speed.toFixed(2);
    if (str.endsWith('0')) {
      return speed.toFixed(1);
    }
    return str;
  }

  /**
   * Apply speed to a media element with pitch preservation
   */
  function applySpeed(element, speed) {
    try {
      // Ensure speed is valid
      speed = Math.round(speed * 100) / 100;
      
      element.playbackRate = speed;
      
      // Preserve pitch (supported in modern browsers)
      if ('preservesPitch' in element) {
        element.preservesPitch = true;
      } else if ('mozPreservesPitch' in element) {
        element.mozPreservesPitch = true;
      } else if ('webkitPreservesPitch' in element) {
        element.webkitPreservesPitch = true;
      }
    } catch (e) {
      console.log('VelocityPlay: Could not set speed on element', e);
    }
  }

  /**
   * Apply current speed to all tracked media elements
   */
  function applySpeedToAll() {
    // Clean up dead elements
    mediaElements.forEach((el) => {
      if (!document.contains(el)) {
        mediaElements.delete(el);
      }
    });

    // Apply speed to all
    mediaElements.forEach((el) => {
      applySpeed(el, currentSpeed);
    });

    updateOverlay();
    notifyPopup();
  }

  /**
   * Set playback speed
   */
  function setSpeed(speed) {
    // Validate and round to 2 decimal places
    speed = parseFloat(speed) || 1.0;
    speed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, speed));
    speed = Math.round(speed * 100) / 100;
    
    currentSpeed = speed;
    applySpeedToAll();
    saveSpeed();
  }

  /**
   * Increase speed by step
   */
  function increaseSpeed() {
    setSpeed(currentSpeed + SPEED_STEP);
  }

  /**
   * Decrease speed by step
   */
  function decreaseSpeed() {
    setSpeed(currentSpeed - SPEED_STEP);
  }

  /**
   * Reset to 1x
   */
  function resetSpeed() {
    setSpeed(1.0);
  }

  /**
   * Save speed to storage
   */
  function saveSpeed() {
    try {
      chrome.storage.local.set({
        currentSpeed: currentSpeed,
        [`domain_${window.location.hostname}`]: currentSpeed,
      });
    } catch (e) {
      // Storage might not be available
    }
  }

  /**
   * Load saved speed
   */
  function loadSpeed() {
    try {
      const domain = `domain_${window.location.hostname}`;
      chrome.storage.local.get(['currentSpeed', domain], (data) => {
        if (chrome.runtime.lastError) return;
        const savedSpeed = data[domain] || data.currentSpeed || 1.0;
        currentSpeed = Math.round(parseFloat(savedSpeed) * 100) / 100;
        applySpeedToAll();
      });
    } catch (e) {
      // Storage might not be available
    }
  }

  /**
   * Notify popup of current state
   */
  function notifyPopup() {
    try {
      chrome.runtime.sendMessage({
        type: 'SPEED_CHANGED',
        speed: currentSpeed,
        mediaCount: mediaElements.size,
      }).catch(() => {});
    } catch (e) {
      // Popup might be closed
    }
  }

  /**
   * Register a media element
   */
  function registerMedia(element) {
    if (!element || mediaElements.has(element)) return;

    mediaElements.add(element);
    applySpeed(element, currentSpeed);

    // Re-apply speed on various events (sites often reset playbackRate)
    const reapply = () => {
      if (mediaElements.has(element)) {
        applySpeed(element, currentSpeed);
      }
    };

    element.addEventListener('loadedmetadata', reapply);
    element.addEventListener('loadeddata', reapply);
    element.addEventListener('canplay', reapply);
    element.addEventListener('playing', reapply);
    element.addEventListener('seeked', reapply);
    element.addEventListener('ratechange', (e) => {
      // Only reapply if something else changed the rate
      if (Math.abs(element.playbackRate - currentSpeed) > 0.01) {
        setTimeout(reapply, 10);
      }
    });

    console.log('VelocityPlay: Registered media element', element.tagName, element.src || element.currentSrc);
    updateOverlay();
    notifyPopup();
  }

  /**
   * Scan page for media elements (deep scan)
   */
  function scanForMedia() {
    // Get all videos and audios in main document
    document.querySelectorAll('video, audio').forEach(registerMedia);

    // Also check shadow DOMs
    document.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) {
        el.shadowRoot.querySelectorAll('video, audio').forEach(registerMedia);
      }
    });

    // Check for videos in iframes we can access
    try {
      document.querySelectorAll('iframe').forEach((iframe) => {
        try {
          if (iframe.contentDocument) {
            iframe.contentDocument.querySelectorAll('video, audio').forEach(registerMedia);
          }
        } catch (e) {
          // Cross-origin iframe, can't access
        }
      });
    } catch (e) {
      // Ignore iframe errors
    }
  }

  /**
   * Create floating overlay
   */
  function createOverlay() {
    if (overlay || document.getElementById('velocityplay-overlay')) return;

    overlay = document.createElement('div');
    overlay.id = 'velocityplay-overlay';
    overlay.innerHTML = `
      <div class="vp-badge">
        <span class="vp-speed">${formatSpeed(currentSpeed)}×</span>
      </div>
      <div class="vp-controls">
        <button class="vp-btn vp-decrease" title="Slower (−0.25)">−</button>
        <input type="range" class="vp-slider" min="${SPEED_MIN}" max="4" step="0.05" value="${currentSpeed}">
        <button class="vp-btn vp-increase" title="Faster (+0.25)">+</button>
        <button class="vp-btn vp-reset" title="Reset to 1×">↺</button>
      </div>
    `;

    const badge = overlay.querySelector('.vp-badge');
    const controls = overlay.querySelector('.vp-controls');
    const slider = overlay.querySelector('.vp-slider');
    const decreaseBtn = overlay.querySelector('.vp-decrease');
    const increaseBtn = overlay.querySelector('.vp-increase');
    const resetBtn = overlay.querySelector('.vp-reset');

    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      controls.classList.toggle('vp-visible');
    });

    // Slider - updates in real-time while dragging
    slider.addEventListener('input', (e) => {
      e.stopPropagation();
      const speed = parseFloat(e.target.value);
      setSpeed(speed);
    });

    decreaseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      decreaseSpeed();
    });
    
    increaseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      increaseSpeed();
    });
    
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetSpeed();
    });

    overlay.addEventListener('click', (e) => e.stopPropagation());
    overlay.addEventListener('mousedown', (e) => e.stopPropagation());

    document.body.appendChild(overlay);
    updateOverlay();
  }

  /**
   * Update overlay display
   */
  function updateOverlay() {
    if (!overlay) return;

    const speedDisplay = overlay.querySelector('.vp-speed');
    const slider = overlay.querySelector('.vp-slider');

    if (speedDisplay) {
      speedDisplay.textContent = `${formatSpeed(currentSpeed)}×`;

      overlay.classList.remove('vp-slow', 'vp-normal', 'vp-fast', 'vp-extreme');
      if (currentSpeed < 1) {
        overlay.classList.add('vp-slow');
      } else if (currentSpeed === 1) {
        overlay.classList.add('vp-normal');
      } else if (currentSpeed <= 2) {
        overlay.classList.add('vp-fast');
      } else {
        overlay.classList.add('vp-extreme');
      }
    }

    if (slider) {
      slider.value = Math.min(currentSpeed, parseFloat(slider.max));
    }

    // Always show overlay if we have media
    overlay.style.display = mediaElements.size > 0 ? 'flex' : 'none';
  }

  /**
   * Setup keyboard shortcuts (in-page)
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Skip if in input field
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // Alt+D or Shift+D = faster
      // Alt+S or Shift+S = slower
      // Alt+R or Shift+R = reset
      if (e.altKey || e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'd' || key === '.') {
          increaseSpeed();
          e.preventDefault();
          e.stopPropagation();
        } else if (key === 's' || key === ',') {
          decreaseSpeed();
          e.preventDefault();
          e.stopPropagation();
        } else if (key === 'r') {
          resetSpeed();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, true);
  }

  /**
   * Listen for messages from popup/background
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Always do a fresh scan when popup asks for state
      if (message.type === 'GET_STATE') {
        scanForMedia();
      }

      switch (message.type) {
        case 'SET_SPEED':
          setSpeed(message.speed);
          sendResponse({ success: true, speed: currentSpeed, mediaCount: mediaElements.size });
          break;
        case 'GET_STATE':
          sendResponse({
            speed: currentSpeed,
            mediaCount: mediaElements.size,
          });
          break;
        case 'INCREASE_SPEED':
          increaseSpeed();
          sendResponse({ success: true, speed: currentSpeed, mediaCount: mediaElements.size });
          break;
        case 'DECREASE_SPEED':
          decreaseSpeed();
          sendResponse({ success: true, speed: currentSpeed, mediaCount: mediaElements.size });
          break;
        case 'RESET_SPEED':
          resetSpeed();
          sendResponse({ success: true, speed: currentSpeed, mediaCount: mediaElements.size });
          break;
        default:
          sendResponse({ success: false });
      }
      return true;
    });
  }

  /**
   * Watch for dynamically added media elements
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsScan = false;

      for (const mutation of mutations) {
        // Check added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            registerMedia(node);
          } else if (node.querySelectorAll) {
            const media = node.querySelectorAll('video, audio');
            media.forEach(registerMedia);
            if (media.length > 0) needsScan = true;
          }

          // Check shadow root
          if (node.shadowRoot) {
            node.shadowRoot.querySelectorAll('video, audio').forEach(registerMedia);
          }
        }

        // Check for attribute changes on video/audio (src changes)
        if (mutation.type === 'attributes' && mutation.target) {
          const target = mutation.target;
          if (target.tagName === 'VIDEO' || target.tagName === 'AUDIO') {
            registerMedia(target);
          }
        }
      }

      if (needsScan) {
        setTimeout(scanForMedia, 100);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'currentSrc'],
    });
  }

  /**
   * Initialize
   */
  function init() {
    console.log('VelocityPlay: Initializing...');
    
    loadSpeed();
    scanForMedia();
    setupKeyboardShortcuts();
    setupMessageListener();
    setupMutationObserver();

    // Create overlay after a short delay (let page settle)
    setTimeout(createOverlay, 500);

    // Periodic scan for stubborn players (YouTube, etc.)
    setInterval(() => {
      scanForMedia();
      applySpeedToAll(); // Re-apply in case sites reset speed
    }, 1500);

    console.log('VelocityPlay: Ready. Found', mediaElements.size, 'media elements');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
