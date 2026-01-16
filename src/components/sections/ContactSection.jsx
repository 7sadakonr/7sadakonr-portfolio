import React, { useRef, useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'
import AnimatedContent from '../Animation/AnimatedContent.jsx'
// CSS is now in LandingPage.css

const ContactSection = () => {
    const form = useRef()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

    const sendEmail = (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus(null)

        // Using environment variables for EmailJS config
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

        // Fallback if env vars are missing (for demo purposes) or log error
        if (!serviceId || !templateId || !publicKey) {
            console.error("EmailJS environment variables missing")
            setIsSubmitting(false)
            setSubmitStatus('error')
            return
        }

        emailjs
            .sendForm(serviceId, templateId, form.current, {
                publicKey: publicKey,
            })
            .then(
                () => {
                    setSubmitStatus('success')
                    setIsSubmitting(false)
                    form.current.reset()
                    // Reset success message after 5 seconds
                    setTimeout(() => setSubmitStatus(null), 5000)
                },
                (error) => {
                    console.error('FAILED...', error.text)
                    setSubmitStatus('error')
                    setIsSubmitting(false)
                },
            )
    }

    return (
        <div className="contact-page-wrapper landing-section" id="contact">
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

                        {/* Left Column - Contact Info */}
                        <div className="contact-info-col">
                            <AnimatedContent
                                distance={50}
                                direction="horizontal"
                                duration={0.8}
                                initialOpacity={0}
                                delay={0.2}
                            >
                                <div className="glass-card contact-info-card">
                                    <h3 className="contact-info-title">Get in touch</h3>
                                    <p className="contact-info-description">
                                        Feel free to reach out via email or connect with me on social media. I'll get back to you as soon as possible.
                                    </p>

                                    <div className="contact-items">
                                        <div className="contact-item">
                                            <div className="contact-item-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                            </div>
                                            <a href="mailto:7sadakonr@gmail.com" className="contact-item-text">7sadakonr@gmail.com</a>
                                        </div>
                                    </div>

                                    <div className="social-section">
                                        <span className="social-label">Social Media</span>
                                        <div className="social-links">
                                            <a href="https://github.com/7sadakonr" target="_blank" rel="noopener noreferrer" className="social-link">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                GitHub
                                            </a>
                                        </div>
                                    </div>
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
