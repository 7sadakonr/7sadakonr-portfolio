import TextReveal from '../../components/Animation/TextReveal'
import '../../pages/LandingPage.css'
import ContactForm from './components/ContactForm'
import ContactInfo from './components/ContactInfo'
import { useSiteSettings } from '../siteSettings/hooks/useSiteSettings'

const ContactHeading = ({ heading }: { heading: string }) => {
  const words = heading.trim().split(/\s+/)
  const accent = words.pop() ?? heading
  const prefix = words.join(' ')
  return <>{prefix && <span>{prefix}</span>}<span className="gradient-text"><span className="gradient-text-glow">{accent}</span><span className="gradient-text-content">{accent}</span></span></>
}

const ContactSection = () => {
  const settings = useSiteSettings()
  return (
  <div className="contact-page-wrapper landing-section">
    {/* Main Content */}
    <div className="contact-content">
      {/* Hero Section */}
      <section className="contact-hero">
        <TextReveal
          as="h1"
          className="contact-hero-title"
          delay={0.1}
          stagger={0.07}
        >
          <ContactHeading heading={settings.contactHeading} />
        </TextReveal>

        <TextReveal
          as="p"
          className="contact-hero-subtitle"
          text={settings.contactDescription}
          delay={0.25}
          stagger={0.025}
        />
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-grid">
          {/* Left Column - Contact Details and Location */}
          <ContactInfo />

          {/* Right Column - Contact Form */}
          <ContactForm />
        </div>
      </section>
    </div>
  </div>
  )
}

export default ContactSection
