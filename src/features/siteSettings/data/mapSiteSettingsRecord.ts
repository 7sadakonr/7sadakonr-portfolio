import type { ContactLink, SiteSettings, SiteSettingsRecord } from '../types'
import { normalizeContactDraft } from '../validation/contactLinks'

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isNullableText = (value: unknown): value is string | null => typeof value === 'string' || value === null
const isPublicUrl = (value: string) => value.startsWith('/') || /^https?:\/\//i.test(value)

const asContactLinks = (value: unknown): ContactLink[] => {
  if (!Array.isArray(value)) throw new Error('Invalid site settings data')
  const ids = new Set<string>()
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid site settings data')
    const contact = item as Record<string, unknown>
    if (typeof contact.id !== 'string' || typeof contact.type !== 'string' || typeof contact.label !== 'string' || typeof contact.value !== 'string' || typeof contact.isVisible !== 'boolean' || ids.has(contact.id)) throw new Error('Invalid site settings data')
    try {
      ids.add(contact.id)
      return normalizeContactDraft({ id: contact.id, type: contact.type as ContactLink['type'], label: contact.label, value: contact.value, isVisible: contact.isVisible })
    } catch { throw new Error('Invalid site settings data') }
  })
}

export const mapSiteSettingsRecord = (value: unknown): SiteSettings => {
  if (!value || typeof value !== 'object') throw new Error('Invalid site settings data')
  const record = value as Partial<SiteSettingsRecord>
  if (record.id !== 1 || !isText(record.display_name) || !isText(record.hero_subtitle) || !isText(record.bio_paragraph_1)
    || !isText(record.bio_paragraph_2) || !isText(record.current_focus) || !isText(record.contact_heading)
    || !isText(record.contact_description) || !isText(record.resume_en_url) || !isText(record.resume_th_url)
    || !isPublicUrl(record.resume_en_url) || !isPublicUrl(record.resume_th_url)
    || !isNullableText(record.resume_en_storage_path) || !isNullableText(record.resume_th_storage_path)
    || !isText(record.updated_at)) throw new Error('Invalid site settings data')

  return {
    id: 1,
    displayName: record.display_name.trim(),
    heroSubtitle: record.hero_subtitle.trim(),
    bioParagraph1: record.bio_paragraph_1.trim(),
    bioParagraph2: record.bio_paragraph_2.trim(),
    currentFocus: record.current_focus.trim(),
    contactHeading: record.contact_heading.trim(),
    contactDescription: record.contact_description.trim(),
    contactLinks: asContactLinks(record.contact_links),
    resumeEnUrl: record.resume_en_url,
    resumeEnStoragePath: record.resume_en_storage_path,
    resumeThUrl: record.resume_th_url,
    resumeThStoragePath: record.resume_th_storage_path,
    updatedAt: record.updated_at,
  }
}
