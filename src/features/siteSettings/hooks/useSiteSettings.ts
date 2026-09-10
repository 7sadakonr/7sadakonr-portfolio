import { useSyncExternalStore } from 'react'
import { getSiteSettings, subscribeToSiteSettings } from '../data/siteSettingsStore'

export const useSiteSettings = () => useSyncExternalStore(subscribeToSiteSettings, getSiteSettings, getSiteSettings)

