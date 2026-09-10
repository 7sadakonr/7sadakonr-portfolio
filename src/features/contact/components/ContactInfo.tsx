import AsiaMap from '../../../components/AsiaMap/AsiaMap'
import { useSiteSettings } from '../../siteSettings/hooks/useSiteSettings'
import { contactDisplayText, visibleContactLinks } from '../../siteSettings/validation/contactLinks'

const ContactInfo = () => {
  const settings = useSiteSettings()
  const contacts = visibleContactLinks(settings.contactLinks)
  return (
  <div className="contact-info-col">
      <div className="contact-info-panel">
        <span className="contact-info-kicker">Contact us</span>
        <h2>Let&apos;s build something great.</h2>
        <p>Have a project in mind or just want to chat? I&apos;m always open to new opportunities and collaborations.</p>
        {contacts.length > 0 && <div className="contact-info-links">
          {contacts.map((contact, index) => <span key={contact.id}>
            {index > 0 && <span aria-hidden="true">•</span>}
            <a href={contact.url} target={contact.url.startsWith('http') ? '_blank' : undefined} rel={contact.url.startsWith('http') ? 'noopener noreferrer' : undefined}>{contactDisplayText(contact)}</a>
          </span>)}
        </div>}
        <AsiaMap />
      </div>
  </div>
  )
}

export default ContactInfo
