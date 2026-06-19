# 🔇 Profanity Muter — Chrome Extension

Auto-mutes cuss words while you stream on **Netflix, YouTube, Prime Video, Hotstar, Disney+, Zee5, SonyLIV, MX Player, Hulu, Max**, and more — with full support for **Hindi, English, Hinglish, Punjabi, Telugu, and internet slang**.

---

## ✨ Features

- 🎯 **Real-time subtitle monitoring** — reads the live subtitle/caption text as it appears on screen
- 🔇 **Instant audio mute** — uses Web Audio API `GainNode` for gapless, zero-latency muting
- 📡 **Netflix VTT look-ahead** — intercepts Netflix's subtitle file downloads to pre-schedule mutes with frame-level precision
- 🌐 **Multi-platform** — works on 13+ streaming platforms
- 🗣️ **Multi-language** — 400+ cuss words across English, Hindi (Devanagari + Latin), Hinglish, Punjabi, Telugu, internet slang
- 🎛️ **Adjustable sensitivity** — All / Moderate+ / Severe only
- 📊 **Live stats** — session mute count, all-time count, recently muted words (blurred)
- 🔔 **Badge counter** — extension icon shows how many mutes happened on current page

---

## 🚀 Installation (Developer Mode — No Account Needed)

1. **Download / clone this repo**
   ```
   git clone https://github.com/chad3456/dhurandhar-comics.git
   cd dhurandhar-comics/netflix-chrome-extension
   ```

2. **Open Chrome** → navigate to `chrome://extensions`

3. **Enable Developer Mode** (toggle in top-right corner)

4. Click **"Load unpacked"** → select the `netflix-chrome-extension` folder

5. The extension installs instantly — **no login, no account required**

6. Open Netflix (or any supported platform), start playing a video, **turn on subtitles**, and the extension handles the rest.

---

## 🔑 How It Works

### Subtitle DOM Observer (all platforms)
```
Video plays → Subtitle text appears in DOM
     ↓
MutationObserver fires on every subtitle change
     ↓
Text checked against 400+ word list (O(1) Set lookup)
     ↓
Cuss word found → GainNode.gain = 0 (instant mute)
Subtitle clears → GainNode.gain = 1 (unmute, +100ms buffer)
```

### Netflix VTT Look-Ahead (Netflix-specific)
```
Netflix fetches subtitle .vtt file (XHR/Fetch intercepted)
     ↓
VTT parser extracts all cue timecodes + text
     ↓
Cuss words pre-identified with exact start/end timestamps
     ↓
setInterval(80ms) checks video.currentTime against schedule
     ↓
Mute fires right at the timecode — frame-precise
```

### Audio Muting
- **Primary:** `AudioContext` + `GainNode` — gapless, no volume spike
- **Fallback:** `video.muted = true` — if AudioContext is blocked by CORS

---

## 🗂️ File Structure

```
netflix-chrome-extension/
├── manifest.json       # Chrome MV3 manifest
├── content.js          # Core muting engine (injected into streaming pages)
├── words.js            # 400+ cuss words: English, Hindi, Hinglish, Punjabi, Telugu
├── background.js       # Service worker — badge, stats, settings
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── generate_icons.js   # Icon generator script
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🌍 Supported Platforms

| Platform | Subtitle Method | Look-Ahead |
|----------|----------------|------------|
| Netflix | DOM + VTT Intercept | ✅ Yes |
| YouTube | DOM Observer | ❌ |
| Prime Video | DOM Observer | ❌ |
| Hotstar / JioCinema | DOM Observer | ❌ |
| Disney+ | DOM Observer | ❌ |
| Hulu | DOM Observer | ❌ |
| Max / HBO | DOM Observer | ❌ |
| Apple TV+ | DOM Observer | ❌ |
| SonyLIV | DOM Observer | ❌ |
| Zee5 | DOM Observer | ❌ |
| MX Player | DOM Observer | ❌ |
| Voot | DOM Observer | ❌ |

---

## 🔤 Word List Coverage

| Category | Words |
|----------|-------|
| English (severe/moderate/mild) | ~80 |
| Hindi Devanagari | ~60 |
| Hindi Latin (romanized) | ~80 |
| Hinglish / urban slang | ~50 |
| Punjabi | ~40 |
| Telugu / South Indian | ~30 |
| Internet / abbreviations | ~30 |
| **Total** | **370+** |

All words are matched with morphological awareness (handles plural `-s`, `-ed`, `-ing`, `-er`) and obfuscation patterns (`f*ck`, `sh!t`, `ch*tiya`, etc.).

---

## ⚠️ Important: Subtitles Must Be On

The extension **reads subtitles** to know when a cuss word is being spoken. If subtitles/captions are **off**, the extension cannot detect speech content. Always enable subtitles on the streaming platform.

**Recommended subtitle settings:**
- Netflix: Settings → Subtitles → English or Hindi
- YouTube: CC button → English or Hindi (Auto-generated works too)
- Prime: Subtitles button → English or Hindi

---

## 🛠️ Extending / Customizing

### Add more words
Edit `words.js` — add to any language array in `PROFANITY_LIST`. The engine auto-rebuilds on load.

### Add a new platform
1. Add the hostname to `SUBTITLE_SELECTORS` in `content.js`
2. Add `host_permissions` + `content_scripts` match to `manifest.json`

### Adjust mute timing
- `MUTE_PADDING_MS` in `content.js` (default 100ms) — extra silence after subtitle clears
- `SUBTITLE_PERSIST_MS` (default 2000ms) — max mute duration per subtitle line

---

## 🔒 Privacy

- **No data leaves your browser** — all processing is local
- **No account required** — ever
- **No network requests** — the extension makes zero outbound calls
- Word list is bundled locally in `words.js`

---

## 📦 Future Roadmap

- [ ] Support for more Indian languages (Tamil, Marathi, Bengali, Malayalam)
- [ ] Custom word list editor in popup
- [ ] Audio fingerprinting mode (mute without subtitles)
- [ ] Beep/silence toggle (replace mute with a beep sound)
- [ ] Per-platform on/off toggle
- [ ] Export mute log

---

## 📄 License

MIT — free to use, modify, and distribute.
