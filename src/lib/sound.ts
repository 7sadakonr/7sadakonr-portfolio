// Synthesized UI sounds (Web Audio, no assets). Soft, rounded, low-passed tones
// through a shared master chain with a touch of air. Silent until the user has
// interacted with the page.

let ctx: AudioContext | null = null
let master: AudioNode | null = null
let lastPlayedAt = 0
let lastWhiskAt = 0

// Condensed "Jingle Bells" hook, semitones above C: E E E G C D E F E D G.
const JINGLE = [4, 4, 4, 7, 0, 2, 4, 5, 4, 2, 7]
const MUTE_KEY = 'sound-muted'

const isMuted = () => {
  try {
    if (window.localStorage.getItem(MUTE_KEY) === '1') return true
  } catch { /* storage unavailable */ }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

const buildMaster = (c: AudioContext) => {
  const input = c.createGain()
  input.gain.value = 0.9
  const tone = c.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 5200
  tone.Q.value = 0.5
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -24
  comp.ratio.value = 3
  // Subtle short echo for "air".
  const delay = c.createDelay(0.2)
  delay.delayTime.value = 0.07
  const feedback = c.createGain()
  feedback.gain.value = 0.28
  const wet = c.createGain()
  wet.gain.value = 0.18
  input.connect(tone)
  tone.connect(comp)
  tone.connect(delay)
  delay.connect(feedback).connect(delay)
  delay.connect(wet).connect(comp)
  comp.connect(c.destination)
  return input
}

const ensureContext = (): AudioContext | null => {
  if (typeof window === 'undefined' || isMuted()) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
      master = buildMaster(ctx)
    }
    return ctx
  } catch {
    return null
  }
}

/**
 * Run `fn` once the context is running. `resume()` is async, so the first sound after a
 * reload used to be dropped; now it waits (briefly) for the unlock instead. Gives up after
 * 400ms so stale sounds never fire later when no user gesture has unlocked audio.
 */
const whenReady = (fn: (c: AudioContext) => void) => {
  if (document.hidden) return
  const c = ensureContext()
  if (!c) return
  if (c.state === 'running') return fn(c)
  const requestedAt = performance.now()
  c.resume().then(() => {
    if (c.state === 'running' && performance.now() - requestedAt < 400) fn(c)
  }).catch(() => {})
}

// --- Audio files (public/sounds). Missing/failed files fall back to synthesized tones. ---
const SOUND_FILES = {
  tick: '/sounds/tick.mp3',
  open: '/sounds/open.mp3',
  nav: '/sounds/nav.mp3',
} as const
type SoundName = keyof typeof SOUND_FILES
const buffers: Partial<Record<SoundName, AudioBuffer | null>> = {}
let preloadStarted = false

const preload = (c: AudioContext) => {
  if (preloadStarted) return
  preloadStarted = true
  ;(Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
    fetch(SOUND_FILES[name])
      .then((res) => (res.ok && /audio|octet/.test(res.headers.get('content-type') ?? '') ? res.arrayBuffer() : Promise.reject(new Error('no file'))))
      .then((data) => c.decodeAudioData(data))
      .then((buf) => { buffers[name] = buf })
      .catch(() => { buffers[name] = null })
  })
}

const playFile = (c: AudioContext, name: SoundName, gain: number, rate = 1): boolean => {
  const buf = buffers[name]
  if (!buf || !master) return false
  const src = c.createBufferSource()
  const g = c.createGain()
  src.buffer = buf
  src.playbackRate.value = rate
  g.gain.value = gain
  src.connect(g).connect(master)
  src.start()
  return true
}

/**
 * Unlock audio on the first user gesture (pointer/key/touch) and start preloading files.
 * Scrolling is not a gesture, so without this project sounds stay silent after a reload.
 */
export const primeAudio = () => {
  const c = ensureContext()
  if (!c) return
  if (c.state !== 'running') void c.resume().catch(() => {})
  preload(c)
}

if (typeof window !== 'undefined') {
  const unlock = () => primeAudio()
  const opts = { capture: true, passive: true } as const
  ;(['pointerdown', 'keydown', 'touchend'] as const).forEach((type) => window.addEventListener(type, unlock, opts))
  const reresume = () => { if (ctx && ctx.state !== 'running' && !document.hidden) void ctx.resume().catch(() => {}) }
  document.addEventListener('visibilitychange', reresume)
  window.addEventListener('pageshow', reresume)
}

/** Gain node with a soft attack and exponential decay, routed to the master bus. */
const envelope = (c: AudioContext, peak: number, attack: number, duration: number) => {
  const gain = c.createGain()
  const t = c.currentTime
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  gain.connect(master as AudioNode)
  return gain
}

const partial = (c: AudioContext, freq: number, endFreq: number, level: number, duration: number, out: AudioNode) => {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t = c.currentTime
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration)
  gain.gain.value = level
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + duration + 0.03)
}

/** Soft rounded tap for buttons and links. Skipped if a sound just played. */
export const playTick = () => {
  if (performance.now() - lastPlayedAt < 80) return
  lastPlayedAt = performance.now()
  whenReady((c) => {
    if (playFile(c, 'tick', 0.55)) return
    const out = envelope(c, 0.07, 0.003, 0.07)
    partial(c, 700, 420, 1, 0.07, out)
    partial(c, 1400, 900, 0.14, 0.04, out)
  })
}

/**
 * One deep, soft bell-like note per project item opening. Pitch follows a condensed "Jingle
 * Bells" hook (E E E G C D E F E D G, as semitones above C) cycling with the project index.
 * Rounded sine body + sub with only a faint glassy overtone, to sit with the other UI sounds.
 */
export const playWisp = (index = 0) => {
  // Navigation / lens hover already played their own sound for this action.
  if (performance.now() - lastWhiskAt < 450) return
  lastPlayedAt = performance.now()
  whenReady((c) => {
    const step = JINGLE[((index % JINGLE.length) + JINGLE.length) % JINGLE.length] ?? 0
    if (playFile(c, 'open', 0.6, 2 ** (step / 12))) return
    const f = 261.63 * 2 ** (step / 12) // C4 up: deep, rounded
    const out = envelope(c, 0.075, 0.012, 0.95)
    partial(c, f, f, 1, 0.9, out) // soft sine body
    partial(c, f / 2, f / 2, 0.4, 0.85, out) // warm sub
    partial(c, f * 2, f * 2, 0.16, 0.5, out) // octave bloom
    partial(c, f * 2.76, f * 2.76, 0.07, 0.3, out) // faint glassy bell hint
    partial(c, f * 5.4, f * 5.4, 0.015, 0.12, out)
  })
}

/**
 * Command menu opening: a low liquid-glass swell. Rises slowly with the shell spring, with a
 * faint glassy overtone that blooms and fades. (Fire from the user's click/keypress.)
 */
export const playMenuOpen = () => {
  lastPlayedAt = performance.now()
  whenReady((c) => {
    const out = envelope(c, 0.1, 0.14, 0.55)
    partial(c, 110, 210, 1, 0.5, out)
    partial(c, 165, 315, 0.5, 0.5, out)
    partial(c, 660, 840, 0.05, 0.4, out)
  })
}

/** Reverse swell: quicker and falling, as the menu settles back into the island. */
export const playMenuClose = () => {
  // Navigating from the menu already played its own sound.
  if (performance.now() - lastPlayedAt < 300) return
  lastPlayedAt = performance.now()
  whenReady((c) => {
    const out = envelope(c, 0.07, 0.03, 0.3)
    partial(c, 230, 120, 1, 0.28, out)
    partial(c, 345, 180, 0.4, 0.28, out)
  })
}

/** Soft, rounded low pillow-tap for moving between views (navbar items). */
export const playWhisk = () => {
  lastPlayedAt = lastWhiskAt = performance.now()
  whenReady((c) => {
    if (playFile(c, 'nav', 0.45)) return
    const out = envelope(c, 0.045, 0.014, 0.17)
    partial(c, 360, 240, 1, 0.15, out)
    partial(c, 180, 130, 0.7, 0.15, out)
  })
}

let lastHoverAt = 0

/** Barely-there soft tick for hover / keyboard-selection moves. Rate-limited. */
export const playHover = () => {
  const now = performance.now()
  if (now - lastHoverAt < 70 || now - lastPlayedAt < 60) return
  lastHoverAt = now
  whenReady((c) => {
    const out = envelope(c, 0.018, 0.004, 0.04)
    partial(c, 520, 440, 1, 0.035, out)
  })
}

/** Small soft rise for a popover/menu opening. */
export const playPopOpen = () => {
  lastPlayedAt = performance.now()
  whenReady((c) => {
    const out = envelope(c, 0.05, 0.03, 0.15)
    partial(c, 420, 560, 1, 0.13, out)
    partial(c, 210, 280, 0.5, 0.13, out)
  })
}

/** Matching soft fall for a popover/menu closing. */
export const playPopClose = () => {
  if (performance.now() - lastPlayedAt < 200) return
  lastPlayedAt = performance.now()
  whenReady((c) => {
    const out = envelope(c, 0.04, 0.02, 0.13)
    partial(c, 520, 380, 1, 0.11, out)
    partial(c, 260, 190, 0.5, 0.11, out)
  })
}

/** Two soft low notes, up a fifth. Form sent. */
export const playSuccess = () => {
  lastPlayedAt = performance.now()
  whenReady((c) => {
    ;[[294, 0], [440, 0.09]].forEach(([f, delay]) => {
      window.setTimeout(() => {
        if (c.state !== 'running') return
        const out = envelope(c, 0.06, 0.02, 0.4)
        partial(c, f as number, f as number, 1, 0.38, out)
        partial(c, (f as number) / 2, (f as number) / 2, 0.45, 0.34, out)
      }, (delay as number) * 1000)
    })
  })
}

/** Single soft low descending thud. Something went wrong. */
export const playError = () => {
  lastPlayedAt = performance.now()
  whenReady((c) => {
    const out = envelope(c, 0.07, 0.01, 0.2)
    partial(c, 220, 150, 1, 0.18, out)
    partial(c, 110, 80, 0.6, 0.18, out)
  })
}

export const setSoundMuted = (muted: boolean) => {
  try { window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* ignore */ }
}
