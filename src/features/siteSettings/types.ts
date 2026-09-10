export const CONTACT_TYPES = [
  'email', 'phone', 'github', 'linkedin', 'website', 'facebook', 'instagram', 'x', 'line', 'other',
] as const

export type ContactType = typeof CONTACT_TYPES[number]

export interface ContactLink {
  id: string
  type: ContactType
  label: string
  value: string
  url: string
  isVisible: boolean
}

export interface SiteSettings {
  id: 1
  displayName: string
  heroSubtitle: string
  bioParagraph1: string
  bioParagraph2: string
  currentFocus: string
  contactHeading: string
  contactDescription: string
  contactLinks: ContactLink[]
  resumeEnUrl: string
  resumeEnStoragePath: string | null
  resumeThUrl: string
  resumeThStoragePath: string | null
  updatedAt: string | null
}

export interface SiteSettingsRecord {
  id: number
  display_name: string
  hero_subtitle: string
  bio_paragraph_1: string
  bio_paragraph_2: string
  current_focus: string
  contact_heading: string
  contact_description: string
  contact_links: unknown
  resume_en_url: string
  resume_en_storage_path: string | null
  resume_th_url: string
  resume_th_storage_path: string | null
  updated_at: string
}

export interface ContactDraftInput {
  id?: string
  type: ContactType
  label: string
  value: string
  isVisible?: boolean
}

export type ResumeLanguage = 'en' | 'th'

