import React, { useEffect, useRef, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AboutSection from '../components/sections/AboutSection.jsx'
import ProjectSection from '../components/sections/ProjectSection.jsx'
import ContactSection from '../components/sections/ContactSection.jsx'
import './LandingPage.css'
// All section CSS is now consolidated in LandingPage.css

const LandingPage = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const containerRef = useRef(null)
    const isScrollingRef = useRef(false)
    const isNavigatingToHomeRef = useRef(false)
    const [isTransitioningToHome, setIsTransitioningToHome] = useState(false)

    // Generate stars for the global background
    const stars = useMemo(() => [...Array(200)].map((_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: Math.random() > 0.9 ? '3px' : Math.random() > 0.7 ? '2px' : '1px',
        height: Math.random() > 0.9 ? '3px' : Math.random() > 0.7 ? '2px' : '1px',
        duration: `${Math.random() * 3 + 2}s`,
        delay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.7 + 0.3
    })), [])

    // Handle initial scroll
    useEffect(() => {
        const hash = location.hash.replace('#', '')
        const path = location.pathname.replace('/', '')

        // Determine target section
        let targetId = 'about' // Default
        if (hash) targetId = hash
        else if (path === 'project') targetId = 'projects'
        else if (path === 'contact') targetId = 'contact'
        else if (path === 'about') targetId = 'about'

        const element = document.getElementById(targetId)
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        }
    }, [location])

    // Update Navbar on scroll
    useEffect(() => {
        const observerOptions = {
            root: null,
            // Trigger when the element intersects the middle 2% of the viewport
            // This works regardless of element height (even if > viewport)
            rootMargin: '-49% 0px -49% 0px',
            threshold: 0
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isScrollingRef.current) {
                    const id = entry.target.id
                    let route = '/about'
                    if (id === 'projects') route = '/project'
                    if (id === 'contact') route = '/contact'

                    window.dispatchEvent(new CustomEvent('landing-scroll', {
                        detail: { path: route }
                    }))
                }
            })
        }, observerOptions)

        const sections = document.querySelectorAll('.landing-section')
        sections.forEach(sec => observer.observe(sec))

        return () => observer.disconnect()
    }, [])

    // Scroll up to navigate back to Home
    useEffect(() => {
        const handleScrollUp = (e) => {
            if (isNavigatingToHomeRef.current) return

            // Only trigger when at the very top of the page
            const isAtTop = window.scrollY <= 0
            const isScrollingUp = e.deltaY < -30

            if (isAtTop && isScrollingUp) {
                isNavigatingToHomeRef.current = true
                setIsTransitioningToHome(true)
                // Wait for animation to complete before navigating
                setTimeout(() => {
                    navigate('/')
                }, 600)
            }
        }

        // Mobile touch support
        let touchStartY = 0

        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].clientY
        }

        const handleTouchEnd = (e) => {
            if (isNavigatingToHomeRef.current) return

            const touchEndY = e.changedTouches[0].clientY
            const deltaY = touchEndY - touchStartY // positive = swipe down
            const isAtTop = window.scrollY <= 0

            if (isAtTop && deltaY > 50) {
                isNavigatingToHomeRef.current = true
                setIsTransitioningToHome(true)
                setTimeout(() => {
                    navigate('/')
                }, 600)
            }
        }

        window.addEventListener('wheel', handleScrollUp, { passive: true })
        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            window.removeEventListener('wheel', handleScrollUp)
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [navigate])

    return (
        <div className={`landing-page-container ${isTransitioningToHome ? 'transitioning-to-home' : ''}`} ref={containerRef}>            {/* Unified Fixed Background */}
            <div className="landing-background-wrapper">
                <div className="landing-bg-layer" />
                <div className="landing-star-layer">
                    {stars.map((s, i) => (
                        <div
                            key={i}
                            className="landing-tiny-star"
                            style={{
                                left: s.left,
                                top: s.top,
                                width: s.width,
                                height: s.height,
                                animationDuration: s.duration,
                                animationDelay: s.delay,
                                opacity: s.opacity
                            }}
                        />
                    ))}
                </div>
                <div className="landing-shooting-stars">
                    <div className="landing-shooting-star" />
                    <div className="landing-shooting-star" />
                    <div className="landing-shooting-star" />
                    <div className="landing-shooting-star" />
                    <div className="landing-shooting-star" />
                </div>
                <div className="landing-mesh" />
                <div className="landing-mesh-extra" />
                <div className="landing-floor-glow" />
            </div>

            {/* Sections Content - Animation applies here only */}
            <div className={`landing-content-flow ${isTransitioningToHome ? 'transitioning-to-home' : ''}`}>
                <AboutSection />
                <ProjectSection />
                <ContactSection />
            </div>
        </div>
    )
}

export default LandingPage
