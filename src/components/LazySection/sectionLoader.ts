import { loadAboutPage, loadProjectPage, loadContactPage } from '../../utils/runtimeWarmup'

export type LazySectionId = 'about' | 'projects' | 'contact'

const sectionOrder: LazySectionId[] = ['about', 'projects', 'contact']

const requestedSections = new Set<LazySectionId>()
const readySections = new Set<LazySectionId>()
const readyWaiters = new Map<LazySectionId, Set<() => void>>()

const events = new EventTarget()
const requestEventName = 'landing-section-load-request'

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
