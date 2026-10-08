import { useContactForm } from '../hooks/useContactForm'
import { Input } from '../../../components/arc/input/input'
import { Textarea } from '../../../components/arc/textarea/textarea'

const ContactForm = () => {
  const { form, isSubmitting, submitStatus, clearSubmitStatus, handleSubmit } = useContactForm()
  return (
    <div className="contact-form-col arc-ui">
        <div className="glass-card contact-form-card">
          {submitStatus === 'success' ? (
            <div className="form-success">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3>Message Sent!</h3>
              <p>Thanks for reaching out. I&apos;ll get back to you soon.</p>
              <button onClick={clearSubmitStatus} className="submit-btn" style={{ marginTop: '20px' }}>
                Send Another
              </button>
            </div>
          ) : submitStatus === 'error' ? (
            <div className="form-error">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3>Oops!</h3>
              <p>Something went wrong. Please try again later.</p>
              <button onClick={clearSubmitStatus} className="submit-btn" style={{ marginTop: '20px' }}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <h3 className="contact-form-title">Send a Message</h3>
              <form ref={form} onSubmit={handleSubmit} className="contact-form">
                <Input label="Name" type="text" name="user_name" id="user_name" placeholder="Your Name" required />
                <Input label="Email" type="email" name="user_email" id="user_email" placeholder="Your Email" required />
                <Input label="Subject" type="text" name="subject" id="subject" placeholder="Project Inquiry / Hello" required />
                <Textarea label="Message" name="message" id="message" placeholder="Tell me about your project..." required />
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <><div className="spinner" /> Sending...</> : <>
                    Send Message
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </>}
                </button>
              </form>
            </>
          )}
        </div>
    </div>
  )
}

export default ContactForm
