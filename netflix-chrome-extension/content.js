// ============================================================
// SHASHN PROFANITY MUTER — Content Script
// Works on: Netflix, YouTube, Prime Video, Disney+, Hotstar,
//           Apple TV+, Hulu, HBO Max, and any video page
// ============================================================
// Strategy:
//   1. Observe subtitle DOM nodes (MutationObserver)
//   2. When cuss word detected → mute video element
//   3. Unmute when subtitle clears or changes to clean text
//   4. Fall-back: intercept subtitle track cues for look-ahead
// ============================================================

(function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────
  let muteTimer = null;
  let isMuted = false;
  let lastSubtitle = '';
  let muteCount = 0;
  let enabled = true;
  let subtitleObserver = null;
  let videoObserver = null;
  const MUTE_PADDING_MS = 100; // extra ms of silence after subtitle ends
  const SUBTITLE_PERSIST_MS = 2000; // how long to hold mute if subtitle doesn't change

  // ── PLATFORM DETECTION ───────────────────────────────────
  const PLATFORM = detectPlatform();

  function detectPlatform() {
    const h = location.hostname;
    if (h.includes('netflix.com'))         return 'netflix';
    if (h.includes('youtube.com'))         return 'youtube';
    if (h.includes('primevideo.com') ||
        h.includes('amazon.com/video'))    return 'prime';
    if (h.includes('hotstar.com') ||
        h.includes('jiocinema.com'))       return 'hotstar';
    if (h.includes('disneyplus.com'))      return 'disney';
    if (h.includes('hulu.com'))            return 'hulu';
    if (h.includes('hbomax.com') ||
        h.includes('max.com'))             return 'max';
    if (h.includes('apple.com/') ||
        h.includes('tv.apple.com'))        return 'appletv';
    if (h.includes('sonyliv.com'))         return 'sonyliv';
    if (h.includes('zee5.com'))            return 'zee5';
    if (h.includes('mxplayer.in'))         return 'mxplayer';
    if (h.includes('voot.com'))            return 'voot';
    return 'generic';
  }

  // Platform-specific subtitle container selectors (multiple fallbacks)
  const SUBTITLE_SELECTORS = {
    netflix: [
      '.player-timedtext',
      '.player-timedtext-text-container',
      '[class*="timedtext"]',
      '[class*="subtitle"]',
      '.watch-video--bottom-controls-container [class*="text"]',
    ],
    youtube: [
      '.ytp-caption-segment',
      '.caption-window',
      '.captions-text',
      '[class*="caption"]',
    ],
    prime: [
      '.atvwebplayersdk-captions-text',
      '[class*="captions"]',
      '[class*="subtitle"]',
      '.injectedSubtitleText',
    ],
    hotstar: [
      '.sub-text',
      '.subtitle-container',
      '[class*="subtitle"]',
      '[class*="caption"]',
      '.subtitles',
    ],
    disney: [
      '.clpp-subtitles-text',
      '[class*="subtitle"]',
      '[class*="caption"]',
    ],
    hulu: [
      '.caption-text-box',
      '[class*="caption"]',
      '[class*="subtitle"]',
    ],
    max: [
      '[class*="caption"]',
      '[class*="subtitle"]',
      '.text-element',
    ],
    appletv: [
      '[class*="subtitle"]',
      '[class*="caption"]',
    ],
    sonyliv: [
      '.subtitle',
      '[class*="subtitle"]',
      '[class*="caption"]',
    ],
    zee5: [
      '[class*="subtitle"]',
      '[class*="caption"]',
      '.sub-text',
    ],
    mxplayer: [
      '[class*="subtitle"]',
      '[class*="caption"]',
    ],
    voot: [
      '[class*="subtitle"]',
      '[class*="caption"]',
    ],
    generic: [
      'track',
      '[class*="subtitle"]',
      '[class*="caption"]',
      '.vjs-text-track-cue',
      '.shaka-text-container',
    ],
  };

  // ── FIND VIDEO ELEMENT ────────────────────────────────────
  function getVideoElement() {
    // Try the most common locations
    const v = document.querySelector('video');
    if (v) return v;
    // Some platforms put it in shadow DOM
    const players = document.querySelectorAll('[class*="player"], [id*="player"]');
    for (const p of players) {
      const vi = p.querySelector('video');
      if (vi) return vi;
    }
    return null;
  }

  // ── AUDIO CONTEXT MUTE (precise) ────────────────────────
  // We use AudioContext gain node for instant, gapless muting
  let audioCtx = null;
  let gainNode = null;
  let sourceNode = null;
  let videoEl = null;

  function setupAudioContext(video) {
    if (audioCtx && sourceNode) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 1;
      gainNode.connect(audioCtx.destination);
      sourceNode = audioCtx.createMediaElementSource(video);
      sourceNode.connect(gainNode);
      videoEl = video;
      return true;
    } catch (e) {
      // AudioContext may fail if video is cross-origin; fall back to .muted
      console.warn('[ProfanityMuter] AudioContext failed, using .muted fallback:', e.message);
      return false;
    }
  }

  function muteAudio(video) {
    if (!video) return;
    if (gainNode) {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
    } else {
      video.muted = true;
    }
    isMuted = true;
  }

  function unmuteAudio(video) {
    if (!video) return;
    if (gainNode) {
      gainNode.gain.setTargetAtTime(1, audioCtx.currentTime, 0.02);
    } else {
      video.muted = false;
    }
    isMuted = false;
  }

  // ── MUTE LOGIC ───────────────────────────────────────────
  function handleSubtitleText(text, video) {
    if (!enabled) return;
    if (!text || text.trim() === '') {
      // Subtitle cleared — schedule unmute with small buffer
      scheduledUnmute(video, MUTE_PADDING_MS);
      return;
    }

    const check = containsProfanity(text);
    if (check.found) {
      if (!isMuted) {
        muteAudio(video);
        muteCount++;
        notifyBackground({ type: 'MUTED', word: check.word, count: muteCount });
      }
      // Reset the hold timer
      clearTimeout(muteTimer);
      muteTimer = setTimeout(() => unmuteAudio(video), SUBTITLE_PERSIST_MS);
    } else {
      // Clean subtitle — unmute if we were muted
      scheduledUnmute(video, MUTE_PADDING_MS);
    }
    lastSubtitle = text;
  }

  function scheduledUnmute(video, delay) {
    clearTimeout(muteTimer);
    muteTimer = setTimeout(() => {
      if (isMuted) unmuteAudio(video);
    }, delay);
  }

  // ── SUBTITLE OBSERVER ────────────────────────────────────
  function getSubtitleSelectors() {
    return (SUBTITLE_SELECTORS[PLATFORM] || []).concat(SUBTITLE_SELECTORS.generic);
  }

  function findSubtitleContainer() {
    for (const sel of getSubtitleSelectors()) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function startSubtitleObserver(video) {
    if (subtitleObserver) subtitleObserver.disconnect();

    const observe = (container) => {
      subtitleObserver = new MutationObserver(() => {
        const text = container.textContent || container.innerText || '';
        handleSubtitleText(text.trim(), video);
      });
      subtitleObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false,
      });
      console.log(`[ProfanityMuter] Observing subtitles on ${PLATFORM}:`, container);
    };

    const container = findSubtitleContainer();
    if (container) {
      observe(container);
      return;
    }

    // Container not yet in DOM — watch for it
    const bodyObserver = new MutationObserver((mutations, obs) => {
      const found = findSubtitleContainer();
      if (found) {
        obs.disconnect();
        observe(found);
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ── NATIVE TRACK CUE INTERCEPT (look-ahead) ──────────────
  // For platforms that use native <track> elements, we can read
  // TextTrack cue events and mute slightly before speech.
  function hookNativeTextTracks(video) {
    if (!video || !video.textTracks) return;

    const hookTrack = (track) => {
      track.oncuechange = () => {
        const activeCues = track.activeCues;
        if (!activeCues || activeCues.length === 0) {
          scheduledUnmute(video, MUTE_PADDING_MS);
          return;
        }
        for (let i = 0; i < activeCues.length; i++) {
          const cueText = activeCues[i].text || '';
          // Strip VTT tags like <c.colorCCCC00> etc.
          const cleaned = cueText.replace(/<[^>]+>/g, '').trim();
          handleSubtitleText(cleaned, video);
        }
      };
    };

    for (let i = 0; i < video.textTracks.length; i++) {
      hookTrack(video.textTracks[i]);
    }

    video.textTracks.onaddtrack = (e) => {
      if (e.track) hookTrack(e.track);
    };
  }

  // ── VIDEO WATCHER ─────────────────────────────────────────
  function initWithVideo(video) {
    if (!video) return;
    videoEl = video;

    // Try AudioContext; if it fails we still continue with .muted
    setupAudioContext(video);

    // Hook native text tracks
    hookNativeTextTracks(video);

    // Also observe subtitle DOM (belt-and-suspenders)
    startSubtitleObserver(video);

    // Resume AudioContext on user interaction (Chrome requires it)
    const resume = () => {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    };
    video.addEventListener('play', resume, { once: false });
    document.addEventListener('click', resume, { once: true });
  }

  // Watch for video element appearing in DOM
  function watchForVideo() {
    const video = getVideoElement();
    if (video) { initWithVideo(video); return; }

    videoObserver = new MutationObserver((mutations, obs) => {
      const v = getVideoElement();
      if (v) { obs.disconnect(); initWithVideo(v); }
    });
    videoObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ── NETFLIX SPECIFIC: XHR/FETCH INTERCEPTION ─────────────
  // Netflix fetches WebVTT subtitle files. We intercept them to
  // build a look-ahead schedule so mutes happen right on time.
  if (PLATFORM === 'netflix') {
    const muteSchedule = []; // { startTime, endTime, word }

    function parseVTT(vttText, video) {
      // Basic VTT cue parser
      const lines = vttText.split('\n');
      let i = 0;
      while (i < lines.length) {
        // Timecode line: 00:01:23.456 --> 00:01:25.789
        const tcMatch = lines[i].match(
          /(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/
        );
        if (tcMatch) {
          const start = vttTimeToSeconds(tcMatch[1]);
          const end   = vttTimeToSeconds(tcMatch[2]);
          // Collect cue lines
          i++;
          let cueText = '';
          while (i < lines.length && lines[i].trim() !== '') {
            cueText += ' ' + lines[i].trim();
            i++;
          }
          cueText = cueText.replace(/<[^>]+>/g, '').trim();
          const check = containsProfanity(cueText);
          if (check.found) {
            muteSchedule.push({ start, end: end + MUTE_PADDING_MS / 1000, word: check.word });
          }
        }
        i++;
      }
      // Sort schedule by start time
      muteSchedule.sort((a, b) => a.start - b.start);
      scheduleVTTMutes(video || getVideoElement());
    }

    function vttTimeToSeconds(ts) {
      const [h, m, s] = ts.replace(',', '.').split(':').map(parseFloat);
      return h * 3600 + m * 60 + s;
    }

    let vttCheckInterval = null;
    function scheduleVTTMutes(video) {
      if (!video) return;
      clearInterval(vttCheckInterval);
      vttCheckInterval = setInterval(() => {
        if (!enabled) return;
        const t = video.currentTime;
        for (const entry of muteSchedule) {
          if (t >= entry.start && t <= entry.end) {
            if (!isMuted) {
              muteAudio(video);
              muteCount++;
              notifyBackground({ type: 'MUTED', word: entry.word, count: muteCount });
            }
            return;
          }
        }
        if (isMuted) unmuteAudio(video);
      }, 80); // check every 80ms
    }

    // Intercept XHR
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener('load', function () {
        if (this._url && (this._url.includes('.vtt') || this._url.includes('subtitles') ||
            this._url.includes('timedtexts') || this._url.includes('dfxp'))) {
          try { parseVTT(this.responseText); } catch (e) {}
        }
      });
      return origSend.apply(this, arguments);
    };

    // Intercept Fetch
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      return origFetch.apply(this, arguments).then(response => {
        if (url.includes('.vtt') || url.includes('subtitles') ||
            url.includes('timedtexts') || url.includes('dfxp')) {
          response.clone().text().then(text => {
            try { parseVTT(text); } catch (e) {}
          });
        }
        return response;
      });
    };
  }

  // ── COMMUNICATION WITH EXTENSION ─────────────────────────
  function notifyBackground(msg) {
    try {
      chrome.runtime.sendMessage(msg);
    } catch (e) {}
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SET_ENABLED') {
      enabled = msg.enabled;
      if (!enabled && isMuted) {
        const v = getVideoElement();
        if (v) unmuteAudio(v);
      }
    }
    if (msg.type === 'GET_STATUS') {
      chrome.runtime.sendMessage({
        type: 'STATUS',
        enabled,
        muteCount,
        platform: PLATFORM,
      });
    }
  });

  // ── INIT ──────────────────────────────────────────────────
  function init() {
    console.log(`[ProfanityMuter] Loaded on ${PLATFORM} (${location.hostname})`);
    watchForVideo();

    // Re-check if navigation happens in SPA (Netflix, YouTube)
    let lastUrl = location.href;
    const navObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Reset and re-init after page transition
        setTimeout(() => {
          muteCount = 0;
          isMuted = false;
          lastSubtitle = '';
          if (subtitleObserver) subtitleObserver.disconnect();
          audioCtx = null; gainNode = null; sourceNode = null;
          watchForVideo();
        }, 1500);
      }
    });
    navObserver.observe(document, { subtree: true, childList: true });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
