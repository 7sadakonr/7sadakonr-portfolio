import { createUuid } from '../../../utils/createUuid'
import { CONTACT_TYPES, type ContactDraftInput, type ContactLink, type ContactType } from '../types'

const defaultLabels: Record<ContactType, string> = {
  email: 'Email', phone: 'Phone', github: 'GitHub', linkedin: 'LinkedIn', website: 'Website',
  facebook: 'Facebook', instagram: 'Instagram', x: 'X', line: 'LINE', other: 'Other',
}

const asHttpUrl = (value: string, allowBareHost: boolean) => {
  const candidate = value.trim()
  const withScheme = allowBareHost && !/^[a-z][a-z\d+.-]*:/i.test(candidate) ? `https://${candidate}` : candidate
  let parsed: URL
  try { parsed = new URL(withScheme) } catch { throw new Error('Use a valid http:// or https:// URL.') }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Use a valid http:// or https:// URL.')
  return parsed
}

const platformHandle = (value: string, host: string, pathPrefix = '') => {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.toLowerCase().startsWith(`${host}/`) || trimmed.toLowerCase().startsWith(`www.${host}/`)) {
    const parsed = asHttpUrl(trimmed, true)
    if (parsed.hostname.replace(/^www\./, '').toLowerCase() !== host) throw new Error(`Use a valid ${defaultLabels[host === 'github.com' ? 'github' : host === 'linkedin.com' ? 'linkedin' : 'website']} URL.`)
    const path = parsed.pathname.replace(/^\/+|\/+$/g, '')
    if (!path) throw new Error('Enter a profile name or URL.')
    return `https://${host}/${path}`
  }
  const handle = trimmed.replace(/^@/, '').replace(/^\/+|\/+$/g, '')
  if (!handle || /[\s/?#]/.test(handle)) throw new Error('Enter a profile name or URL.')
  return `https://${host}/${pathPrefix}${encodeURIComponent(handle)}`
}

const normalizePhone = (value: string) => {
  const cleaned = value.trim().replace(/[\s().-]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleaned)) throw new Error('Enter a valid phone number.')
  return cleaned
}

const normalizeUrl = (type: ContactType, rawValue: string) => {
  const value = rawValue.trim()
  if (!value) throw new Error('Value / URL is required.')
  if (type === 'email') {
    const email = value.replace(/^mailto:/i, '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
    return { value: email, url: `mailto:${email}` }
  }
  if (type === 'phone') {
    const phone = normalizePhone(value.replace(/^tel:/i, ''))
    return { value, url: `tel:${phone}` }
  }
  if (type === 'github') return { value, url: platformHandle(value, 'github.com') }
  if (type === 'linkedin') {
    const linkedInUrl = platformHandle(value, 'linkedin.com', 'in/')
    return { value, url: linkedInUrl.replace('https://linkedin.com/', 'https://www.linkedin.com/') }
  }
  if (type === 'facebook') return { value, url: platformHandle(value, 'facebook.com') }
  if (type === 'instagram') return { value, url: platformHandle(value, 'instagram.com') }
  if (type === 'x') return { value, url: platformHandle(value, 'x.com') }
  if (type === 'line') {
    if (/^https?:\/\//i.test(value) || value.includes('line.me/')) return { value, url: asHttpUrl(value, true).toString() }
    const handle = value.replace(/^@/, '')
    if (!handle || /[\s/?#]/.test(handle)) throw new Error('Enter a valid LINE ID or URL.')
    return { value, url: `https://line.me/ti/p/~${encodeURIComponent(handle)}` }
  }
  const parsed = asHttpUrl(value, type === 'website')
  return { value, url: parsed.toString() }
}

export const normalizeContactDraft = (draft: ContactDraftInput): ContactLink => {
  if (!CONTACT_TYPES.includes(draft.type)) throw new Error('Choose a supported contact type.')
  const label = draft.label.trim() || (draft.type === 'other' ? '' : defaultLabels[draft.type])
  if (!label) throw new Error('Label is required.')
  const normalized = normalizeUrl(draft.type, draft.value)
  return { id: draft.id ?? createUuid(), type: draft.type, label, value: normalized.value, url: normalized.url, isVisible: draft.isVisible ?? true }
}

export const visibleContactLinks = (links: ContactLink[]) => links.filter((link) => link.isVisible)

export const contactDisplayText = (link: ContactLink) => link.type === 'email' || link.type === 'phone' ? link.value : link.label

export const firstVisibleContact = (links: ContactLink[], type: ContactType) => visibleContactLinks(links).find((link) => link.type === type) ?? null

export const githubUsernameFromLink = (link: ContactLink | null) => {
  if (!link || link.type !== 'github') return null
  try {
    const parsed = new URL(link.url)
    if (parsed.hostname.replace(/^www\./, '') !== 'github.com') return null
    return parsed.pathname.split('/').filter(Boolean)[0] ?? null
  } catch { return null }
}
