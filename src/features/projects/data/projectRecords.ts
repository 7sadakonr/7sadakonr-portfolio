import { mapProjectRecord } from './projectMapper'
import type { ProjectRecord, PublicProjectItem } from '../types'

const isStringOrNull = (value: unknown): value is string | null => typeof value === 'string' || value === null

export const isProjectRecord = (value: unknown): value is ProjectRecord => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string'
    && typeof record.title === 'string'
    && typeof record.description === 'string'
    && isStringOrNull(record.image_url)
    && isStringOrNull(record.image_storage_path)
    && isStringOrNull(record.live_url)
    && isStringOrNull(record.github_url)
    && Array.isArray(record.tech)
    && record.tech.every((technology) => typeof technology === 'string')
    && typeof record.is_in_progress === 'boolean'
    && typeof record.is_visible === 'boolean'
    && typeof record.sort_order === 'number'
    && isStringOrNull(record.fallback_gradient)
    && (typeof record.legacy_source_id === 'number' || record.legacy_source_id === null)
    && typeof record.created_at === 'string'
    && typeof record.updated_at === 'string'
}

export const normalizeProjectRecords = (records: unknown[]): PublicProjectItem[] => {
  if (!records.every(isProjectRecord)) throw new Error('Invalid project data')

  return records
    .map(mapProjectRecord)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
}
