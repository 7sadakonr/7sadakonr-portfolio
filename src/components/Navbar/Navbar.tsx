import React, { useEffect, useRef, useState, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './Navbar.css'
import GlassSurface from '../GlassSurface/GlassSurface'
import CommandMenu from '../CommandMenu/CommandMenu'

const Navbar = () => {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const [indicatorLeft, setIndicatorLeft] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isIPad, setIsIPad] = useState(false)
  const [isMac, setIsMac] = useState(true)

  // Detect iPad and Mac
  useEffect(() => {
    const ua = navigator.userAgent;
    const detectIPad = () => {
      const isIPadUA = /iPad/.test(ua);
      const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
      return isIPadUA || isIPadOS;
    };

    setIsIPad(detectIPad());
    setIsMac(/Mac|iPhone|iPod|iPad/i.test(ua));
  }, []);

  const updateIndicatorPosition = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const activeLink = document.querySelector('.nav-item.active')
      const navLinks = document.querySelector('.nav-links')

      if (activeLink && navLinks) {
        const parentRect = navLinks.getBoundingClientRect()
        const rect = activeLink.getBoundingClientRect()

        if (rect && parentRect) {
          const left = rect.left - parentRect.left + (rect.width / 2) - (65 / 2)
          setIndicatorLeft(Math.max(0, left))

          if (!hasInitialized) {
            setHasInitialized(true)
          }
        }
      }
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [hasInitialized])

  // Initial position (no animation)
  useEffect(() => {
    if (!isIPad) {
      const timeoutId = setTimeout(() => {
        updateIndicatorPosition()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [updateIndicatorPosition, isIPad])

  // Update on route change (with animation)
  useEffect(() => {
    if (!isIPad && hasInitialized) {
      const timeoutId = setTimeout(() => {
        updateIndicatorPosition()
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [location.pathname, hasInitialized, updateIndicatorPosition, isIPad])

  useEffect(() => {
    if (!isIPad) {
      const handleResize = () => {
        updateIndicatorPosition()
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [updateIndicatorPosition, isIPad])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsMobileMenuOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [activePath, setActivePath] = useState(location.pathname)

  // Update active path on mount and location change
  useEffect(() => {
    setActivePath(location.pathname)
  }, [location.pathname])

  // Listen for scroll events from LandingPage
  useEffect(() => {
    const handleLandingScroll = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>
      if (customEvent.detail && customEvent.detail.path) {
        setActivePath(customEvent.detail.path)
      }
    }

    window.addEventListener('landing-scroll', handleLandingScroll)
    return () => window.removeEventListener('landing-scroll', handleLandingScroll)
  }, [])

  // Update indicator when activePath changes (for LandingPage scroll)
  useEffect(() => {
    if (!isIPad && hasInitialized) {
      // Wait for DOM to update after activePath state change
      const timeoutId = setTimeout(() => {
        updateIndicatorPosition()
      }, 200)
      return () => clearTimeout(timeoutId)
    }
  }, [activePath, hasInitialized, updateIndicatorPosition, isIPad])

  const menuItems = [
    { path: "/", label: "HOME" },
    { path: "/about", label: "ABOUT" },
    { path: "/project", label: "PROJECT" },
    { path: "/contact", label: "CONTACT" }
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    let targetId = 'home';
    if (path === '/about') targetId = 'about';
    if (path === '/project') targetId = 'projects';
    if (path === '/contact') targetId = 'contact';

    const element = document.getElementById(targetId);
    if (element) {
      e.preventDefault();
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', path);
      setActivePath(path);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      {!isIPad && (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
          <GlassSurface
            width={595}
            height={65}
            saturation={1.8}
            brightness={50}
            opacity={0.93}
            borderRadius={50}
            borderWidth={0.1}
            blur={20}
            displace={4}
            backgroundOpacity={0.05}
          >
            <div
              ref={indicatorRef}
              className={`nav-indicator ${hasInitialized ? 'initialized' : ''}`}
              style={{
                left: `${indicatorLeft}px`,
                transition: hasInitialized ? 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
              aria-hidden="true"
            />
            <ul className="nav-links">
              {menuItems.map(({ path, label }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={(e) => handleNavClick(e, path)}
                    className={() => activePath === path ? 'nav-item active' : 'nav-item'}
                    aria-current={activePath === path ? 'page' : undefined}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </GlassSurface>

          <div className="desktop-command-hint" aria-hidden="true">
            {isMac ? (
              <span style={{ fontSize: '16px' }}>⌘</span>
            ) : (
              <svg width="38" height="22" viewBox="0 0 38 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '1px' }}>
                <rect x="1.5" y="1.5" width="35" height="19" rx="4.5" />
                <text x="19" y="15" fontSize="11.5" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="500" fontFamily="Outfit, sans-serif" letterSpacing="0.5">ctrl</text>
              </svg>
            )}
            <span style={{ fontSize: '15px', fontWeight: '500' }}>K</span>
          </div>
        </nav>
      )}

      {/* Mobile Fullscreen Navbar */}
      <nav className={`mobile-navbar-fullscreen ${isIPad ? 'show-for-ipad' : ''}`} role="navigation" aria-label="Mobile navigation">
        <div className="mobile-pill-container">
          <GlassSurface
            width={180}
            height={45}
            saturation={1.8}
            brightness={50}
            opacity={0.93}
            borderRadius={50}
            borderWidth={0.1}
            blur={15}
            displace={3}
            backgroundOpacity={0.08}
          >
            <button 
              className="command-pill-button" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open command menu"
            >
              <svg className="pill-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span className="pill-text">Search...</span>
              <span className="pill-shortcut">{isMac ? '⌘K' : 'Ctrl K'}</span>
            </button>
          </GlassSurface>
        </div>
      </nav>

      <CommandMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        menuItems={menuItems}
        activePath={activePath}
        handleNavClick={handleNavClick}
      />
    </>
  )
}

export default Navbar
