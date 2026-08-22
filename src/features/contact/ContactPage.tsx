import TextReveal from '../../components/Animation/TextReveal'
import '../../pages/LandingPage.css'
import ContactForm from './components/ContactForm'
import ContactInfo from './components/ContactInfo'

const ContactSection = () => (
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
          <span>Let&apos;s</span>
          <span className="gradient-text">
            <span className="gradient-text-glow">Connect</span>
            <span className="gradient-text-content">Connect</span>
          </span>
        </TextReveal>

        <TextReveal
          as="p"
          className="contact-hero-subtitle"
          text="Have a project in mind, a question, or just want to say hi? Feel free to reach out!"
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

export default ContactSection
