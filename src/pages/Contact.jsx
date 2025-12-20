import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import './contact.css'
import AnimatedContent from '../components/Animation/AnimatedContent.jsx'

const Contact = () => {
  const navigate = useNavigate()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isNavigatingRef = useRef(false)

  const handleNavigate = useCallback(() => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setIsTransitioning(true)

    setTimeout(() => {
      window.scrollTo(0, 0)
      navigate('/project')
    }, 600)
  }, [navigate])

  useEffect(() => {
    document.body.classList.add('contact-page')

    // Desktop scroll navigation - only up to Project
    const handleWheel = (e) => {
      if (isNavigatingRef.current) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const atTop = scrollTop <= 5

      // Scroll up at top → go to Project
      if (atTop && e.deltaY < -80) {
        handleNavigate()
      }
    }

    // Mobile touch navigation
    let touchStartY = 0
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
      if (isNavigatingRef.current) return
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchStartY - touchEndY

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const atTop = scrollTop <= 5

      // Swipe down at top → go to Project
      if (atTop && deltaY < -100) {
        handleNavigate()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.body.classList.remove('contact-page')
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleNavigate])

  // Generate stars like About/Project pages
  const stars = useMemo(() => [...Array(250)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() > 0.98 ? '3px' : Math.random() > 0.9 ? '2px' : '1px',
    duration: Math.random() * 6 + 4 + 's',
    delay: Math.random() * 5 + 's'
  })), [])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(false)

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          name: formData.name,
          title: formData.subject,
          message: formData.message,
          email: formData.email,
          reply_to: formData.email,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )

      setIsSubmitting(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      console.error('EmailJS Error:', err)
      setIsSubmitting(false)
      setError(true)

      // Reset error message after 5 seconds
      setTimeout(() => setError(false), 5000)
    }
  }

  return (
    <div className={`contact-page-wrapper ${isTransitioning ? 'transitioning-up' : ''}`}>
      {/* Background Elements - Universe Theme */}
      <div className="contact-bg" />

      {/* Stars Layer */}
      <div className="contact-star-layer">
        {stars.map((s) => (
          <div
            key={s.id}
            className="contact-tiny-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDuration: s.duration,
              animationDelay: s.delay
            }}
          />
        ))}
      </div>

      {/* Shooting Stars Layer */}
      <div className="contact-shooting-stars">
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
      </div>

      <div className="contact-mesh" />
      <div className="contact-mesh-extra" />
      <div className="contact-floor-glow" />
      <div className="contact-vignette" />

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
              Get In <span className="gradient-text">
                <span className="gradient-text-glow">Touch</span>
                <span className="gradient-text-content">Touch</span>
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
              Have a project in mind or just want to say hello? I'd love to hear from you.
              Let's create something amazing together.
            </p>
          </AnimatedContent>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <div className="contact-grid">

            {/* Contact Info Card */}
            <AnimatedContent
              distance={50}
              direction="horizontal"
              duration={0.8}
              initialOpacity={0}
              delay={0.2}
            >
              <div className="contact-info-card glass-card">
                <h2 className="contact-info-title">Let's Connect</h2>
                <p className="contact-info-description">
                  I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
                </p>

                {/* Contact Items */}
                <div className="contact-items">
                  <div className="contact-item">
                    <div className="contact-item-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <a href="mailto:7sadakonr@gmail.com" className="contact-item-text">7sadakonr@gmail.com</a>
                  </div>

                  <div className="contact-item">
                    <div className="contact-item-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </div>
                    <span className="contact-item-text">Ayutthaya, Thailand</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="social-section">
                  <span className="social-label">Follow Me</span>
                  <div className="social-links">
                    <a href="https://github.com/7sadakonr" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedContent>

            {/* Contact Form Card */}
            <AnimatedContent
              distance={50}
              direction="horizontal"
              duration={0.8}
              initialOpacity={0}
              delay={0.35}
            >
              <div className="contact-form-card glass-card">
                <h2 className="contact-form-title">Send a Message</h2>

                {submitted ? (
                  <div className="form-success">
                    <div className="success-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <h3>Message Sent!</h3>
                    <p>Thank you for reaching out. I'll get back to you soon!</p>
                  </div>
                ) : error ? (
                  <div className="form-error">
                    <div className="error-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </div>
                    <h3>Oops! Something went wrong</h3>
                    <p>Please try again or email me directly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What's this about?"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell me about your project..."
                        rows="5"
                        required
                      />
                    </div>

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </AnimatedContent>
          </div>
        </section>

      </div>
    </div>
  )
}

export default Contact