export interface EmailJsConfig {
  serviceId: string
  templateId: string
  publicKey: string
}

type EmailEnvironment = Partial<Record<
  'VITE_EMAILJS_SERVICE_ID' | 'VITE_EMAILJS_TEMPLATE_ID' | 'VITE_EMAILJS_PUBLIC_KEY',
  string
>>

export const getEmailConfig = (environment: EmailEnvironment): EmailJsConfig | null => {
  const serviceId = environment.VITE_EMAILJS_SERVICE_ID
  const templateId = environment.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = environment.VITE_EMAILJS_PUBLIC_KEY
  return serviceId && templateId && publicKey ? { serviceId, templateId, publicKey } : null
}

export const sendContactEmail = async (form: HTMLFormElement, config: EmailJsConfig) => {
  const { default: emailjs } = await import('@emailjs/browser')
  await emailjs.sendForm(config.serviceId, config.templateId, form, { publicKey: config.publicKey })
}
