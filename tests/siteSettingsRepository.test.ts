import { describe, expect, it } from 'vitest'
import { mapSiteSettingsRecord, validateResumeFile } from '../src/features/siteSettings/api/siteSettingsRepository'

const record = {
  id: 1,
  display_name: 'Example',
  hero_subtitle: 'Subtitle',
  bio_paragraph_1: 'First bio',
  bio_paragraph_2: 'Second bio',
  current_focus: 'Focus',
  contact_heading: 'Contact us',
  contact_description: 'Description',
  contact_links: [{ id: 'email', type: 'email', label: 'Email', value: 'example@email.com', url: 'mailto:example@email.com', isVisible: true }],
  resume_en_url: 'https://example.supabase.co/storage/v1/object/public/resume-files/en/file.pdf',
  resume_en_storage_path: 'en/file.pdf',
  resume_th_url: 'https://example.supabase.co/storage/v1/object/public/resume-files/th/file.pdf',
  resume_th_storage_path: 'th/file.pdf',
  updated_at: '2026-09-10T00:00:00.000Z',
}

describe('site settings repository mapping', () => {
  it('maps a singleton database record and recomputes known contact URLs', () => {
    const settings = mapSiteSettingsRecord({ ...record, contact_links: [{ ...record.contact_links[0], url: 'javascript:alert(1)' }] })

    expect(settings.displayName).toBe('Example')
    expect(settings.contactLinks[0]?.url).toBe('mailto:example@email.com')
    expect(settings.resumeEnStoragePath).toBe('en/file.pdf')
  })

  it('rejects a record that is not the singleton settings row', () => {
    expect(() => mapSiteSettingsRecord({ ...record, id: 2 })).toThrow('Invalid site settings data')
  })

  it('rejects the whole row when a stored contact is malformed', () => {
    expect(() => mapSiteSettingsRecord({ ...record, contact_links: [{ id: 'bad', type: 'email', label: 'Email', value: 'not-an-email', isVisible: true }] })).toThrow('Invalid site settings data')
  })

  it('validates both PDF MIME type and extension before upload', () => {
    expect(() => validateResumeFile(new File(['pdf'], 'resume.txt', { type: 'application/pdf' }))).toThrow('Use a PDF file.')
    expect(() => validateResumeFile(new File(['pdf'], 'resume.pdf', { type: 'text/plain' }))).toThrow('Use a PDF file.')
    expect(() => validateResumeFile(new File(['pdf'], 'resume.PDF', { type: 'application/pdf' }))).not.toThrow()
  })
})
