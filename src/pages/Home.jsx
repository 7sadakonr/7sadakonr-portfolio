import { lazy, Suspense } from 'react'
import './home.css'

// Lazy load heavy components
const HeroSection = lazy(() => import('../components/hero-section/hero_section.jsx'))
const Particles = lazy(() => import('../components/BG/Particles.jsx'))

function Home() {
  return (
    <main>
      <div className="home">
        <div className="home-bg" />
        <Suspense fallback={<div className="loading-placeholder">Loading...</div>}>
        </Suspense>
        <div className="home-blur" />
        <div className="home-overlay" />
        <Suspense fallback={null}>
          <Particles />
          <HeroSection />
        </Suspense>
      </div>
    </main>
  )
}

export default Home