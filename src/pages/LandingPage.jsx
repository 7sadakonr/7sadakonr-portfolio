import React, { useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import AboutSection from '../components/sections/AboutSection.jsx'
import ProjectSection from '../components/sections/ProjectSection.jsx'
import ContactSection from '../components/sections/ContactSection.jsx'
import './LandingPage.css'
// Ensuring about.css is imported for the background styles
import '../pages/about.css'

const LandingPage = () => {
    const location = useLocation()
    const containerRef = useRef(null)
    const isScrollingRef = useRef(false)

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

    return (
        <div className="landing-page-container" ref={containerRef}>
            {/* Unified Fixed Background */}
            <div className="landing-background-wrapper">
                <div className="about-bg" /> {/* Reuse about-bg matching styles */}
                <div className="about-star-layer">
                    {stars.map((s, i) => (
                        <div
                            key={i}
                            className="about-tiny-star"
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
                <div className="about-shooting-stars">
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
            </div>

            {/* Sections Content */}
            <div className="landing-content-flow">
                <AboutSection />
                <ProjectSection />
                <ContactSection />
            </div>
        </div>
    )
}

export default LandingPage
