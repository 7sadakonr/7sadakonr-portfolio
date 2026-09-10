import { supabase } from '../../../lib/supabase'
import { createUuid } from '../../../utils/createUuid'
import { DEFAULT_SITE_SETTINGS } from '../defaults'
import { getSiteSettings, setSiteSettings } from '../data/siteSettingsStore'
import type { ContactLink, ResumeLanguage, SiteSettings, SiteSettingsRecord } from '../types'
import { normalizeContactDraft } from '../validation/contactLinks'

const SITE_SETTINGS_SELECT = 'id,display_name,hero_subtitle,bio_paragraph_1,bio_paragraph_2,current_focus,contact_heading,contact_description,contact_links,resume_en_url,resume_en_storage_path,resume_th_url,resume_th_storage_path,updated_at'
const RESUME_BUCKET = 'resume-files'
const MAX_RESUME_BYTES = 10 * 1024 * 1024

let siteSettingsPromise: Promise<SiteSettings> | null = null

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

export const invalidateSiteSettings = () => { siteSettingsPromise = null }

export const loadSiteSettings = () => {
  if (siteSettingsPromise) return siteSettingsPromise
  if (!supabase) return Promise.reject(new Error('Supabase is not configured'))

  siteSettingsPromise = (async () => {
    const { data, error } = await supabase.from('site_settings').select(SITE_SETTINGS_SELECT).eq('id', 1).maybeSingle()
    if (error || !data) throw error ?? new Error('Site settings are unavailable')
    const settings = mapSiteSettingsRecord(data)
    setSiteSettings(settings)
    return settings
  })().catch((error: unknown) => {
    siteSettingsPromise = null
    throw error
  })

  return siteSettingsPromise
}

type SiteSettingsUpdate = Partial<Pick<SiteSettingsRecord,
  'display_name' | 'hero_subtitle' | 'bio_paragraph_1' | 'bio_paragraph_2' | 'current_focus' | 'contact_heading' | 'contact_description' | 'contact_links' | 'resume_en_url' | 'resume_en_storage_path' | 'resume_th_url' | 'resume_th_storage_path'
>>

const updateSiteSettings = async (update: SiteSettingsUpdate) => {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase.from('site_settings').update(update).eq('id', 1).select(SITE_SETTINGS_SELECT).single()
  if (error || !data) throw error ?? new Error('Site settings were not saved.')
  const settings = mapSiteSettingsRecord(data)
  setSiteSettings(settings)
  siteSettingsPromise = Promise.resolve(settings)
  return settings
}

export const saveProfileSettings = (input: Pick<SiteSettings, 'displayName' | 'heroSubtitle' | 'bioParagraph1' | 'bioParagraph2' | 'currentFocus'>) => {
  const values = [input.displayName, input.heroSubtitle, input.bioParagraph1, input.bioParagraph2, input.currentFocus].map((value) => value.trim())
  if (values.some((value) => !value)) throw new Error('All Profile fields are required.')
  return updateSiteSettings({
    display_name: values[0], hero_subtitle: values[1], bio_paragraph_1: values[2], bio_paragraph_2: values[3], current_focus: values[4],
  })
}

export const saveContactSettings = (input: Pick<SiteSettings, 'contactHeading' | 'contactDescription' | 'contactLinks'>) => {
  const heading = input.contactHeading.trim()
  const description = input.contactDescription.trim()
  if (!heading || !description) throw new Error('Contact heading and description are required.')
  const contactLinks = input.contactLinks.map((link) => normalizeContactDraft(link))
  return updateSiteSettings({ contact_heading: heading, contact_description: description, contact_links: contactLinks })
}

export const validateResumeFile = (file: File) => {
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)) throw new Error('Use a PDF file.')
  if (file.size > MAX_RESUME_BYTES) throw new Error('Resume must be 10 MB or smaller.')
}

const isResumePath = (path: string, language: ResumeLanguage) => new RegExp(`^${language}/[0-9a-f-]+\\.pdf$`, 'i').test(path)

const removeResumeFile = async (path: string, language: ResumeLanguage) => {
  if (!supabase || !isResumePath(path, language)) return
  const { error } = await supabase.storage.from(RESUME_BUCKET).remove([path])
  if (error) throw error
}

export const replaceResume = async (language: ResumeLanguage, file: File) => {
  if (!supabase) throw new Error('Supabase is not configured')
  validateResumeFile(file)
  const path = `${language}/${createUuid()}.pdf`
  const oldSettings = getSiteSettings()
  const oldPath = language === 'en' ? oldSettings.resumeEnStoragePath : oldSettings.resumeThStoragePath
  const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(path, file, {
    cacheControl: '31536000', contentType: 'application/pdf', upsert: false,
  })
  if (uploadError) throw uploadError
  const { data: publicUrl } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(path)

  let settings: SiteSettings
  try {
    settings = await updateSiteSettings(language === 'en'
      ? { resume_en_url: publicUrl.publicUrl, resume_en_storage_path: path }
      : { resume_th_url: publicUrl.publicUrl, resume_th_storage_path: path })
  } catch (error) {
    try { await removeResumeFile(path, language) } catch { /* best-effort orphan cleanup */ }
    throw error
  }

  if (oldPath && oldPath !== path) {
    try { await removeResumeFile(oldPath, language) } catch { return { settings, cleanupWarning: 'New resume saved, but the previous file could not be removed.' } }
  }
  return { settings, cleanupWarning: null }
}

export const getFallbackSiteSettings = () => DEFAULT_SITE_SETTINGS
