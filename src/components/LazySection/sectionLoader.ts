export type LazySectionId = 'about' | 'projects' | 'contact'

const sectionOrder: LazySectionId[] = ['about', 'projects', 'contact']

const targetOwners: Record<string, LazySectionId> = {
  about: 'about',
  'about-me': 'about',
  skills: 'about',
  projects: 'projects',
  contact: 'contact',
}

const requestedSections = new Set<LazySectionId>()
const readySections = new Set<LazySectionId>()
const readyWaiters = new Map<LazySectionId, Set<() => void>>()

const requestEventName = 'landing-section-load-request'

export const getOwningSection = (targetId: string): LazySectionId | null => {
  if (targetOwners[targetId]) return targetOwners[targetId]
  if (targetId.startsWith('project-')) return 'projects'
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

  window.dispatchEvent(
    new CustomEvent<{ sectionId: LazySectionId }>(requestEventName, {
      detail: { sectionId },
    }),
  )

  return readyPromise
}

export const ensureTargetReady = async (targetId: string): Promise<void> => {
  const owner = getOwningSection(targetId)
  if (!owner) return

  const ownerIndex = sectionOrder.indexOf(owner)
  await Promise.all(sectionOrder.slice(0, ownerIndex + 1).map(requestSection))
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

  window.addEventListener(requestEventName, handleRequest)
  return () => window.removeEventListener(requestEventName, handleRequest)
}
