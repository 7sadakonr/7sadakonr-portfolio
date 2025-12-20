import { lazy, Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './home.css'

// Lazy load heavy components
const HeroSection = lazy(() => import('../components/hero-section/hero_section.jsx'))
const Particles = lazy(() => import('../components/BG/Particles.jsx'))

function Home() {
  const navigate = useNavigate()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isNavigatingRef = useRef(false)

  const handleNavigate = useCallback(() => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setIsTransitioning(true)

    // Wait for transition animation to complete before navigating
    setTimeout(() => {
      window.scrollTo(0, 0)
      navigate('/about')
    }, 600)
  }, [navigate])

  useEffect(() => {
    // Add home-page class to body
    document.body.classList.add('home-page')

    // Desktop: Single scroll down triggers navigation
    const handleWheel = (e) => {
      if (isNavigatingRef.current) return
      if (e.deltaY > 30) {
        handleNavigate()
      }
    }

    // Mobile: Single swipe up triggers navigation
    let touchStartY = 0

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
      if (isNavigatingRef.current) return
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchStartY - touchEndY

      if (deltaY > 50) {
        handleNavigate()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.body.classList.remove('home-page')
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleNavigate])

  return (
    <main>
      <div className={`home ${isTransitioning ? 'transitioning-out' : ''}`}>
        <div className="home-bg" />
        <Suspense fallback={<div className="loading-placeholder">Loading...</div>}>
        </Suspense>
        <div className="home-blur" />
        <div className="home-overlay" />
        <Suspense fallback={null}>
          <Particles />
          <HeroSection />
        </Suspense>

        {/* Scroll indicator */}
        <div className={`scroll-indicator ${isTransitioning ? 'hidden' : ''}`}>
          <div className="scroll-indicator-mouse">
            <div className="scroll-indicator-wheel"></div>
          </div>
          <span className="scroll-indicator-text">Scroll to explore</span>
        </div>
      </div>
    </main>
  )
}

export default Home