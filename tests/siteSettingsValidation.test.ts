import { describe, expect, it } from 'vitest'
import { DEFAULT_SITE_SETTINGS } from '../src/features/siteSettings/defaults'
import { normalizeContactDraft, visibleContactLinks } from '../src/features/siteSettings/validation/contactLinks'

describe('site settings contact normalization', () => {
  it('keeps the current public portfolio content available as defaults', () => {
    expect(DEFAULT_SITE_SETTINGS.displayName).toBe('Jetsadakorn')
    expect(DEFAULT_SITE_SETTINGS.contactLinks.map((link) => link.type)).toEqual(['email', 'github'])
  })

  it('normalizes email, phone, GitHub, LinkedIn, and website values into safe links', () => {
    expect(normalizeContactDraft({ type: 'email', label: 'Email', value: 'example@email.com' }).url).toBe('mailto:example@email.com')
    expect(normalizeContactDraft({ type: 'phone', label: 'Phone', value: '081 079 6546' }).url).toBe('tel:0810796546')
    expect(normalizeContactDraft({ type: 'github', label: 'GitHub', value: '7sadakonr' }).url).toBe('https://github.com/7sadakonr')
    expect(normalizeContactDraft({ type: 'linkedin', label: 'LinkedIn', value: 'example-name' }).url).toBe('https://www.linkedin.com/in/example-name')
    expect(normalizeContactDraft({ type: 'website', label: 'Website', value: 'example.com' }).url).toBe('https://example.com/')
  })

  it('requires an explicit safe URL for an other contact', () => {
    expect(() => normalizeContactDraft({ type: 'other', label: 'Blog', value: 'example.com' })).toThrow('Use a valid http:// or https:// URL.')
    expect(normalizeContactDraft({ type: 'other', label: 'Blog', value: 'https://example.com' }).url).toBe('https://example.com/')
  })

  it('preserves configured order while excluding hidden links', () => {
    const contacts = [
      { id: 'first', type: 'email' as const, label: 'Email', value: 'a@example.com', url: 'mailto:a@example.com', isVisible: true },
      { id: 'second', type: 'github' as const, label: 'GitHub', value: 'example', url: 'https://github.com/example', isVisible: false },
      { id: 'third', type: 'website' as const, label: 'Website', value: 'example.com', url: 'https://example.com/', isVisible: true },
    ]

    expect(visibleContactLinks(contacts).map((link) => link.id)).toEqual(['first', 'third'])
  })
})
