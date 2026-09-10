import { DEFAULT_SITE_SETTINGS } from '../defaults'
import type { SiteSettings } from '../types'

let settings = DEFAULT_SITE_SETTINGS
const listeners = new Set<(settings: SiteSettings) => void>()

export const getSiteSettings = () => settings

export const setSiteSettings = (nextSettings: SiteSettings) => {
  settings = nextSettings
  listeners.forEach((listener) => listener(settings))
}

export const subscribeToSiteSettings = (listener: (nextSettings: SiteSettings) => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

