import { useEffect, useState, lazy } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import Navbar from './components/Navbar/Navbar'
import Preloader from './components/Preloader/Preloader'
import { SpaceBackground } from './components/SpaceBackground/SpaceBackground'
import SmoothScroll from './components/SmoothScroll/SmoothScroll'
import LazySection from './components/LazySection/LazySection'
import { warmPortfolioRuntime } from './utils/runtimeWarmup'

import './pages/LandingPage.css'

// Lazy load components for code splitting
import HeroPage from './pages/HeroPage'
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PageEnd = lazy(() => import('./components/PageEnd/PageEnd'))

function App() {
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true)
  const [isHeroRevealed, setIsHeroRevealed] = useState(false)

  // Use the time covered by the preloader to warm interaction/effect code,
  // lazy page chunks and below-the-fold images before the user reaches them.
  useEffect(() => {
    warmPortfolioRuntime()
  }, [])

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
                if (window.isNavigating) return; // Prevent bouncing during manual navigation
                
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

    const sections = document.querySelectorAll('section[id]')
    sections.forEach(sec => observer.observe(sec))

    return () => observer.disconnect()
  }, [])

  return (
    <Router>
      <SmoothScroll>
        <Analytics />
        {isPreloaderVisible && (
          <Preloader
            onReveal={() => setIsHeroRevealed(true)}
            onComplete={() => setIsPreloaderVisible(false)}
          />
        )}
        <Navbar />
        
        <div className="landing-page-container">
          <div className="landing-content-flow">
            <SpaceBackground motion="none" showPlanet={true}>
              <section id="home">
                <HeroPage isRevealed={isHeroRevealed} />
              </section>
            </SpaceBackground>
            <LazySection id="about">
                <AboutPage />
            </LazySection>
            <LazySection id="projects">
                <ProjectPage />
            </LazySection>
            <LazySection id="contact">
                <ContactPage />
                <PageEnd />
            </LazySection>
          </div>
        </div>
      </SmoothScroll>
    </Router>
  )
}

export default App
