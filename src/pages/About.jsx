import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './about.css'
import AnimatedContent from '../components/Animation/AnimatedContent.jsx'
import resumePDF from '../assets/resume.pdf'

const About = () => {
  const navigate = useNavigate()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState('up')
  const isNavigatingRef = useRef(false)

  const handleNavigate = useCallback((direction) => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setTransitionDirection(direction)
    setIsTransitioning(true)

    setTimeout(() => {
      window.scrollTo(0, 0)
      if (direction === 'up') {
        navigate('/')
      } else {
        navigate('/project')
      }
    }, 600)
  }, [navigate])

  useEffect(() => {
    document.body.classList.add('about-page')

    // Desktop scroll navigation
    const handleWheel = (e) => {
      if (isNavigatingRef.current) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      const atTop = scrollTop <= 5
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10

      // Scroll up at top → go to Home
      if (atTop && e.deltaY < -80) {
        handleNavigate('up')
      }
      // Scroll down at bottom → go to Project
      else if (atBottom && e.deltaY > 80) {
        handleNavigate('down')
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
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      const atTop = scrollTop <= 5
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10

      // Swipe up at bottom → go to Project
      if (atBottom && deltaY > 100) {
        handleNavigate('down')
      }
      // Swipe down at top → go to Home
      else if (atTop && deltaY < -100) {
        handleNavigate('up')
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.body.classList.remove('about-page')
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleNavigate])

  // Generate stars like Loading page
  const stars = useMemo(() => [...Array(250)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() > 0.98 ? '3px' : Math.random() > 0.9 ? '2px' : '1px',
    duration: Math.random() * 6 + 4 + 's',
    delay: Math.random() * 5 + 's'
  })), [])

  // Resume download handler
  const handleResumeDownload = () => {
    const link = document.createElement('a')
    link.href = resumePDF
    link.download = 'Jetsadakorn_Resume.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`about-page-wrapper ${isTransitioning ? `transitioning-${transitionDirection}` : ''}`}>
      {/* Background Elements - Universe Theme */}
      <div className="about-bg" />

      {/* Stars Layer */}
      <div className="about-star-layer">
        {stars.map((s) => (
          <div
            key={s.id}
            className="about-tiny-star"
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
      <div className="about-shooting-stars">
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
      </div>

      <div className="about-mesh" />
      <div className="about-mesh-extra" />
      <div className="about-floor-glow" />
      <div className="about-vignette" />

      {/* Main Content */}
      <div className="about-content">

        {/* Hero Section */}
        <section className="about-hero">
          <AnimatedContent
            distance={60}
            direction="vertical"
            duration={1}
            initialOpacity={0}
            delay={0.25}
          >
            <h1 className="about-hero-title">
              Hi, I'm <span className="gradient-text">
                <span className="gradient-text-glow">Jetsadakorn</span>
                <span className="gradient-text-content">Jetsadakorn</span>
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
            <p className="about-hero-subtitle">
              A passionate Computer Science Student exploring the intersection of technology and creativity.
              Currently focused on web development, UI/UX design, and building meaningful digital experiences.
            </p>
          </AnimatedContent>

          <AnimatedContent
            distance={40}
            direction="vertical"
            duration={1}
            initialOpacity={0}
            delay={0.55}
          >
            <button onClick={handleResumeDownload} className="resume-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download Resume
            </button>
          </AnimatedContent>
        </section>

        {/* About Me Section */}
        <section className="about-section">
          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.1}
          >
            <h2 className="section-title">About Me</h2>
          </AnimatedContent>

          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.2}
          >
            <div className="glass-card">
              <div className="about-me-content">
                <div className="about-me-text">
                  <p>
                    I'm a <span className="highlight-text">Computer Science student</span> with a deep passion for
                    creating elegant solutions to complex problems. My journey in tech started with curiosity
                    about how things work, and has evolved into a commitment to building
                    <span className="gradient-highlight"> innovative digital experiences</span>.
                  </p>
                  <p>
                    When I'm not coding, you can find me exploring new design trends, learning about emerging
                    technologies, or working on personal projects that challenge me to grow. I believe in the
                    power of continuous learning and pushing boundaries.
                  </p>
                  <p>
                    Currently, I'm focused on <span className="highlight-text">full-stack web development</span> and
                    creating user-centric interfaces that are both beautiful and functional.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </section>

        {/* Skills Section */}
        <section className="about-section">
          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.1}
          >
            <h2 className="section-title">Skills</h2>
          </AnimatedContent>

          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.2}
          >
            <div className="skills-list">
              <div className="skill-item">
                <svg className="skill-logo" viewBox="0 0 128 128">
                  <path fill="#E44D26" d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"></path>
                  <path fill="#F16529" d="M64 116.8l36.378-10.086 8.559-95.878H64z"></path>
                  <path fill="#EBEBEB" d="M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.33 3.692 3.382 37.927H64zm0 35.743l-.061.017-15.327-4.14-.979-10.975H33.816l1.928 21.609 28.193 7.826.063-.017z"></path>
                  <path fill="#fff" d="M63.952 52.455v13.763h16.947l-1.597 17.849-15.35 4.143v14.319l28.215-7.82.207-2.325 3.234-36.233.335-3.696h-3.708zm0-27.856v13.762h33.244l.276-3.092.628-6.978.329-3.692z"></path>
                </svg>
                <span>HTML</span>
              </div>
              <div className="skill-item">
                <svg className="skill-logo" viewBox="0 0 128 128">
                  <path fill="#1572B6" d="M18.814 114.123L8.76 1.352h110.48l-10.064 112.754-45.243 12.543z"></path>
                  <path fill="#33A9DC" d="M64.001 117.062l36.559-10.136 8.601-96.354h-45.16z"></path>
                  <path fill="#fff" d="M64.001 51.429h18.302l1.264-14.163H64.001V23.435h34.682l-.332 3.711-3.4 38.114H64.001z"></path>
                  <path fill="#EBEBEB" d="M64.083 87.349l-.061.018-15.403-4.159-.985-11.031H33.752l1.937 21.717 28.331 7.863.063-.018z"></path>
                  <path fill="#fff" d="M81.127 64.675l-1.666 18.522-15.426 4.164v14.39l28.354-7.858.208-2.337 2.406-26.881z"></path>
                  <path fill="#EBEBEB" d="M64.048 23.435v13.831H30.64l-.277-3.108-.63-7.012-.331-3.711zm-.047 27.994v13.831H48.792l-.277-3.108-.631-7.012-.33-3.711z"></path>
                </svg>
                <span>CSS</span>
              </div>
              <div className="skill-item">
                <svg className="skill-logo" viewBox="0 0 128 128">
                  <path fill="#F0DB4F" d="M1.408 1.408h125.184v125.184H1.408z"></path>
                  <path fill="#323330" d="M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z"></path>
                </svg>
                <span>JavaScript</span>
              </div>
              <div className="skill-item">
                <svg className="skill-logo" viewBox="0 0 128 128">
                  <g fill="#61DAFB"><circle cx="64" cy="64" r="11.4"></circle><path d="M107.3 45.2c-2.2-.8-4.5-1.6-6.9-2.3.6-2.4 1.1-4.8 1.5-7.1 2.1-13.2-.2-22.5-6.6-26.1-1.9-1.1-4-1.6-6.4-1.6-7 0-15.9 5.2-24.9 13.9-9-8.7-17.9-13.9-24.9-13.9-2.4 0-4.5.5-6.4 1.6-6.4 3.7-8.7 13-6.6 26.1.4 2.3.9 4.7 1.5 7.1-2.4.7-4.7 1.4-6.9 2.3-12.5 4.8-19.3 11.4-19.3 18.8s6.9 14 19.3 18.8c2.2.8 4.5 1.6 6.9 2.3-.6 2.4-1.1 4.8-1.5 7.1-2.1 13.2.2 22.5 6.6 26.1 1.9 1.1 4 1.6 6.4 1.6 7.1 0 16-5.2 24.9-13.9 9 8.7 17.9 13.9 24.9 13.9 2.4 0 4.5-.5 6.4-1.6 6.4-3.7 8.7-13 6.6-26.1-.4-2.3-.9-4.7-1.5-7.1 2.4-.7 4.7-1.4 6.9-2.3 12.5-4.8 19.3-11.4 19.3-18.8s-6.8-14-19.3-18.8zM92.5 14.7c4.1 2.4 5.5 9.8 3.8 20.3-.3 2.1-.8 4.3-1.4 6.6-5.2-1.2-10.7-2-16.5-2.5-3.4-4.8-6.9-9.1-10.4-13 7.4-7.3 14.9-12.3 21-12.3 1.3 0 2.5.3 3.5.9zM81.3 74c-1.8 3.2-3.9 6.4-6.1 9.6-3.7.3-7.4.4-11.2.4-3.9 0-7.6-.1-11.2-.4-2.2-3.2-4.2-6.4-6-9.6-1.9-3.3-3.7-6.7-5.3-10 1.6-3.3 3.4-6.7 5.3-10 1.8-3.2 3.9-6.4 6.1-9.6 3.7-.3 7.4-.4 11.2-.4 3.9 0 7.6.1 11.2.4 2.2 3.2 4.2 6.4 6 9.6 1.9 3.3 3.7 6.7 5.3 10-1.7 3.3-3.4 6.6-5.3 10zm8.3-3.3c1.5 3.5 2.7 6.9 3.8 10.3-3.4.8-7 1.4-10.8 1.9 1.2-1.9 2.5-3.9 3.6-6 1.2-2.1 2.3-4.2 3.4-6.2zM64 97.8c-2.4-2.6-4.7-5.4-6.9-8.3 2.3.1 4.6.2 6.9.2 2.3 0 4.6-.1 6.9-.2-2.2 2.9-4.5 5.7-6.9 8.3zm-18.6-15c-3.8-.5-7.4-1.1-10.8-1.9 1.1-3.3 2.3-6.8 3.8-10.3 1.1 2 2.2 4.1 3.4 6.1 1.2 2.2 2.4 4.1 3.6 6.1zm-7-25.5c-1.5-3.5-2.7-6.9-3.8-10.3 3.4-.8 7-1.4 10.8-1.9-1.2 1.9-2.5 3.9-3.6 6-1.2 2.1-2.3 4.2-3.4 6.2zM64 30.2c2.4 2.6 4.7 5.4 6.9 8.3-2.3-.1-4.6-.2-6.9-.2-2.3 0-4.6.1-6.9.2 2.2-2.9 4.5-5.7 6.9-8.3zm22.2 21l-3.6-6c3.8.5 7.4 1.1 10.8 1.9-1.1 3.3-2.3 6.8-3.8 10.3-1.1-2.1-2.2-4.2-3.4-6.2zM31.7 35c-1.7-10.5-.3-17.9 3.8-20.3 1-.6 2.2-.9 3.5-.9 6 0 13.5 4.9 21 12.3-3.5 3.8-7 8.2-10.4 13-5.8.5-11.3 1.4-16.5 2.5-.6-2.3-1-4.5-1.4-6.6zM7 64c0-4.7 5.7-9.7 15.7-13.4 2-.8 4.2-1.5 6.4-2.1 1.6 5 3.6 10.3 6 15.6-2.4 5.3-4.5 10.5-6 15.5-13.8-4-22.1-10-22.1-15.6zm28.5 49.3c-4.1-2.4-5.5-9.8-3.8-20.3.3-2.1.8-4.3 1.4-6.6 5.2 1.2 10.7 2 16.5 2.5 3.4 4.8 6.9 9.1 10.4 13-7.4 7.3-14.9 12.3-21 12.3-1.3 0-2.5-.3-3.5-.9zM96.3 93c1.7 10.5.3 17.9-3.8 20.3-1 .6-2.2.9-3.5.9-6 0-13.5-4.9-21-12.3 3.5-3.8 7-8.2 10.4-13 5.8-.5 11.3-1.4 16.5-2.5.6 2.3 1 4.5 1.4 6.6zm9-15.6c-2 .8-4.2 1.5-6.4 2.1-1.6-5-3.6-10.3-6-15.6 2.4-5.3 4.5-10.5 6-15.5 13.8 4 22.1 10 22.1 15.6 0 4.7-5.8 9.7-15.7 13.4z"></path></g>
                </svg>
                <span>React</span>
              </div>
              <div className="skill-item">
                <svg className="skill-logo" viewBox="0 0 128 128">
                  <path fill="#0acf83" d="M45.5 129c11.9 0 21.5-9.6 21.5-21.5V86H45.5C33.6 86 24 95.6 24 107.5S33.6 129 45.5 129zm0 0"></path>
                  <path fill="#a259ff" d="M24 64.5C24 52.6 33.6 43 45.5 43H67v43H45.5C33.6 86 24 76.4 24 64.5zm0 0"></path>
                  <path fill="#f24e1e" d="M24 21.5C24 9.6 33.6 0 45.5 0H67v43H45.5C33.6 43 24 33.4 24 21.5zm0 0"></path>
                  <path fill="#ff7262" d="M67 0h21.5C100.4 0 110 9.6 110 21.5S100.4 43 88.5 43H67zm0 0"></path>
                  <path fill="#1abcfe" d="M110 64.5c0 11.9-9.6 21.5-21.5 21.5S67 76.4 67 64.5 76.6 43 88.5 43 110 52.6 110 64.5zm0 0"></path>
                </svg>
                <span>Figma</span>
              </div>
            </div>
          </AnimatedContent>
        </section>

        {/* Education Section */}
        <section className="about-section">
          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.1}
          >
            <h2 className="section-title">Education</h2>
          </AnimatedContent>

          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.2}
          >
            <div className="glass-card">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-date">2023 - Present</div>
                  <div className="timeline-title">Bachelor of Science in Computer Science</div>
                  <div className="timeline-subtitle">Ragamangala University of Technology Suvarnabhumi Huntra</div>
                  <div className="timeline-description">
                    Studying computer science fundamentals, software engineering, data structures,
                    algorithms, and modern development practices.
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-date">2020 - 2022</div>
                  <div className="timeline-title">
                    Vocational certificate in Information Technology
                  </div>
                  <div className="timeline-subtitle">Ayutthaya Technological Commercial College</div>
                  <div className="timeline-description">
                    Focused on practical IT skills, including hardware maintenance, software troubleshooting, and basic web development.
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact-section about-section">
          <AnimatedContent
            distance={50}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.1}
          >
            <h2 className="section-title">Let's Connect</h2>
          </AnimatedContent>

          <AnimatedContent
            distance={40}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.2}
          >
            <p className="about-hero-subtitle" style={{ marginBottom: '0' }}>
              I'm always open to new opportunities, collaborations, and conversations.
            </p>
          </AnimatedContent>

          <AnimatedContent
            distance={40}
            direction="vertical"
            duration={0.8}
            initialOpacity={0}
            delay={0.3}
          >
            <div className="contact-links">
              <a href="7sadakonr@gmail.com" className="contact-link">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                Email
              </a>

              <a href="https://github.com/7sadakonr" target="_blank" rel="noopener noreferrer" className="contact-link">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </AnimatedContent>
        </section>

      </div>
    </div>
  )
}

export default About