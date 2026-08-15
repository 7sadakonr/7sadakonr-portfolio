import type { LandingPath } from './navigation.types'

const events = new EventTarget()
const SECTION_CHANGE = 'section-change'
const PROJECT_TARGET = 'project-target'

export const publishSectionChange = (path: LandingPath) => {
  events.dispatchEvent(new CustomEvent<LandingPath>(SECTION_CHANGE, { detail: path }))
}

export const subscribeToSectionChanges = (listener: (path: LandingPath) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<LandingPath>).detail)
  events.addEventListener(SECTION_CHANGE, handler)
  return () => events.removeEventListener(SECTION_CHANGE, handler)
}

export const requestProjectTarget = (index: number) => {
  events.dispatchEvent(new CustomEvent<number>(PROJECT_TARGET, { detail: index }))
}

export const subscribeToProjectTargets = (listener: (index: number) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<number>).detail)
  events.addEventListener(PROJECT_TARGET, handler)
  return () => events.removeEventListener(PROJECT_TARGET, handler)
}
