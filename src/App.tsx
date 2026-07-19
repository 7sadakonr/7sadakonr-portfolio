import { useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import Navbar from './components/Navbar/Navbar'
import { SpaceBackground } from './components/SpaceBackground/SpaceBackground'

import './pages/home.css'
import './pages/LandingPage.css'

// Lazy load components for code splitting
import HeroPage from './pages/HeroPage'
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
                if ((window as any).isNavigating) return; // Prevent bouncing during manual navigation
                
                const id = entry.target.id
                let route = null
                if (['home'].includes(id)) route = '/'
                if (['about', 'about-me', 'skills'].includes(id)) route = '/about'
                if (['projects'].includes(id)) route = '/project'
                if (['contact'].includes(id)) route = '/contact'

                if (route) {
                    window.dispatchEvent(new CustomEvent('landing-scroll', {
                        detail: { path: route }
                    }))
                }
            }
        })
    }, observerOptions)

    // Function to find and observe sections
    const observeSections = () => {
        const sections = document.querySelectorAll('section[id]')
        sections.forEach(sec => observer.observe(sec))
        if (sections.length >= 4) {
            return true
        }
        return false
    }

    // Try immediately
    if (!observeSections()) {
        // If not found (due to Suspense), wait for them to mount
        const mutationObserver = new MutationObserver(() => {
            if (observeSections()) {
                mutationObserver.disconnect()
            }
        })
        mutationObserver.observe(document.body, { childList: true, subtree: true })
        return () => {
            observer.disconnect()
            mutationObserver.disconnect()
        }
    }

    return () => observer.disconnect()
  }, [])

  return (
    <Router>
      <Analytics />
      
      <Navbar />
      
      <div className="landing-page-container">
        <div className="landing-content-flow">
          <SpaceBackground motion="subtle" showPlanet={true} starCount={0}>
            <section id="home">
              <HeroPage />
            </section>
          </SpaceBackground>
          <Suspense fallback={null}>
            <section id="about">
              <AboutPage />
            </section>
            <section id="projects">
              <ProjectPage />
            </section>
            <section id="contact">
              <ContactPage />
            </section>
          </Suspense>
        </div>
      </div>
    </Router>
  )
}

export default App
