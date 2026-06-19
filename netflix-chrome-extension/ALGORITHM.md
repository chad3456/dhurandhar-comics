# 🔬 Algorithm & Detection Process

This document explains **how** Profanity Muter decides when to mute, the
trade-offs of the current approach, and the roadmap toward true audio-based
detection.

---

## 1. Current approach: **TEXT-BASED (subtitle-driven)**

The extension does **not** listen to the audio. It reads the **subtitle /
caption text** that the streaming platform renders, matches it against a
profanity word list, and mutes the `<video>` element around the timestamp of
any flagged line.

```
┌──────────────────────────────────────────────────────────────────┐
│                        DETECTION PIPELINE                          │
└──────────────────────────────────────────────────────────────────┘

  Streaming platform                Extension
  ──────────────────                ─────────

  Subtitle file (.vtt) ──intercept──▶  VTT parser ──▶ cue list
       │                                                  │
       │                                          containsProfanity()
       │                                                  │
       ▼                                                  ▼
  Caption renders in DOM ──observe──▶  MutationObserver ─▶ flagged?
       │                                                  │
       │                                                  ▼
       │                                          build MUTE SCHEDULE
       │                                          [{start,end,word}, …]
       ▼                                                  │
  video.currentTime ◀───poll(60ms)──────────────────────┘
       │
       ▼
  t inside a flagged window?  ──▶  muteAudio()   (gain=0 + video.muted)
  t outside all windows?      ──▶  unmuteAudio() (gain=1 + unmute)
```

### Two detection paths run together (belt-and-suspenders)

| Path | Used on | How it works | Timing |
|------|---------|--------------|--------|
| **A. VTT / TextTrack look-ahead** | Netflix (fetch intercept) + any platform exposing native `TextTrack` cues | Parse the **entire** subtitle file up front. Each cue has `startTime`/`endTime`. Pre-compute a schedule of "mute windows". A 60 ms polling loop mutes **before** each flagged cue. | **Proactive** — mutes *ahead* of the word |
| **B. DOM MutationObserver** | All platforms (fallback) | Watch the subtitle container. When its text changes, check it and mute. | **Reactive** — mutes *as* the word appears |

Path A is strongly preferred because it can mute **before** the word is even
spoken. Path B is the safety net for platforms where we can't read the cue
file (DRM-wrapped sidecar subtitles, canvas-rendered captions, etc.).

---

## 2. Timing: how we stop the first syllable leaking

Reactive muting (Path B alone) has an inherent problem: by the time the
subtitle text appears and we react, the first ~50–150 ms of the word has
already played. Three fixes address this:

1. **PRE_ROLL_MS = 250 ms** — flagged mute windows start a quarter-second
   **before** the cue's official `startTime`. Audio often leads the caption
   slightly; pre-rolling guarantees we're already silent when the word hits.
2. **Instant gain cut** — we use `GainNode.gain.setValueAtTime(0, …)` (a hard
   cut), **not** `setTargetAtTime` (which ramps over ~30 ms and leaked the
   attack of the word).
3. **Dual mute** — we set **both** the Web Audio `GainNode` to 0 **and**
   `video.muted = true`. On Netflix/Prime the audio is DRM/EME-protected and
   cannot be routed through Web Audio at all, so `video.muted` is the real
   workhorse there; the GainNode handles platforms that allow routing.

`MUTE_PADDING_MS = 120 ms` keeps silence slightly **after** the cue ends so
trailing audio doesn't leak either.

---

## 3. Word matching: 4 layers (why `madarchod` now always catches)

The earlier build missed romanized Hindi slurs because it only did **exact
token** matching — but subtitles spell these words a dozen ways
(`madarchod`, `maderchod`, `madarchodd`, `madar chod`, `m@d@rchod`). The
matcher now runs **four layers**, fastest/most-precise first:

```
containsProfanity(text):
  1. PHRASE     →  multi-word matches ("son of a bitch", "teri maa ki")
  2. EXACT      →  tokenize on spaces/punct, O(1) Set lookup
                   (+ English morphology: -s, -ed, -ing, -er)
  3. OBFUSCATED →  word-boundaried regex (f*ck, sh!t, ch*tiya, \brandi\b)
  4. PHONETIC   →  normalize the whole line, substring-match LONG slur roots
```

### Layer 4 — phonetic normalization (the key fix)

`normalizePhonetic()` collapses spelling variation so the subtitle's spelling
and our list's spelling converge:

| Step | Example |
|------|---------|
| strip non-letters (kills spaces/leetspeak separators) | `madar chod` → `madarchod`, `ch.u.t.i.y.a` → `chutiya` |
| leetspeak → letters | `m@d@rchod` → `madarchod` |
| collapse repeats | `madarchodd` → `madarchod`, `fuuuck` → `fuck` |
| fold romanized variants | `aa→a, ee→i, oo→u, ph→f, w→v, dh→d, th→t, bh→b, ck→k, ch→c` |

The normalized text is then scanned for normalized slur **roots**
(`madarchod`, `behenchod`, `bhosdik`, `chutiya`, `haramzad`, …).

> ⚠️ **Why only LONG roots (≥6 chars) use phonetic substring matching:**
> normalization removes word boundaries, so a short root like `rand` would
> fire inside *random* / *grandeur*, and `ass` inside *class* / *grass*.
> Short slurs are therefore caught by the exact + **word-boundaried** regex
> layers instead. This gives **0 false positives** on a guard set of
> innocent look-alike words while still catching every long compound slur.

---

## 4. ⚠️ The limitation you raised: text ≠ audio

**You are exactly right.** A subtitle-driven approach is blind whenever the
caption text doesn't match the spoken audio. Concretely it fails when:

| Scenario | Why text-based misses it |
|----------|--------------------------|
| **Subtitles OFF** | No text to read at all → nothing gets muted. |
| **Censored subtitles** | Caption shows "f***" or "[expletive]" but audio says the full word. (We *do* catch `f***`-style via regex, but `[expletive]` gives no signal about what was said.) |
| **Sanitized / dubbed mismatch** | Translated subtitle is clean but original audio is profane (or vice-versa). |
| **Improvised / ad-libbed lines** | Spoken profanity that was never in the subtitle file. |
| **Songs / background dialogue** | Often not subtitled. |
| **Wrong subtitle language** | Hindi audio + English subs (or none) → Hindi slurs unscored. |

For the **current** release, the mitigation is: **enable subtitles in the
language of the audio** (Hindi audio → Hindi subs). That keeps text and audio
aligned and the matcher catches the rest.

---

## 5. Roadmap: toward **SOUND-BASED** detection (hybrid)

True robustness needs to listen to the audio itself. The plan is a **hybrid**
that keeps the cheap text path and adds an audio path:

### Phase 1 — Text-based (✅ shipped, this build)
Subtitle/VTT matching with phonetic normalization and look-ahead muting.

### Phase 2 — On-device speech-to-text (ASR)
- Tap the media audio via `AudioContext` → `MediaElementSource` (already wired
  up) → `AudioWorklet` to grab raw PCM.
- Run a lightweight streaming ASR model **in the browser** (e.g.
  **whisper.cpp / whisper-web (WASM)** or **Vosk-browser**) on a rolling ~2 s
  buffer.
- Feed the live transcript into the **same `containsProfanity()`** matcher.
- This removes the dependency on subtitles entirely.
- Cost: CPU-heavy; needs a small Hindi+English model (~40–75 MB) and a Web
  Worker so the UI/video don't stutter. Latency target < 300 ms with a
  look-back buffer so we can still mute fast.

### Phase 3 — Phonetic audio keyword spotting (KWS)
- Instead of full transcription, run a **keyword-spotting** model trained only
  on the profanity set (much smaller/faster than full ASR).
- Acts as a real-time "trigger" that mutes the instant a banned phoneme
  sequence is detected — works even with no subtitles and on songs.
- Hindi profanity has distinctive phoneme clusters
  (e.g. *bhen-chod*, *ma-dar-chod*) that KWS handles well.

### Phase 4 — Fusion
- Run text (Phase 1) **and** audio KWS (Phase 3) together.
- Text path gives look-ahead (mute *before* the word); audio path catches
  anything the subtitles missed. A mute fires if **either** path flags the
  window. Confidence from both sources reduces false positives.

```
        ┌─────────────┐
 subs ─▶│ TEXT MATCH  │─┐
        └─────────────┘ │     ┌──────────┐
                        ├────▶│  MUTE if │──▶ video
        ┌─────────────┐ │     │  EITHER  │
 audio─▶│ AUDIO KWS   │─┘     └──────────┘
        └─────────────┘
```

> **Why not Phase 3 today?** Browser-based real-time Hindi ASR/KWS is the
> heavy part — it needs a bundled WASM model, an `AudioWorklet`, a Web Worker,
> and careful latency tuning so playback stays smooth. The audio tap
> (`AudioContext` + `MediaElementSource`) is **already in place** in
> `content.js`, so Phase 2/3 slot directly onto the existing pipeline without
> re-architecting.

---

## 6. Tuning constants (in `content.js`)

| Constant | Default | Effect |
|----------|---------|--------|
| `PRE_ROLL_MS` | 250 | How early (ms) to mute before a flagged cue. ↑ = safer, more over-mute. |
| `MUTE_PADDING_MS` | 120 | Silence held after a cue ends. |
| `SUBTITLE_PERSIST_MS` | 2000 | Max hold for the reactive DOM path if text never clears. |
| native poll interval | 60 ms | Look-ahead schedule resolution. ↓ = tighter edges, more CPU. |

## 7. Matching constants (in `words.js`)

| Knob | Where | Effect |
|------|-------|--------|
| phonetic root min length | `NORMALIZED_ROOTS` filter (`>= 6`) | Guards against short-root false positives. |
| `normalizePhonetic()` fold rules | `words.js` | Add mappings here for new transliteration styles. |
| `severeRoots` | `buildProfanityEngine()` | Add long compound slurs for fuzzy matching. |
| `PROFANITY_LIST` | `words.js` | The master word list per language. |
