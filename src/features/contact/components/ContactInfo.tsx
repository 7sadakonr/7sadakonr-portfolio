import AsiaMap from '../../../components/AsiaMap/AsiaMap'
import { useSiteSettings } from '../../siteSettings/hooks/useSiteSettings'
import { contactDisplayText, visibleContactLinks } from '../../siteSettings/validation/contactLinks'
import { trackEvent } from '../../../lib/analytics/trackEvent'
import type { ContactLink } from '../../siteSettings/types'

const ContactInfo = () => {
  const settings = useSiteSettings()
  const contacts = visibleContactLinks(settings.contactLinks)

  const handleContactClick = (contact: ContactLink) => {
    let eventName = 'contact_click'
    if (contact.type === 'email') eventName = 'email_click'
    else if (contact.type === 'linkedin') eventName = 'linkedin_click'
    else if (contact.type === 'github') eventName = 'github_profile_click'

    let host: string | undefined
    try {
      if (contact.url.startsWith('http')) {
        host = new URL(contact.url).hostname
      }
    } catch {
      // Ignore URL parsing errors
    }

    trackEvent(eventName, {
      target_id: contact.id,
      target_label: contactDisplayText(contact),
      target_type: contact.type,
      destination_host: host,
    })
  }

  return (
    <div className="contact-info-col">
      <div className="contact-info-panel">
        <span className="contact-info-kicker">Contact us</span>
        <h2>Let&apos;s build something great.</h2>
        <p>Have a project in mind or just want to chat? I&apos;m always open to new opportunities and collaborations.</p>
        {contacts.length > 0 && (
          <div className="contact-info-links">
            {contacts.map((contact, index) => (
              <span key={contact.id}>
                {index > 0 && <span aria-hidden="true">•</span>}
                <a
                  href={contact.url}
                  target={contact.url.startsWith('http') ? '_blank' : undefined}
                  rel={contact.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={() => handleContactClick(contact)}
                >
                  {contactDisplayText(contact)}
                </a>
              </span>
            ))}
          </div>
        )}
        <AsiaMap />
      </div>
    </div>
  )
}

export default ContactInfo
