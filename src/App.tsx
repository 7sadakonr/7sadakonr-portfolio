import { Suspense, useEffect, useState, lazy } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Preloader from './components/Preloader/Preloader'
import { SpaceBackground } from './components/SpaceBackground/SpaceBackground'
import SmoothScroll from './components/SmoothScroll/SmoothScroll'
import LazySection from './components/LazySection/LazySection'
import {
  loadAboutPage,
  loadContactPage,
  loadPageEnd,
  loadProjectPage,
  warmBackgroundRuntime,
} from './utils/runtimeWarmup'
import { getRouteForSection } from './features/navigation/navigation.config'
import { publishSectionChange } from './features/navigation/navigationEvents'
import { isNavigationInProgress } from './features/navigation/navigationState'

import './pages/LandingPage.css'

// Lazy load components for code splitting
import HeroPage from './pages/HeroPage'
const AboutPage = lazy(loadAboutPage)
const ProjectPage = lazy(loadProjectPage)
const ContactPage = lazy(loadContactPage)
const PageEnd = lazy(loadPageEnd)
const Analytics = lazy(() => import('@vercel/analytics/react').then(({ Analytics: Component }) => ({ default: Component })))

function App() {
  const [isCriticalReady, setIsCriticalReady] = useState(false)
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true)
  const isInteractive = isCriticalReady && !isPreloaderVisible

  // The hero owns the critical rendering window. Every nonessential download
  // begins only after its image has painted.
  useEffect(() => {
    if (!isInteractive) return
    return warmBackgroundRuntime()
  }, [isInteractive])

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
                if (isNavigationInProgress()) return; // Prevent bouncing during manual navigation
                
                const id = entry.target.id
                const route = getRouteForSection(id)

                if (route) {
                    publishSectionChange(route)
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
      <SmoothScroll isPrepared={isInteractive} isEnabled={isInteractive}>
        {isPreloaderVisible && <Preloader onComplete={() => setIsPreloaderVisible(false)} />}
        {isInteractive && (
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        )}
        <Navbar isInteractive={isInteractive} />
        
        <div className="landing-page-container">
          <div className="landing-content-flow">
            <SpaceBackground motion="none" showPlanet={true} isActive={isInteractive}>
              <section id="home">
                <HeroPage onCriticalReady={() => setIsCriticalReady(true)} />
              </section>
            </SpaceBackground>
            <LazySection id="about" canLoad={isInteractive}>
                <AboutPage />
            </LazySection>
            <LazySection id="projects" canLoad={isInteractive}>
                <ProjectPage />
            </LazySection>
            <LazySection id="contact" canLoad={isInteractive}>
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
