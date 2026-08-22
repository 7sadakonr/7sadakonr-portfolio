import AsiaMap from '../../../components/AsiaMap/AsiaMap'

const ContactInfo = () => (
  <div className="contact-info-col">
      <div className="contact-info-panel">
        <span className="contact-info-kicker">Contact us</span>
        <h2>Let&apos;s build something great.</h2>
        <p>Have a project in mind or just want to chat? I&apos;m always open to new opportunities and collaborations.</p>
        <div className="contact-info-links">
          <a href="mailto:7sadakonr@gmail.com">7sadakonr@gmail.com</a>
          <span aria-hidden="true">•</span>
          <a href="https://github.com/7sadakonr" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <AsiaMap />
      </div>
  </div>
)

export default ContactInfo
