import { useRef, useState, type FormEvent } from 'react'
import AnimatedContent from '../components/Animation/AnimatedContent'
import AsiaMap from '../components/AsiaMap/AsiaMap'
// CSS is now in LandingPage.css

const ContactSection = () => {
    const form = useRef<HTMLFormElement>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

    const sendEmail = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus(null)

        // Using environment variables for EmailJS config
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

        // Fallback if env vars are missing (for demo purposes) or log error
        const currentForm = form.current
        if (!serviceId || !templateId || !publicKey || !currentForm) {
            console.error("EmailJS environment variables missing")
            setIsSubmitting(false)
            setSubmitStatus('error')
            return
        }

        try {
            const { default: emailjs } = await import('@emailjs/browser')
            await emailjs.sendForm(serviceId, templateId, currentForm, {
                publicKey: publicKey,
            })

            setSubmitStatus('success')
            setIsSubmitting(false)
            currentForm.reset()
            // Reset success message after 5 seconds
            setTimeout(() => setSubmitStatus(null), 5000)
        } catch (error) {
            console.error('FAILED...', error)
            setSubmitStatus('error')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="contact-page-wrapper landing-section">
            {/* Main Content */}
            <div className="contact-content">

                {/* Hero Section */}
                <section className="contact-hero">
                    <AnimatedContent
                        distance={60}
                        direction="vertical"
                        duration={1}
                        initialOpacity={0}
                        delay={0.25}
                    >
                        <h1 className="contact-hero-title">
                            Let's <span className="gradient-text">
                                <span className="gradient-text-glow">Connect</span>
                                <span className="gradient-text-content">Connect</span>
                            </span>
                        </h1>
                    </AnimatedContent>

                    <AnimatedContent
                        distance={50}
                        direction="vertical"
                        duration={1}
                        initialOpacity={0}
                        delay={0.4}
                    >
                        <p className="contact-hero-subtitle">
                            Have a project in mind or just want to chat? I'm always open to new opportunities and collaborations.
                        </p>
                    </AnimatedContent>
                </section>

                {/* Contact Section */}
                <section className="contact-section">
                    <div className="contact-grid">

                        {/* Left Column - Contact Details and Location */}
                        <div className="contact-info-col">
                            <AnimatedContent
                                distance={50}
                                direction="horizontal"
                                duration={0.8}
                                initialOpacity={0}
                                delay={0.2}
                            >
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
                            </AnimatedContent>
                        </div>

                        {/* Right Column - Contact Form */}
                        <div className="contact-form-col">
                            <AnimatedContent
                                distance={50}
                                direction="horizontal"
                                duration={0.8}
                                initialOpacity={0}
                                delay={0.4}
                            >
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
                                            <p>Thanks for reaching out. I'll get back to you soon.</p>
                                            <button onClick={() => setSubmitStatus(null)} className="submit-btn" style={{ marginTop: '20px' }}>
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
                                            <button onClick={() => setSubmitStatus(null)} className="submit-btn" style={{ marginTop: '20px' }}>
                                                Try Again
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="contact-form-title">Send a Message</h3>
                                            <form ref={form} onSubmit={sendEmail} className="contact-form">
                                                <div className="form-group">
                                                    <label htmlFor="user_name">Name</label>
                                                    <input type="text" name="user_name" id="user_name" placeholder="Your Name" required />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="user_email">Email</label>
                                                    <input type="email" name="user_email" id="user_email" placeholder="Your Email" required />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="subject">Subject</label>
                                                    <input type="text" name="subject" id="subject" placeholder="Project Inquiry / Hello" required />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="message">Message</label>
                                                    <textarea name="message" id="message" placeholder="Tell me about your project..." required />
                                                </div>
                                                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="spinner" /> Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Send Message
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="22" y1="2" x2="11" y2="13" />
                                                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                            </svg>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </AnimatedContent>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    )
}

export default ContactSection


