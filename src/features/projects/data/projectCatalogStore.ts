import type { PublicProjectItem } from '../types'

let catalog: PublicProjectItem[] | null = null
const listeners = new Set<(projects: PublicProjectItem[] | null) => void>()

export const getProjectCatalog = () => catalog

export const setProjectCatalog = (projects: PublicProjectItem[] | null) => {
  catalog = projects
  listeners.forEach((listener) => listener(catalog))
}

export const subscribeToProjectCatalog = (listener: (projects: PublicProjectItem[] | null) => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
