import { useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import Navbar from './components/Navbar/Navbar'
import { SpaceBackground } from './components/SpaceBackground/SpaceBackground'

import './pages/home.css'
import './pages/LandingPage.css'

// Lazy load components for code splitting
const HeroPage = lazy(() => import('./pages/HeroPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))

function App() {
  // Set up IntersectionObserver to update Navbar based on scroll position
  useEffect(() => {
    const observerOptions = {
        root: null,
        rootMargin: '-49% 0px -49% 0px',
        threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id
                let route = '/'
                if (id === 'about') route = '/about'
                if (id === 'projects') route = '/project'
                if (id === 'contact') route = '/contact'

                window.dispatchEvent(new CustomEvent('landing-scroll', {
                    detail: { path: route }
                }))
            }
        })
    }, observerOptions)

    const sections = document.querySelectorAll('section[id]')
    sections.forEach(sec => observer.observe(sec))

    return () => observer.disconnect()
  }, [])

  return (
    <Router>
      <Analytics />
      
      <Navbar />
      
      <div className="landing-page-container">
        <Suspense fallback={null}>
          <div className="landing-content-flow">
            <SpaceBackground motion="subtle" showPlanet={true} starCount={0}>
              <section id="home">
                <HeroPage />
              </section>
            </SpaceBackground>
            <section id="about">
              <AboutPage />
            </section>
            <section id="projects">
              <ProjectPage />
            </section>
            <section id="contact">
              <ContactPage />
            </section>
          </div>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
