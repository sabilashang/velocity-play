# ⚡ VelocityPlay

Universal browser extension for precise video/audio playback speed control (0.25x - 4x) with **pitch preservation**.

Works on **any website** with HTML5 video or audio: YouTube, Google Drive, Vimeo, Coursera, Netflix, Twitch, and more.

## Features

- 🎯 **Universal** - Works on any HTML5 video/audio
- 🎵 **Pitch preserved** - Natural voice even at high speeds
- ⌨️ **Keyboard shortcuts** - Quick speed control
- 💾 **Remember per site** - Domain-specific speed memory
- 🎨 **Floating overlay** - On-video speed controls
- 🚀 **Lightweight** - No dependencies, minimal footprint

## Installation

### Chrome / Edge / Brave

1. Clone or download this repository
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `flash` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json`

## Usage

### Popup
Click the extension icon to open the speed control panel:
- **Slider** - Drag to set speed (0.25x - 4x)
- **Presets** - Click buttons for quick speeds
- **Reset** - Return to 1x
- **Remember** - Save speed for current website

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Shift + .` | Speed up (+0.25x) |
| `Shift + ,` | Slow down (-0.25x) |
| `Shift + /` | Reset to 1x |

### Floating Overlay
When a video is detected, a speed badge appears on screen:
- **Click badge** - Show/hide controls
- **Drag slider** - Adjust speed
- **Buttons** - Increase/decrease/reset

## Project Structure

```
flash/
├── manifest.json          # Extension manifest (V3)
├── background/
│   └── service-worker.js  # Keyboard commands, badge updates
├── content/
│   ├── content.js         # Video detection & speed control
│   └── overlay.css        # Floating controller styles
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
└── icons/                 # Extension icons
```

## How It Works

1. **Content script** injected into every page
2. **MutationObserver** watches for video/audio elements
3. **playbackRate** API controls speed
4. **preservesPitch** maintains natural audio
5. **chrome.storage** saves preferences

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 88+ | ✅ Full support |
| Edge 88+ | ✅ Full support |
| Firefox 109+ | ✅ Full support |
| Brave | ✅ Full support |
| Opera | ✅ Full support |

## License

MIT

