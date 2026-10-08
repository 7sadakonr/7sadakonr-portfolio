import { normalizeProjectRecords } from '../projects/data/projectRecords'
import { mapSiteSettingsRecord } from '../siteSettings/data/mapSiteSettingsRecord'
import type { PublicProjectItem } from '../projects/types'
import type { SiteSettings } from '../siteSettings/types'
import snapshot from './contentSnapshot.json'

interface ContentSnapshot {
  projects?: unknown[]
  siteSettings?: unknown
}

export const parseSnapshotProjects = (source: ContentSnapshot): PublicProjectItem[] | null => {
  if (!Array.isArray(source.projects) || source.projects.length === 0) return null
  try { return normalizeProjectRecords(source.projects) } catch { return null }
}

export const parseSnapshotSiteSettings = (source: ContentSnapshot): SiteSettings | null => {
  if (!source.siteSettings) return null
  try { return mapSiteSettingsRecord(source.siteSettings) } catch { return null }
}

export const getSnapshotProjects = () => parseSnapshotProjects(snapshot as ContentSnapshot)
export const getSnapshotSiteSettings = () => parseSnapshotSiteSettings(snapshot as ContentSnapshot)
