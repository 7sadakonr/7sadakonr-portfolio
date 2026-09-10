import logo from '../../assets/img/logo.svg'
import { useEffect, useState } from 'react'
import ResumeDownloadMenu from '../ResumeDownload/ResumeDownloadMenu'
import { getProjectCatalog, subscribeToProjectCatalog } from '../../features/projects/data/projectCatalogStore'
import { useSiteSettings } from '../../features/siteSettings/hooks/useSiteSettings'
import { contactDisplayText, firstVisibleContact, visibleContactLinks } from '../../features/siteSettings/validation/contactLinks'
import { trackEvent } from '../../lib/analytics/trackEvent'
import type { ContactLink } from '../../features/siteSettings/types'
import './Footer.css'

const Footer = () => {
  const [projects, setProjects] = useState(getProjectCatalog)
  const settings = useSiteSettings()
  const contacts = visibleContactLinks(settings.contactLinks)
  const email = firstVisibleContact(settings.contactLinks, 'email')
  const emailHref = (subject: string) => email ? `${email.url}?subject=${encodeURIComponent(subject)}` : ''

  useEffect(() => subscribeToProjectCatalog(setProjects), [])

  const handleContactClick = (contact: ContactLink) => {
    let eventName = 'contact_click'
    if (contact.type === 'email') eventName = 'email_click'
    else if (contact.type === 'linkedin') eventName = 'linkedin_click'
    else if (contact.type === 'github') eventName = 'github_profile_click'

    let host: string | undefined
    try {
      if (contact.url.startsWith('http')) host = new URL(contact.url).hostname
    } catch {
      // Ignore URL parsing errors
    }

    trackEvent(eventName, {
      target_id: contact.id,
      target_label: contactDisplayText(contact),
      target_type: contact.type,
      destination_host: host,
      metadata: { source: 'footer' },
    })
  }

  const handleEmailSubjectClick = (subject: string) => {
    trackEvent('email_click', {
      target_label: `Email (${subject})`,
      target_type: 'email_subject_link',
      metadata: { subject, source: 'footer' },
    })
  }

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <a className="site-footer__brand-link" href="#home" aria-label="Back to home">
              <img className="site-footer__logo" src={logo} alt="7SADAKONR logo" loading="lazy" decoding="async" />
            </a>
            <p className="site-footer__intro">Computer Science student building thoughtful web experiences.</p>
            <p className="site-footer__copyright">© {new Date().getFullYear()} 7SADAKONR. All rights reserved.</p>
            <p className="site-footer__attribution">
              Uicons by <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer">Flaticon</a>
            </p>
          </div>

          <nav className={`site-footer__links${email ? '' : ' site-footer__links--without-email'}`} aria-label="Footer navigation">
            <section className="site-footer__column">
              <h2>Navigate</h2>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About me</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </section>
            <section className="site-footer__column">
              <h2>Selected work</h2>
              <ul>
                {(projects ?? []).slice(0, 3).map((project, index) => (
                  <li key={project.id}>
                    <a
                      href={`#project-${index}`}
                      onClick={() => {
                        trackEvent('project_open', {
                          project_slug: project.id,
                          target_label: project.title,
                          target_type: 'footer_project_link',
                        })
                      }}
                    >
                      {project.title}
                    </a>
                  </li>
                ))}
                <li><a href="#projects">All projects</a></li>
              </ul>
            </section>
            <section className="site-footer__column">
              <h2>Connect</h2>
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <a
                      href={contact.url}
                      target={contact.url.startsWith('http') ? '_blank' : undefined}
                      rel={contact.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={() => handleContactClick(contact)}
                    >
                      {contactDisplayText(contact)}
                    </a>
                  </li>
                ))}
                <li><ResumeDownloadMenu variant="footer" /></li>
              </ul>
            </section>
            {email && (
              <section className="site-footer__column">
                <h2>Available for</h2>
                <ul>
                  <li><a href={emailHref('Project inquiry')} onClick={() => handleEmailSubjectClick('Project inquiry')}>Web projects</a></li>
                  <li><a href={emailHref('Collaboration')} onClick={() => handleEmailSubjectClick('Collaboration')}>Collaboration</a></li>
                  <li><a href={emailHref('Hello')} onClick={() => handleEmailSubjectClick('Hello')}>Say hello</a></li>
                </ul>
              </section>
            )}
          </nav>
        </div>
        <p className="site-footer__wordmark" aria-hidden="true">7SADAKONR</p>
      </div>
    </footer>
  )
}

export default Footer
