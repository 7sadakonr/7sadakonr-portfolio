import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './Navbar.css'
import GlassSurface from '../GlassSurface/GlassSurface'
import { scrollToTarget } from '../SmoothScroll/scrollController'
import { ensureTargetReady, getOwningSection } from '../LazySection/sectionLoader'

const CommandMenu = React.lazy(() => import('../CommandMenu/CommandMenu'))

const NAVBAR_GLASS_PRESET =
  /* NAVBAR_GLASS_PRESET_START */
  {
    "borderRadius": 25,
    "borderWidth": 0.07,
    "brightness": 77,
    "opacity": 0.8,
    "blur": 6,
    "displace": 1,
    "frostBlur": 5,
    "frostGrain": 0,
    "backgroundOpacity": 0.53,
    "saturation": 2.13,
    "distortionScale": 70,
    "redOffset": 0,
    "greenOffset": 5,
    "blueOffset": 5,
    "xChannel": "R",
    "yChannel": "G",
    "mixBlendMode": "darken"
  } as const
  /* NAVBAR_GLASS_PRESET_END */

const NAV_ITEMS = [
  { path: '/', label: 'HOME' },
  { path: '/about', label: 'ABOUT' },
  { path: '/project', label: 'PROJECT' },
  { path: '/contact', label: 'CONTACT' },
] as const

const COMMAND_MENU_ITEMS = [
  { id: 'nav-home', path: '/', label: 'HOME', category: 'Navigation', keywords: 'home landing start', targetId: 'home' },
  { id: 'nav-about', path: '/about', label: 'ABOUT', category: 'Navigation', keywords: 'about profile me', targetId: 'about' },
  { id: 'nav-project', path: '/project', label: 'PROJECTS', category: 'Navigation', keywords: 'projects work portfolio', targetId: 'projects' },
  { id: 'nav-contact', path: '/contact', label: 'CONTACT', category: 'Navigation', keywords: 'contact email hire social', targetId: 'contact' },

  { id: 'sec-about', path: '/about', label: 'About Me', category: 'Content', keywords: 'about me background story', targetId: 'about-me' },
  { id: 'sec-skills', path: '/about', label: 'My Skills', category: 'Content', keywords: 'skills html css javascript react figma tech', targetId: 'skills' },

  { id: 'proj-1', path: '/project', label: 'Todo-List', category: 'Projects', keywords: 'todo task list project nextjs express postgres', targetId: 'project-0' },
  { id: 'proj-2', path: '/project', label: 'Portfolio Website', category: 'Projects', keywords: 'portfolio personal project react vite framer', targetId: 'project-1' },
  { id: 'proj-3', path: '/project', label: 'Zendix File Transfer', category: 'Projects', keywords: 'zendix file transfer share peer webrtc', targetId: 'project-2' },
  { id: 'proj-4', path: '/project', label: 'Nyeta', category: 'Projects', keywords: 'nyeta visual assistance ai webrtc llama', targetId: 'project-3' },
] as const

const Navbar = () => {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)
  const [hasOpenedCommandMenu, setHasOpenedCommandMenu] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isIPad, setIsIPad] = useState(false)
  const [isMac, setIsMac] = useState(true)
  const pillTextRef = useRef<HTMLSpanElement>(null)
  const navigationRequestRef = useRef(0)

  useEffect(() => {
    if (isCommandMenuOpen) setHasOpenedCommandMenu(true)
  }, [isCommandMenuOpen])

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
    const activeLink = document.querySelector('.nav-item.active')
    const navLinks = document.querySelector('.nav-links')
    const indicator = indicatorRef.current

    if (activeLink && navLinks && indicator) {
      const parentRect = navLinks.getBoundingClientRect()
      const rect = activeLink.getBoundingClientRect()

      if (rect && parentRect) {
        // offsetLeft and offsetTop are exactly relative to the nearest positioned ancestor (.nav-links)
        const targetX = (activeLink as HTMLElement).offsetLeft;
        const targetTop = (activeLink as HTMLElement).offsetTop;
        const targetWidth = (activeLink as HTMLElement).offsetWidth;
        const targetHeight = (activeLink as HTMLElement).offsetHeight;

        if (!hasInitialized) {
          const prev = indicator.style.transition
          indicator.style.transition = 'none'
          indicator.style.transform = `translateX(${targetX}px) translateY(${targetTop}px)`
          indicator.style.width = `${targetWidth}px`
          indicator.style.height = `${targetHeight}px`
          void indicator.offsetWidth // force reflow
          indicator.style.transition = prev
          setHasInitialized(true)
        } else {
          indicator.style.transform = `translateX(${targetX}px) translateY(${targetTop}px)`
          indicator.style.width = `${targetWidth}px`
          indicator.style.height = `${targetHeight}px`
        }
      }
    }
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

      window.addEventListener('resize', handleResize, { passive: true })
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [updateIndicatorPosition, isIPad])

  useEffect(() => {
    setIsCommandMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isCommandMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCommandMenuOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandMenuOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: true })
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

    window.addEventListener('landing-scroll', handleLandingScroll, { passive: true })
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

  const handleNavClick = async (e: React.MouseEvent<HTMLAnchorElement>, path: string, explicitTargetId?: string) => {
    let targetId = explicitTargetId;
    if (!targetId) {
      if (path === '/about') targetId = 'about';
      else if (path === '/project') targetId = 'projects';
      else if (path === '/contact') targetId = 'contact';
      else targetId = 'home';
    }

    e.preventDefault();
    setIsCommandMenuOpen(false);
    const navigationRequest = ++navigationRequestRef.current

    if (getOwningSection(targetId)) {
      await ensureTargetReady(targetId)
      // Allow browser and Lenis a frame to calculate new section bounds
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    if (navigationRequest !== navigationRequestRef.current) return

    const element = document.getElementById(targetId) ?? document.getElementById(
      getOwningSection(targetId) ?? 'home',
    );
    if (element) {
      // Prevent scroll-spy from bouncing during smooth scroll
      window.isNavigating = true;
      if (window.navTimeoutId) clearTimeout(window.navTimeoutId);
      window.navTimeoutId = setTimeout(() => {
        window.isNavigating = false;
      }, 1000);

      const offset = explicitTargetId && (explicitTargetId.startsWith('project-') || explicitTargetId === 'skills') ? -window.innerHeight / 4 : 0;
      scrollToTarget(element, { offset });
      window.history.pushState(null, '', path);
      setActivePath(path);

      if (explicitTargetId && explicitTargetId.startsWith('project-')) {
          const index = parseInt(explicitTargetId.replace('project-', ''), 10);
          window.dispatchEvent(new CustomEvent('project-scroll', { detail: { index } }));
      }
    }
  };

  const currentLabel = NAV_ITEMS.find(item => item.path === activePath)?.label || 'Home';

  useEffect(() => {
    const el = pillTextRef.current;
    if (!el) return;

    const nextText = currentLabel.charAt(0) + currentLabel.slice(1).toLowerCase();

    if (el.textContent === '' || el.textContent === nextText) {
      el.textContent = nextText;
      return;
    }

    const dur = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--text-swap-dur") || "150"
    );

    el.classList.add("is-exit");
    setTimeout(() => {
      el.textContent = nextText;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      void el.offsetHeight; // force reflow
      el.classList.remove("is-enter-start");
    }, dur);
  }, [currentLabel]);

  return (
    <>
      {/* Desktop Navbar */}
      {!isIPad && (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
          <GlassSurface
            {...NAVBAR_GLASS_PRESET}
            width={480}
            height={50}
          >
            <ul className="nav-links">
              <div
                ref={indicatorRef}
                className="nav-indicator t-tabs-pill"
                aria-hidden="true"
              />
              {NAV_ITEMS.map(({ path, label }) => (
                <li key={path}>
                  <a
                    href={path}
                    onClick={(e) => handleNavClick(e, path)}
                    className={activePath === path ? 'nav-item active' : 'nav-item'}
                    aria-current={activePath === path ? 'page' : undefined}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </GlassSurface>

          <div className="desktop-command-button-wrapper">
            <GlassSurface
              {...NAVBAR_GLASS_PRESET}
              width={50}
              height={50}
            >
              <button
                className="desktop-command-btn"
                onClick={() => setIsCommandMenuOpen(true)}
                aria-label="Open command menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </GlassSurface>
          </div>
        </nav>
      )}

      {/* Mobile Fullscreen Navbar */}
      <nav className={`mobile-navbar-fullscreen ${isIPad ? 'show-for-ipad' : ''}`} role="navigation" aria-label="Mobile navigation">
        <div className="mobile-pill-container">
          <GlassSurface
            {...NAVBAR_GLASS_PRESET}
            width={180}
            height={45}
          >
            <button
              className="command-pill-button"
              onClick={() => setIsCommandMenuOpen(true)}
              aria-label="Open command menu"
            >
              <svg className="pill-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span className="pill-text t-text-swap" ref={pillTextRef}></span>
              <span className="pill-shortcut">{isMac ? '⌘K' : 'Ctrl K'}</span>
            </button>
          </GlassSurface>
        </div>
      </nav>

      {(isCommandMenuOpen || hasOpenedCommandMenu) && (
        <React.Suspense fallback={null}>
          <CommandMenu
            isOpen={isCommandMenuOpen}
            onClose={() => setIsCommandMenuOpen(false)}
            menuItems={COMMAND_MENU_ITEMS}
            activePath={activePath}
            handleNavClick={handleNavClick}
          />
        </React.Suspense>
      )}

    </>
  )
}

export default Navbar
