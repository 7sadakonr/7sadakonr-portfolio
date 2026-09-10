import { loadAboutPage, loadProjectPage, loadContactPage } from '../../utils/runtimeWarmup'

export type LazySectionId = 'about' | 'projects' | 'contact'

const sectionOrder: LazySectionId[] = ['about', 'projects', 'contact']

const requestedSections = new Set<LazySectionId>()
const readySections = new Set<LazySectionId>()
const readyWaiters = new Map<LazySectionId, Set<() => void>>()

const events = new EventTarget()
const requestEventName = 'landing-section-load-request'

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback) => number
  cancelIdleCallback?: (handle: number) => void
}

const runWhenIdle = (callback: () => void) => {
  const idleWindow = window as IdleWindow
  let timeoutHandle: number | undefined
  let idleHandle: number | undefined
  let lastInputAt = performance.now()
  const markInput = () => { lastInputAt = performance.now() }
  const inputEvents = ['wheel', 'touchstart', 'pointerdown'] as const
  inputEvents.forEach((eventName) => window.addEventListener(eventName, markInput, { passive: true }))

  const cleanup = () => {
    if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle)
    inputEvents.forEach((eventName) => window.removeEventListener(eventName, markInput))
  }

  const runAfterInputSettles = () => {
    const remainingQuietTime = 220 - (performance.now() - lastInputAt)
    if (remainingQuietTime > 0) {
      timeoutHandle = window.setTimeout(runAfterInputSettles, remainingQuietTime)
      return
    }
    cleanup()
    callback()
  }

  if (idleWindow.requestIdleCallback) {
    idleHandle = idleWindow.requestIdleCallback(runAfterInputSettles)
    return cleanup
  }

  timeoutHandle = window.setTimeout(runAfterInputSettles, 180)
  return cleanup
}

export const getOwningSection = (targetId: string): LazySectionId | null => {
  if (targetId === 'about' || targetId === 'about-me' || targetId === 'skills') return 'about'
  if (targetId === 'projects' || targetId.startsWith('project-')) return 'projects'
  if (targetId === 'contact') return 'contact'
  return null
}

export const isSectionRequested = (sectionId: LazySectionId) =>
  requestedSections.has(sectionId)

export const isSectionReady = (sectionId: LazySectionId) =>
  readySections.has(sectionId)

export const requestSection = (sectionId: LazySectionId): Promise<void> => {
  if (readySections.has(sectionId)) return Promise.resolve()

  requestedSections.add(sectionId)

  const readyPromise = new Promise<void>((resolve) => {
    const waiters = readyWaiters.get(sectionId) ?? new Set<() => void>()
    waiters.add(resolve)
    readyWaiters.set(sectionId, waiters)
  })

  events.dispatchEvent(
    new CustomEvent<{ sectionId: LazySectionId }>(requestEventName, {
      detail: { sectionId },
    }),
  )

  return readyPromise
}

export const prefetchSection = (sectionId: LazySectionId) => {
  if (sectionId === 'about') void loadAboutPage()
  else if (sectionId === 'projects') void loadProjectPage()
  else if (sectionId === 'contact') void loadContactPage()
}

// Hydrate below-the-fold sections one at a time while the browser is idle.
// Their data can settle before scrolling reaches them, without competing with
// a wheel gesture or mounting all three sections in one long task.
export const scheduleBelowFoldHydration = () => {
  let cancelled = false
  let cancelIdleWork: (() => void) | undefined

  const hydrateNext = (index: number) => {
    if (cancelled || index >= sectionOrder.length) return

    cancelIdleWork = runWhenIdle(() => {
      if (cancelled) return
      const sectionId = sectionOrder[index]
      if (!sectionId) return

      prefetchSection(sectionId)
      void requestSection(sectionId).catch(() => undefined).finally(() => {
        hydrateNext(index + 1)
      })
    })
  }

  hydrateNext(0)
  return () => {
    cancelled = true
    cancelIdleWork?.()
  }
}

export const ensureTargetReady = async (targetId: string): Promise<void> => {
  const owner = getOwningSection(targetId)
  if (!owner) return

  const ownerIndex = sectionOrder.indexOf(owner)
  for (let i = 0; i <= ownerIndex; i++) {
    const sec = sectionOrder[i]
    if (sec) {
      if (i === ownerIndex) {
        await requestSection(sec)
      } else {
        prefetchSection(sec)
      }
    }
  }
}

export const markSectionReady = (sectionId: LazySectionId) => {
  if (readySections.has(sectionId)) return

  readySections.add(sectionId)
  readyWaiters.get(sectionId)?.forEach((resolve) => resolve())
  readyWaiters.delete(sectionId)
}

export const subscribeToSectionRequests = (
  listener: (sectionId: LazySectionId) => void,
) => {
  const handleRequest = (event: Event) => {
    const customEvent = event as CustomEvent<{ sectionId: LazySectionId }>
    listener(customEvent.detail.sectionId)
  }

  events.addEventListener(requestEventName, handleRequest)
  return () => events.removeEventListener(requestEventName, handleRequest)
}
