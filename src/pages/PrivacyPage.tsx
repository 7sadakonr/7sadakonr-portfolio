import { useEffect } from 'react'
import SmoothScroll from '../components/SmoothScroll/SmoothScroll'
import { SpaceBackground } from '../components/SpaceBackground/SpaceBackground'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import { Seo } from '../components/Seo/Seo'
import Scales from '../components/Scales/Scales'
import TextReveal from '../components/Animation/TextReveal'
import { useSiteSettings } from '../features/siteSettings/hooks/useSiteSettings'
import { firstVisibleContact } from '../features/siteSettings/validation/contactLinks'
import './LandingPage.css'
import './PrivacyPage.css'

export default function PrivacyPage() {
  const settings = useSiteSettings()
  const emailContact = firstVisibleContact(settings.contactLinks, 'email')
  const emailAddress = emailContact?.value || 'hello@7sadakonr.com'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <SmoothScroll isPrepared={true} isEnabled={true}>
      <Seo
        title="Privacy Policy — 7SADAKONR"
        description="Transparency regarding data collection, aggregate analytics, and user privacy."
      />
      <Navbar isInteractive={true} />

      <div className="landing-page-container">
        <div className="landing-content-flow">
          <SpaceBackground motion="none" showPlanet={false} showNebula={false} showStars={false} isActive={true}>
            <div className="about-page-wrapper landing-section" style={{ minHeight: '100vh', paddingTop: '100px' }}>
              <div className="about-content" style={{ minHeight: 'auto', paddingTop: '30px' }}>
                {/* Hero Section */}
                <section className="about-hero" style={{ marginBottom: 'clamp(36px, 5vh, 50px)' }}>
                  <p className="privacy-hero-tag">Legal</p>
                  <TextReveal as="h1" className="about-hero-title" delay={0.1} stagger={0.07}>
                    <span>Privacy </span>
                    <span className="gradient-text">
                      <span className="gradient-text-glow">Policy</span>
                      <span className="gradient-text-content">Policy</span>
                    </span>
                  </TextReveal>
                  <TextReveal
                    as="p"
                    className="about-hero-subtitle"
                    text="Transparency regarding data collection, aggregate analytics, and user privacy."
                    delay={0.25}
                    stagger={0.025}
                  />
                </section>

                {/* 2-Column Bento Layout with Scale Lines matching About page */}
                <section className="about-bento-container" id="privacy-policy">
                  <div className="about-bento-scale about-bento-scale-left" aria-hidden="true">
                    <Scales orientation="diagonal" size={10} color="rgba(255, 255, 255, 0.1)" />
                  </div>
                  <div className="about-bento-scale about-bento-scale-right" aria-hidden="true">
                    <Scales orientation="diagonal" size={10} color="rgba(255, 255, 255, 0.1)" />
                  </div>

                  <div className="privacy-bento-split-layout">
                    {/* Section 01: Collect. Only What's Needed */}
                    <div className="privacy-bento-split-row">
                      <div className="privacy-bento-sidebar">
                        <div className="privacy-bento-sticky">
                          <span className="privacy-section-num">01</span>
                          <h2 className="privacy-section-heading">Collect.</h2>
                          <p className="privacy-section-subheading">Only What’s Needed</p>
                        </div>
                      </div>

                      <div className="privacy-bento-main">
                        <div className="bento-card">
                          <div className="about-me-text">
                            <p style={{ marginTop: 0 }}>
                              I believe in the web being open but private. I only collect data that is strictly necessary to communicate with you and operate the portfolio at an aggregate level.
                            </p>

                            <div className="privacy-subcard-grid">
                              <div className="privacy-subcard">
                                <div className="privacy-subcard-header">
                                  <div className="privacy-subcard-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <rect width="20" height="16" x="2" y="4" rx="2" />
                                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                  </div>
                                  <h3 className="privacy-subcard-title">Contact Inquiries</h3>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
                                  When you reach out via the contact form, I receive your <strong style={{ color: '#fff' }}>name, email address, and message</strong>. This data is used solely to respond to your inquiry and communicate with you.
                                </p>
                              </div>

                              <div className="privacy-subcard">
                                <div className="privacy-subcard-header">
                                  <div className="privacy-subcard-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      <path d="m9 12 2 2 4-4" />
                                    </svg>
                                  </div>
                                  <h3 className="privacy-subcard-title">Zero Persistent Tracking</h3>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6 }}>
                                  The site does <strong style={{ color: '#fff' }}>not</strong> maintain persistent visitor IDs, session tracking cookies, cross-session profiles (such as <code>visitor_id</code> or <code>session_id</code>), or device fingerprints.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 02: Measure. Aggregate, Not Track */}
                    <div className="privacy-bento-split-row">
                      <div className="privacy-bento-sidebar">
                        <div className="privacy-bento-sticky">
                          <span className="privacy-section-num">02</span>
                          <h2 className="privacy-section-heading">Measure.</h2>
                          <p className="privacy-section-subheading">Aggregate, Not Track</p>
                        </div>
                      </div>

                      <div className="privacy-bento-main">
                        <div className="bento-card">
                          <div className="about-me-text">
                            <p style={{ marginTop: 0 }}>
                              Understanding how you use this site helps me improve it. I use privacy-focused tools that aggregate data rather than tracking individual fingerprints.
                            </p>

                            <div className="privacy-tool-list">
                              <div className="privacy-tool-item">
                                <div className="privacy-tool-icon">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                  </svg>
                                </div>
                                <div className="privacy-tool-text">
                                  <h3 className="privacy-tool-title">Vercel Web Analytics</h3>
                                  <p className="privacy-tool-desc">
                                    Measures server performance, latency, load times, and aggregated traffic volume (approximate country). Strictly technical data without setting persistent tracking cookies.
                                  </p>
                                </div>
                              </div>

                              <div className="privacy-tool-item">
                                <div className="privacy-tool-icon">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                  </svg>
                                </div>
                                <div className="privacy-tool-text">
                                  <h3 className="privacy-tool-title">Supabase Aggregate Counters</h3>
                                  <p className="privacy-tool-desc">
                                    Tracks general page views, project modal opens, and resume downloads as anonymous daily sums. IP addresses are discarded upon geolocation and are never stored in the database.
                                  </p>
                                </div>
                              </div>

                              <div className="privacy-tool-item">
                                <div className="privacy-tool-icon">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m22 2-7 20-4-9-9-4Z" />
                                    <path d="M22 2 11 13" />
                                  </svg>
                                </div>
                                <div className="privacy-tool-text">
                                  <h3 className="privacy-tool-title">EmailJS Service</h3>
                                  <p className="privacy-tool-desc">
                                    Securely relays contact form messages directly to my private inbox without building marketing contact lists or sharing your info.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 03: Yours. Full Ownership */}
                    <div className="privacy-bento-split-row">
                      <div className="privacy-bento-sidebar">
                        <div className="privacy-bento-sticky">
                          <span className="privacy-section-num">03</span>
                          <h2 className="privacy-section-heading">Yours.</h2>
                          <p className="privacy-section-subheading">Full Ownership</p>
                        </div>
                      </div>

                      <div className="privacy-bento-main">
                        <div className="bento-card">
                          <div className="about-me-text">
                            <p style={{ marginTop: 0 }}>
                              You own your data. You retain the right to be forgotten at any time. Because this website does not maintain user accounts or persistent visitor profiles, there is no personal browsing history to export or erase. If you have contacted me via the contact form and wish to have your messages or contact info permanently deleted, you may do so without hurdles.
                            </p>

                            <div className="privacy-retention-block">
                              <div className="privacy-retention-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                              </div>
                              <div>
                                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Data Retention</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.55 }}>
                                  Aggregate daily analytics counts are retained for <strong>365 days</strong> in our database before automatic deletion. Contact form inquiries are kept only as long as necessary to converse with you.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Completely Outside the Bento Card/Container */}
                <div className="privacy-outside-meta-bar">
                  <div className="privacy-inquiries">
                    <span className="privacy-inquiries-label">General Inquiries</span>
                    <a href={`mailto:${emailAddress}`} className="privacy-inquiries-link">
                      {emailAddress}
                    </a>
                  </div>

                  <div className="privacy-timestamp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Last updated: September 29, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </SpaceBackground>

          <div className="contact-footer-scale" aria-hidden="true" style={{ position: 'relative', zIndex: 10 }}>
            <Scales orientation="diagonal" size={10} color="rgba(255, 255, 255, 0.1)" />
          </div>
          <Footer />
        </div>
      </div>
    </SmoothScroll>
  )
}
