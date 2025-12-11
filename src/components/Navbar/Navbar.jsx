import React, { useEffect, useRef, useState, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './Navbar.css'
import GlassSurface from '../GlassSurface/GlassSurface'

const Navbar = () => {
  const indicatorRef = useRef(null)
  const location = useLocation()
  const [indicatorLeft, setIndicatorLeft] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isIPad, setIsIPad] = useState(false)

  // ตรวจจับ iPad
  useEffect(() => {
    const detectIPad = () => {
      const ua = navigator.userAgent;
      // ตรวจจับ iPad (รวมถึง iPad ที่ใช้ iPadOS ที่แสดงเป็น Mac)
      const isIPadUA = /iPad/.test(ua);
      const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
      return isIPadUA || isIPadOS;
    };

    setIsIPad(detectIPad());
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
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  const menuItems = [
    { path: "/", label: "HOME" },
    { path: "/about", label: "ABOUT" },
    { path: "/project", label: "PROJECT" },
    { path: "/contact", label: "CONTACT" }
  ]

  return (
    <>
      {/* Desktop Navbar - ซ่อนถ้าเป็น iPad */}
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
            blur={11}
            displace={3}
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
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                    aria-current={location.pathname === path ? 'page' : undefined}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </GlassSurface>
        </nav>
      )}

      {/* Mobile Fullscreen Navbar - แสดงถ้าเป็น Mobile หรือ iPad */}
      <nav className={`mobile-navbar-fullscreen ${isIPad ? 'show-for-ipad' : ''}`} role="navigation" aria-label="Mobile navigation">
        {/* ใช้ GlassSurface wrapper สำหรับปุ่ม hamburger */}
        <div className="mobile-navbar-toggle-wrapper">
          <GlassSurface
            width={64}
            height={64}
            saturation={1.8}
            brightness={50}
            opacity={0.93}
            borderRadius={50}
            borderWidth={0.1}
            blur={11}
            displace={5}
            backgroundOpacity={0.1}
          >
            <button
              className={`mobile-navbar-toggle-inner ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
                <span className="line line-1"></span>
                <span className="line line-2"></span>
                <span className="line line-3"></span>
              </div>
            </button>
          </GlassSurface>
        </div>

        <div
          className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="mobile-menu-content">
            {/* Glass Header */}
            <div className="mobile-menu-header">
              <div className="brand-text">
                <span className="brand-number">7</span>
                <span className="brand-name">SADAKONR</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="mobile-menu-nav">
              <ul className="mobile-menu-list">
                {menuItems.map(({ path, label }, index) => (
                  <li
                    key={path}
                    className="mobile-menu-item"
                    style={{ '--item-index': index }}
                  >
                    <NavLink
                      to={path}
                      className={({ isActive }) =>
                        `mobile-menu-link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={location.pathname === path ? 'page' : undefined}
                    >
                      <span className="menu-link-text">{label}</span>
                      <div className="menu-link-indicator">
                        <span className="indicator-dot"></span>
                      </div>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar