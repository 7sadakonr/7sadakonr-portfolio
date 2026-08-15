import { describe, expect, it } from 'vitest'
import { getEmailConfig } from '../src/features/contact/services/emailService'

describe('getEmailConfig', () => {
  it('returns null until every EmailJS value is supplied', () => {
    expect(getEmailConfig({ VITE_EMAILJS_SERVICE_ID: 'service' })).toBeNull()
    expect(getEmailConfig({
      VITE_EMAILJS_SERVICE_ID: 'service',
      VITE_EMAILJS_TEMPLATE_ID: 'template',
      VITE_EMAILJS_PUBLIC_KEY: 'key',
    })).toEqual({ serviceId: 'service', templateId: 'template', publicKey: 'key' })
  })
})
