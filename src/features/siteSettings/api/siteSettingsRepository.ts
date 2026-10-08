import { supabase } from '../../../lib/supabase'
import { createUuid } from '../../../utils/createUuid'
import { DEFAULT_SITE_SETTINGS } from '../defaults'
import { getSiteSettings, setSiteSettings } from '../data/siteSettingsStore'
import { mapSiteSettingsRecord } from '../data/mapSiteSettingsRecord'
import type { ResumeLanguage, SiteSettings, SiteSettingsRecord } from '../types'
import { normalizeContactDraft } from '../validation/contactLinks'

const SITE_SETTINGS_SELECT = 'id,display_name,hero_subtitle,bio_paragraph_1,bio_paragraph_2,current_focus,contact_heading,contact_description,contact_links,resume_en_url,resume_en_storage_path,resume_th_url,resume_th_storage_path,updated_at'
const RESUME_BUCKET = 'resume-files'
const MAX_RESUME_BYTES = 10 * 1024 * 1024

export { mapSiteSettingsRecord }

let siteSettingsPromise: Promise<SiteSettings> | null = null

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
