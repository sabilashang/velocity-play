# VelocityPlay - Complete Specification Document

> Universal browser extension for precise video playback speed control (0.1x - 16x) with pitch preservation

---

## 🎯 1. Product Vision (Non-Technical)

**What it is:** A universal browser extension that enables precise playback speed control (0.1x - 16x) for any HTML5 video on the web while preserving natural audio pitch.

**Who it's for:**

| Persona | Pain Point |
|---------|------------|
| **Students & Learners** | Need to speed through lengthy lectures (2-3 hours) but YouTube caps at 2x and pitch distortion makes voices unintelligible |
| **Researchers & Professionals** | Review recorded meetings, webinars, and training videos efficiently; current tools don't work on Google Drive, Vimeo, or corporate platforms |
| **Content Creators** | Need to scrub through hours of footage quickly for reference; platform-specific controls are inconsistent and limited |

**Why it wins:**

1. **Universal Compatibility** - Works on ANY site with HTML5 video (YouTube, Drive, Vimeo, Netflix, Coursera, corporate LMS, etc.)
2. **Pitch Preservation** - Advanced audio processing maintains natural voice quality even at 4x+ speeds
3. **Granular Control** - 0.1x increments with keyboard shortcuts, scroll wheel support, and preset memory per domain

**Business Model:**

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 0.25x - 4x speed, basic shortcuts, 3 presets |
| **Pro** | $4.99/month or $29/year | 0.1x - 16x, unlimited presets, domain memory, pitch fine-tuning, frame-by-frame mode |
| **Lifetime** | $79 one-time | All Pro features forever |

---

## 📋 2. Complete Feature Inventory

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| **MVP** | Video detection on any page | P0 | [ ] |
| **MVP** | Speed control slider (0.25x - 4x) | P0 | [ ] |
| **MVP** | Pitch preservation algorithm | P0 | [ ] |
| **MVP** | Keyboard shortcuts (customizable) | P0 | [ ] |
| **MVP** | Floating mini-controller overlay | P0 | [ ] |
| **MVP** | Popup UI with current speed display | P0 | [ ] |
| **MVP** | Extension icon badge showing speed | P0 | [ ] |
| **MVP** | Remember speed per tab | P1 | [ ] |
| **Growth** | Extended range (0.1x - 16x) | P0 | [ ] |
| **Growth** | Domain-specific speed memory | P0 | [ ] |
| **Growth** | Custom preset speeds | P1 | [ ] |
| **Growth** | Scroll wheel speed control | P1 | [ ] |
| **Growth** | Skip silence detection | P1 | [ ] |
| **Growth** | Frame-by-frame navigation | P2 | [ ] |
| **Growth** | Pitch fine-tuning (±12 semitones) | P2 | [ ] |
| **Growth** | Dark/Light theme toggle | P2 | [ ] |
| **Scale** | License/subscription management | P0 | [ ] |
| **Scale** | Cross-browser sync (Chrome, Firefox, Edge) | P1 | [ ] |
| **Scale** | Statistics dashboard (time saved) | P2 | [ ] |
| **Scale** | Netflix/DRM video support | P2 | [ ] |
| **Scale** | Picture-in-picture speed control | P2 | [ ] |

**Total: 20 features across 3 phases**

---

## 🔧 3. Build Roadmap (Execution Order)

### Phase 1: MVP (Week 1-2)

1. **Extension scaffold** - Manifest V3, content script injection, popup shell
2. **Video detection system** - MutationObserver for dynamic video elements
3. **Core speed control** - HTMLMediaElement.playbackRate manipulation
4. **Pitch preservation** - Web Audio API with preservesPitch + AudioWorklet fallback
5. **Floating controller UI** - Shadow DOM isolated overlay
6. **Popup interface** - Speed slider, current speed, quick presets
7. **Keyboard shortcut system** - Configurable hotkeys with conflict detection
8. **Tab state management** - Background service worker for speed persistence

### Phase 2: Growth (Week 3-4)

1. **Extended speed range** - Buffer manipulation for 8x-16x stability
2. **Domain memory system** - IndexedDB storage with pattern matching
3. **Silence detection** - AudioContext analyzer for auto-skip
4. **Preset management** - Create/edit/delete custom speed presets
5. **Scroll wheel integration** - Modifier key + scroll for fine control
6. **Frame navigation** - Video.currentTime + requestVideoFrameCallback
7. **Pitch adjustment** - Real-time pitch shifting independent of speed
8. **Theme system** - CSS custom properties with system preference detection

### Phase 3: Scale (Week 5+)

1. **License server** - Gumroad/LemonSqueezy integration for Pro verification
2. **Browser sync** - Extension storage.sync API for cross-device settings
3. **Analytics dashboard** - Local statistics with optional cloud backup
4. **DRM handling** - Encrypted Media Extensions compatibility layer
5. **PiP integration** - Document Picture-in-Picture API hooks

---

## 💻 4. Technical Backend Blueprint

### Tech Stack

```
Extension: Manifest V3 + TypeScript + Vite
UI Framework: Preact (3KB) + Tailwind CSS
Audio Processing: Web Audio API + AudioWorklet
Storage: chrome.storage.local/sync + IndexedDB
Build: Vite + CRXJS plugin
Testing: Vitest + Playwright
License Server: Cloudflare Workers + KV Storage
Payments: LemonSqueezy (handles licensing)
```

### Extension Architecture

```
velocityplay/
├── manifest.json              # Extension manifest V3
├── src/
│   ├── background/
│   │   └── service-worker.ts  # State management, message routing
│   ├── content/
│   │   ├── detector.ts        # Video element detection
│   │   ├── controller.ts      # Speed control logic
│   │   ├── audio-processor.ts # Pitch preservation
│   │   ├── overlay.tsx        # Floating UI component
│   │   └── shortcuts.ts       # Keyboard handler
│   ├── popup/
│   │   ├── App.tsx            # Main popup UI
│   │   ├── SpeedSlider.tsx    # Range input component
│   │   └── PresetGrid.tsx     # Quick speed buttons
│   ├── options/
│   │   └── Settings.tsx       # Full settings page
│   ├── lib/
│   │   ├── storage.ts         # Storage abstraction
│   │   ├── messaging.ts       # Chrome runtime messaging
│   │   └── license.ts         # Pro feature gating
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── public/
│   ├── icons/                 # Extension icons
│   └── audio-worklet.js       # AudioWorklet processor
└── tests/
```

### Message Protocol (Background ↔ Content ↔ Popup)

```typescript
// Message Types
type Message =
  | { type: 'GET_SPEED'; tabId: number }
  | { type: 'SET_SPEED'; speed: number; tabId: number }
  | { type: 'GET_VIDEO_INFO'; tabId: number }
  | { type: 'TOGGLE_OVERLAY'; visible: boolean }
  | { type: 'SAVE_PRESET'; preset: SpeedPreset }
  | { type: 'CHECK_LICENSE'; key: string }

// Response Types
type Response<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Example: Set Speed
// Popup → Background
chrome.runtime.sendMessage({ type: 'SET_SPEED', speed: 2.5, tabId: 123 })

// Background → Content Script
chrome.tabs.sendMessage(tabId, { type: 'APPLY_SPEED', speed: 2.5 })

// Response
{ success: true, data: { appliedSpeed: 2.5, videoCount: 1 } }
```

### Storage Schema

```typescript
// chrome.storage.local
interface LocalStorage {
  // Current state
  tabSpeeds: Record<number, number>;        // { tabId: speed }
  
  // User preferences
  settings: {
    defaultSpeed: number;                    // 1.0
    showOverlay: boolean;                    // true
    overlayPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    overlayOpacity: number;                  // 0.8
    theme: 'light' | 'dark' | 'system';
    preservePitch: boolean;                  // true
    pitchAdjustment: number;                 // 0 (semitones, -12 to +12)
  };
  
  // Keyboard shortcuts
  shortcuts: {
    increaseSpeed: string;                   // 'D' or 'Shift+.'
    decreaseSpeed: string;                   // 'S' or 'Shift+,'
    resetSpeed: string;                      // 'R'
    toggleOverlay: string;                   // 'V'
    preset1: string;                         // '1'
    preset2: string;                         // '2'
    preset3: string;                         // '3'
  };
  
  // Custom presets
  presets: SpeedPreset[];
  
  // Domain memory
  domainSpeeds: Record<string, number>;      // { 'youtube.com': 1.5 }
  
  // Statistics
  stats: {
    totalTimeSaved: number;                  // seconds
    videosAccelerated: number;
    favoriteSpeed: number;
  };
}

interface SpeedPreset {
  id: string;
  name: string;
  speed: number;
  shortcut?: string;
}

// chrome.storage.sync (Pro users - synced across devices)
interface SyncStorage {
  licenseKey?: string;
  presets: SpeedPreset[];
  domainSpeeds: Record<string, number>;
  shortcuts: LocalStorage['shortcuts'];
}
```

### Audio Processing Pipeline

```typescript
// audio-processor.ts - Pitch Preservation Implementation

class PitchPreservingController {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private pitchShifter: AudioWorkletNode | null = null;
  
  async attach(video: HTMLVideoElement): Promise<void> {
    // Method 1: Native preservesPitch (preferred, widely supported)
    if ('preservesPitch' in video) {
      video.preservesPitch = true;
      return;
    }
    
    // Method 2: AudioWorklet for advanced pitch control
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('/audio-worklet.js');
    
    this.sourceNode = this.audioContext.createMediaElementSource(video);
    this.pitchShifter = new AudioWorkletNode(
      this.audioContext, 
      'pitch-shifter-processor'
    );
    
    this.sourceNode
      .connect(this.pitchShifter)
      .connect(this.audioContext.destination);
  }
  
  setPitch(semitones: number): void {
    // For users who want to adjust pitch independently
    this.pitchShifter?.port.postMessage({ 
      type: 'SET_PITCH', 
      semitones 
    });
  }
}

// audio-worklet.js - Runs in separate thread
class PitchShifterProcessor extends AudioWorkletProcessor {
  private pitchFactor = 1.0;
  
  process(inputs, outputs) {
    // Phase vocoder algorithm for pitch shifting
    // Preserves formants for natural voice quality
    const input = inputs[0];
    const output = outputs[0];
    
    for (let channel = 0; channel < input.length; channel++) {
      // Apply WSOLA (Waveform Similarity Overlap-Add)
      this.processChannel(input[channel], output[channel]);
    }
    
    return true;
  }
}
```

### License Verification API (Cloudflare Worker)

```typescript
// POST /api/verify-license
// Request
{ 
  licenseKey: string;
  machineId: string;  // Generated hash of browser fingerprint
}

// Response 200
{
  valid: true;
  tier: 'pro' | 'lifetime';
  expiresAt: string | null;  // ISO date or null for lifetime
  activations: number;
  maxActivations: number;
}

// Response 401
{
  valid: false;
  error: 'INVALID_KEY' | 'EXPIRED' | 'MAX_ACTIVATIONS';
}
```

---

## 🎨 5. Frontend Component Architecture

### Component Hierarchy

```
Extension/
├── Popup/
│   ├── App.tsx                    # Root with theme provider
│   ├── Header.tsx                 # Logo + Pro badge
│   ├── SpeedDisplay.tsx           # Large current speed number
│   ├── SpeedSlider.tsx            # Range input with tick marks
│   ├── PresetGrid.tsx             # 3x3 grid of speed buttons
│   ├── QuickActions.tsx           # Reset, remember, settings links
│   └── ProBanner.tsx              # Upgrade CTA (free users)
│
├── Overlay/ (Content Script)
│   ├── FloatingController.tsx     # Draggable mini UI
│   ├── SpeedBadge.tsx             # Compact speed indicator
│   ├── MiniSlider.tsx             # Inline speed adjustment
│   └── TooltipHint.tsx            # Keyboard shortcut hints
│
└── Options/
    ├── SettingsPage.tsx           # Full settings dashboard
    ├── ShortcutsEditor.tsx        # Keyboard binding UI
    ├── PresetManager.tsx          # Create/edit presets
    ├── DomainRules.tsx            # Per-site speed rules
    ├── AppearanceSettings.tsx     # Theme, overlay position
    └── LicenseManager.tsx         # Pro activation/status
```

### Key Component Specs

#### SpeedSlider.tsx

```typescript
interface SpeedSliderProps {
  value: number;                    // Current speed (0.1 - 16)
  onChange: (speed: number) => void;
  min?: number;                     // 0.25 (free) or 0.1 (pro)
  max?: number;                     // 4 (free) or 16 (pro)
  step?: number;                    // 0.25 (free) or 0.1 (pro)
  showTicks?: boolean;              // Show speed markers
  disabled?: boolean;
}

// State
{
  isDragging: boolean;
  hoverValue: number | null;
}

// Features
// - Logarithmic scale option for better UX at high speeds
// - Tick marks at common speeds (0.5, 1, 1.5, 2, 3, 4)
// - Value tooltip follows thumb
// - Keyboard arrow key support
// - Double-click to reset to 1x
```

#### FloatingController.tsx

```typescript
interface FloatingControllerProps {
  initialPosition: Position;
  onSpeedChange: (speed: number) => void;
  currentSpeed: number;
  videoElement: HTMLVideoElement;
}

// State
{
  position: { x: number; y: number };
  isDragging: boolean;
  isExpanded: boolean;              // Show full controls or just badge
  isVisible: boolean;
}

// Features
// - Shadow DOM isolation (no CSS conflicts)
// - Draggable with boundary constraints
// - Collapse to minimal badge on idle
// - Expand on hover/focus
// - Keyboard accessible
// - Z-index management for overlay stacking
```

#### PresetGrid.tsx

```typescript
interface PresetGridProps {
  presets: SpeedPreset[];
  currentSpeed: number;
  onSelect: (speed: number) => void;
  onEdit?: (preset: SpeedPreset) => void;  // Pro only
  isPro: boolean;
}

// Default presets (Free)
const defaultPresets = [
  { speed: 1.0, name: '1×', shortcut: '1' },
  { speed: 1.5, name: '1.5×', shortcut: '2' },
  { speed: 2.0, name: '2×', shortcut: '3' },
]

// Layout: 3-column grid, active preset highlighted
// Long-press to edit (Pro)
// Drag to reorder (Pro)
```

### UI Design System

```css
/* Design tokens - Dark theme (default) */
:root {
  /* Colors - Inspired by speed/velocity */
  --vp-bg-primary: #0f0f13;
  --vp-bg-secondary: #1a1a22;
  --vp-bg-tertiary: #252530;
  
  --vp-accent: #00d4ff;           /* Cyan - speed/energy */
  --vp-accent-hover: #00a8cc;
  --vp-accent-glow: rgba(0, 212, 255, 0.3);
  
  --vp-success: #00ff88;          /* Green - active/playing */
  --vp-warning: #ffaa00;          /* Orange - high speed */
  --vp-danger: #ff4466;           /* Red - extreme speed */
  
  --vp-text-primary: #ffffff;
  --vp-text-secondary: #888899;
  --vp-text-muted: #555566;
  
  /* Typography */
  --vp-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --vp-font-sans: 'Outfit', 'DM Sans', system-ui;
  
  /* Spacing */
  --vp-space-xs: 4px;
  --vp-space-sm: 8px;
  --vp-space-md: 16px;
  --vp-space-lg: 24px;
  
  /* Effects */
  --vp-radius-sm: 6px;
  --vp-radius-md: 10px;
  --vp-radius-lg: 16px;
  
  --vp-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --vp-glow: 0 0 20px var(--vp-accent-glow);
}

/* Speed indicator color scale */
.speed-badge {
  /* Dynamic color based on speed */
  --speed-color: color-mix(
    in oklch,
    var(--vp-success) calc((var(--speed) - 1) * -50%),
    var(--vp-danger) calc((var(--speed) - 1) * 25%)
  );
}
```

### Popup Layout (280px × 380px)

```
┌────────────────────────────────┐
│  ⚡ VelocityPlay         ⚙️   │  ← Header (logo + settings)
├────────────────────────────────┤
│                                │
│           2.5×                 │  ← Large speed display
│        ━━━━●━━━━               │  ← Slider (logarithmic)
│     0.25    1    2    4        │  ← Tick marks
│                                │
├────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐         │
│  │1.0×│ │1.5×│ │2.0×│         │  ← Preset buttons
│  └────┘ └────┘ └────┘         │
│  ┌────┐ ┌────┐ ┌────┐         │
│  │2.5×│ │3.0×│ │4.0×│         │
│  └────┘ └────┘ └────┘         │
├────────────────────────────────┤
│  ↺ Reset   📌 Remember domain  │  ← Quick actions
├────────────────────────────────┤
│  ⭐ Unlock 16× speed + more    │  ← Pro upsell (free users)
└────────────────────────────────┘
```

---

## 🔐 6. System Integration

| System | Service | Purpose |
|--------|---------|---------|
| **Payments** | LemonSqueezy | License keys, subscriptions, checkout |
| **License API** | Cloudflare Workers + KV | Key validation, activation tracking |
| **Analytics** | Plausible (privacy-first) | Install/uninstall, feature usage |
| **Error Tracking** | Sentry (browser extension SDK) | Crash reports, performance |
| **Updates** | Chrome Web Store / Firefox AMO | Auto-updates |
| **Support** | Crisp or plain email | User support channel |

### Browser Compatibility Matrix

| Browser | Support Level | Notes |
|---------|--------------|-------|
| Chrome 88+ | ✅ Full | Primary target, Manifest V3 |
| Edge 88+ | ✅ Full | Chromium-based, same codebase |
| Firefox 109+ | ✅ Full | Manifest V3 (limited), separate build |
| Safari 16.4+ | ⚠️ Partial | Web Extension API differences |
| Brave | ✅ Full | Chromium-based |
| Opera | ✅ Full | Chromium-based |

---

## 🧪 7. Quality Assurance

### Testing Matrix

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit | Vitest | 90% (core logic) |
| Component | Vitest + Testing Library | 80% |
| E2E | Playwright | All user flows |
| Cross-browser | BrowserStack | Chrome, Firefox, Edge |
| Performance | Lighthouse CI | No regression |

### Edge Cases (15+ Scenarios)

| # | Scenario | Solution |
|---|----------|----------|
| 1 | Video loads after page (SPA navigation) | MutationObserver watches for new video elements |
| 2 | Multiple videos on same page | Track all videos, apply speed to focused/playing one |
| 3 | Video in iframe (cross-origin) | Inject content script into iframes with `all_frames: true` |
| 4 | DRM-protected video (Netflix, Disney+) | Graceful fallback - speed only, no audio processing |
| 5 | Video element replaced (YouTube advancement) | Re-detect and re-attach on video src change |
| 6 | Page uses custom video player (Vimeo) | Target underlying HTMLVideoElement, not wrapper |
| 7 | Speed set before video loads | Queue speed setting, apply on `loadedmetadata` event |
| 8 | User has multiple tabs with videos | Per-tab state isolation in background worker |
| 9 | Extension disabled mid-playback | Cleanup: reset speed to 1x, disconnect audio nodes |
| 10 | Conflicting keyboard shortcuts | Conflict detection UI, allow per-site overrides |
| 11 | Very high speed (8x+) audio glitches | Buffer size adjustment, optional audio mute at 10x+ |
| 12 | License check fails (offline) | Cache valid license for 7 days, graceful degradation |
| 13 | Storage quota exceeded | LRU eviction for domain memory, warn user |
| 14 | Video paused/seeked while adjusting | Preserve speed across pause/seek/buffer states |
| 15 | Picture-in-Picture mode | Attach speed control to PiP window |
| 16 | YouTube Premium's speed UI conflict | Detect and optionally hide native controls |

### Test Sites Coverage

- YouTube (standard player)
- YouTube (embedded)
- Google Drive video player
- Vimeo
- Twitch (VODs)
- Netflix (DRM)
- Coursera / Udemy (LMS)
- Twitter/X video
- Reddit video
- Direct .mp4 files
- Custom HTML5 players

---

## 📊 8. Launch Success Metrics

### Week 1 Goals

- **500 installs** (Chrome Web Store)
- **4.5+ star rating** (minimum 10 reviews)
- **<1% uninstall rate**
- **60% weekly active users**

### Month 1 Goals

- **5,000 installs** across all browsers
- **2% Pro conversion rate** ($500+ MRR)
- **Average session: 3+ speed changes**
- **Top 3 sites: YouTube, Drive, Coursera**

### Technical Health

- **99.9% error-free sessions**
- **<50ms speed change latency**
- **<5MB memory footprint**
- **<100ms popup open time**

### Key Analytics Events

```typescript
// Track these events (privacy-respecting, no PII)
type AnalyticsEvent =
  | { event: 'extension_installed'; version: string }
  | { event: 'speed_changed'; speed: number; domain: string }
  | { event: 'preset_used'; presetId: string }
  | { event: 'shortcut_used'; shortcut: string }
  | { event: 'pro_upgraded'; plan: 'monthly' | 'yearly' | 'lifetime' }
  | { event: 'feature_gated'; feature: string }  // Pro feature attempted
```

---

## 🚀 9. Quick Start Commands

```bash
# Setup
git clone https://github.com/user/velocityplay
cd velocityplay
npm install

# Development
npm run dev              # Start Vite dev server with HMR
npm run build            # Production build
npm run build:firefox    # Firefox-specific build

# Testing
npm run test             # Unit tests
npm run test:e2e         # Playwright E2E
npm run test:coverage    # Coverage report

# Release
npm run package          # Create .zip for store submission
```

---

## 📝 10. Development Checklist

### MVP Checklist

- [ ] Project scaffold with Vite + CRXJS
- [ ] Manifest V3 configuration
- [ ] Content script injection
- [ ] Video element detection (MutationObserver)
- [ ] Speed control implementation
- [ ] Pitch preservation (preservesPitch API)
- [ ] Popup UI (Preact + Tailwind)
- [ ] Speed slider component
- [ ] Preset buttons
- [ ] Floating overlay controller
- [ ] Keyboard shortcuts system
- [ ] Background service worker
- [ ] Tab state management
- [ ] Extension icon badge
- [ ] Basic settings storage

### Growth Checklist

- [ ] Extended speed range (0.1x - 16x)
- [ ] Domain memory system
- [ ] Custom presets CRUD
- [ ] Scroll wheel speed control
- [ ] Silence detection algorithm
- [ ] Frame-by-frame navigation
- [ ] Independent pitch adjustment
- [ ] Theme system (light/dark/system)
- [ ] Options page
- [ ] Shortcut customization UI

### Scale Checklist

- [ ] LemonSqueezy integration
- [ ] License verification API
- [ ] Cross-browser sync
- [ ] Statistics dashboard
- [ ] DRM video handling
- [ ] PiP integration
- [ ] Firefox build configuration
- [ ] Chrome Web Store listing
- [ ] Firefox AMO listing
- [ ] Marketing site

---

*Last updated: January 2026*

