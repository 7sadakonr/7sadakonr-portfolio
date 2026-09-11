type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback) => number
  cancelIdleCallback?: (handle: number) => void
}

const INPUT_QUIET_MS = 220
const IDLE_FALLBACK_DELAY_MS = 180
const inputEvents = ['wheel', 'touchstart', 'pointerdown'] as const

export const scheduleIdleWork = (callback: () => void) => {
  const idleWindow = window as IdleWindow
  let cancelled = false
  let idleHandle: number | undefined
  let timeoutHandle: number | undefined
  let lastInputAt = performance.now()

  const markInput = () => { lastInputAt = performance.now() }
  inputEvents.forEach((eventName) => window.addEventListener(eventName, markInput, { passive: true }))

  const cleanup = () => {
    if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle)
    inputEvents.forEach((eventName) => window.removeEventListener(eventName, markInput))
  }

  const run = () => {
    if (cancelled) return
    const remainingQuietTime = INPUT_QUIET_MS - (performance.now() - lastInputAt)
    if (remainingQuietTime > 0) {
      timeoutHandle = window.setTimeout(run, remainingQuietTime)
      return
    }
    cleanup()
    callback()
  }

  if (idleWindow.requestIdleCallback) {
    idleHandle = idleWindow.requestIdleCallback(run)
  } else {
    timeoutHandle = window.setTimeout(run, IDLE_FALLBACK_DELAY_MS)
  }

  return () => {
    cancelled = true
    cleanup()
  }
}

export const scheduleAfterPaint = (callback: () => void) => {
  let secondFrame: number | undefined
  const firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(callback)
  })

  return () => {
    if (firstFrame !== undefined) cancelAnimationFrame(firstFrame)
    if (secondFrame !== undefined) cancelAnimationFrame(secondFrame)
  }
}
