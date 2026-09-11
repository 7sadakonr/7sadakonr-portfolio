import { Suspense, useEffect, useState, lazy } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Preloader from './components/Preloader/Preloader'
import { SpaceBackground } from './components/SpaceBackground/SpaceBackground'
import SmoothScroll from './components/SmoothScroll/SmoothScroll'
import LazySection from './components/LazySection/LazySection'
import {
  loadAboutPage,
  loadContactPage,
  loadNavbar,
  loadPageEnd,
  loadProjectPage,
} from './utils/runtimeWarmup'
import { getRouteForSection } from './features/navigation/navigation.config'
import { publishSectionChange } from './features/navigation/navigationEvents'
import { isNavigationInProgress } from './features/navigation/navigationState'
import { Seo } from './components/Seo/Seo'
import { scheduleBelowFoldHydration } from './components/LazySection/sectionLoader'
import { scheduleAfterPaint, scheduleIdleWork } from './utils/runtimeScheduler'

import './pages/LandingPageShell.css'

// Lazy load components for code splitting
import HeroPage from './pages/HeroPage'
const AboutPage = lazy(loadAboutPage)
const ProjectPage = lazy(loadProjectPage)
const ContactPage = lazy(loadContactPage)
const PageEnd = lazy(loadPageEnd)
const Navbar = lazy(loadNavbar)
const Analytics = lazy(() => import('@vercel/analytics/react').then(({ Analytics: Component }) => ({ default: Component })))
const AdminRoutes = lazy(() => import('./features/admin/AdminRoutes'))

const PRELOADER_SEEN_KEY = 'portfolio_preloader_seen_v1'

const getPreloaderMode = (): 'full' | 'short' => {
  try {
    return window.sessionStorage.getItem(PRELOADER_SEEN_KEY) === 'true' ? 'short' : 'full'
  } catch {
    return 'full'
  }
}

function PortfolioApp() {
  const [isCriticalReady, setIsCriticalReady] = useState(false)
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true)
  const [isNavbarReady, setIsNavbarReady] = useState(false)
  const [isVercelAnalyticsReady, setIsVercelAnalyticsReady] = useState(false)
  const [allowIdleLenis, setAllowIdleLenis] = useState(false)
  const [allowIdleBeams, setAllowIdleBeams] = useState(false)
  const [preloaderMode] = useState(getPreloaderMode)

  useEffect(() => {
    if (!isCriticalReady) return
    let cancelled = false
    const cancelSettings = scheduleIdleWork(() => {
      void import('./features/siteSettings/api/siteSettingsRepository').then(
        ({ loadSiteSettings }) => { void loadSiteSettings().catch(() => undefined) },
        () => undefined,
      ).finally(() => {
        if (!cancelled) scheduleAnalytics()
      })
    })
    let cancelAnalytics: (() => void) | undefined
    let cancelLenis: (() => void) | undefined
    let cancelBeams: (() => void) | undefined
    let cancelSections: (() => void) | undefined
    let cleanupSections: (() => void) | undefined
    let cleanupScroll: (() => void) | undefined

    const scheduleSections = () => {
      cancelSections = scheduleIdleWork(() => {
        if (!cancelled) cancelSections = scheduleBelowFoldHydration()
      })
    }

    const scheduleBeams = () => {
      cancelBeams = scheduleIdleWork(() => {
        if (cancelled) return
        setAllowIdleBeams(true)
        scheduleSections()
      })
    }

    const scheduleLenis = () => {
      cancelLenis = scheduleIdleWork(() => {
        if (cancelled) return
        setAllowIdleLenis(true)
        scheduleBeams()
      })
    }

    const scheduleAnalytics = () => {
      cancelAnalytics = scheduleIdleWork(() => {
        void Promise.all([
          import('./lib/analytics/tracker'),
          import('./lib/analytics/sections'),
          import('./lib/analytics/scroll'),
        ]).then(([tracker, sections, scroll]) => {
          if (cancelled) return
          tracker.initAnalytics()
          cleanupSections = sections.initSectionTracking()
          cleanupScroll = scroll.initScrollTracking()
          setIsVercelAnalyticsReady(true)
        }).catch(() => undefined).finally(() => {
          if (!cancelled) scheduleLenis()
        })
      })
    }

    return () => {
      cancelled = true
      cancelSettings?.()
      cancelAnalytics?.()
      cancelLenis?.()
      cancelBeams?.()
      cancelSections?.()
      cleanupSections?.()
      cleanupScroll?.()
    }
  }, [isCriticalReady])

  useEffect(() => {
    if (!isCriticalReady) return
    return scheduleAfterPaint(() => setIsNavbarReady(true))
  }, [isCriticalReady])

  // Set up IntersectionObserver to update Navbar based on scroll position
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-49% 0px -49% 0px',
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (isNavigationInProgress()) return // Prevent bouncing during manual navigation

          const id = entry.target.id
          const route = getRouteForSection(id)

          if (route) {
            publishSectionChange(route)
          }
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((sec) => observer.observe(sec))

    return () => observer.disconnect()
  }, [])

  return (
    <SmoothScroll isPrepared={isCriticalReady} isEnabled={isCriticalReady} allowIdleLoad={allowIdleLenis}>
      <Seo />
      {isPreloaderVisible && (
        <Preloader
          isCriticalReady={isCriticalReady}
          mode={preloaderMode}
          onComplete={() => {
            try { window.sessionStorage.setItem(PRELOADER_SEEN_KEY, 'true') } catch { /* storage is optional */ }
            setIsPreloaderVisible(false)
          }}
        />
      )}
      {isVercelAnalyticsReady && (
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      )}
      {isNavbarReady && (
        <Suspense fallback={null}>
          <Navbar isInteractive={isCriticalReady} />
        </Suspense>
      )}

      <div className="landing-page-container">
        <div className="landing-content-flow">
          <SpaceBackground motion="none" showPlanet={true} isActive={allowIdleBeams}>
            <section id="home">
              <HeroPage
                effectsEnabled={isCriticalReady}
                allowIdleEffects={allowIdleBeams}
                onCriticalReady={() => setIsCriticalReady(true)}
              />
            </section>
          </SpaceBackground>
          <LazySection id="about" canLoad={isCriticalReady}>
            <AboutPage />
          </LazySection>
          <LazySection id="projects" canLoad={isCriticalReady}>
            <ProjectPage />
          </LazySection>
          <LazySection id="contact" canLoad={isCriticalReady}>
            <ContactPage />
            <PageEnd />
          </LazySection>
        </div>
      </div>
    </SmoothScroll>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminRoutes /></Suspense>} />
        <Route path="*" element={<PortfolioApp />} />
      </Routes>
    </Router>
  )
}

export default App
