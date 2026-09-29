import React, { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'
import { cancelScrollAnimation, scrollToTarget, type ScrollTargetOptions } from '../SmoothScroll/scrollController'
import { ensureTargetReady, getOwningSection } from '../LazySection/sectionLoader'
import type { CommandMenuItem } from '../CommandMenu/CommandMenu'
import { getNavigationTarget } from '../../features/navigation/navigation.config'
import { requestProjectTarget, subscribeToSectionChanges } from '../../features/navigation/navigationEvents'
import { beginNavigation, isNavigationInProgress, resetNavigation } from '../../features/navigation/navigationState'
import { loadCommandMenu, loadProjectData } from '../../utils/runtimeWarmup'
import { getProjectCatalog, subscribeToProjectCatalog } from '../../features/projects/data/projectCatalogStore'

const CommandMenu = lazy(loadCommandMenu)
const SHELL_SPRING = { type: 'spring', duration: 0.8, bounce: 0.2 } as const
const CONTENT_SPRING = { type: 'spring', duration: 0.8, bounce: 0.35 } as const
const SCROLL_TOP_THRESHOLD = 96
const SCROLL_BOTTOM_THRESHOLD = 12
const SCROLL_DIRECTION_THRESHOLD = 8
const SCROLL_INPUT_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])
const NAV_ITEMS = [{ path: '/', label: 'HOME' }, { path: '/about', label: 'ABOUT' }, { path: '/project', label: 'PROJECT' }, { path: '/contact', label: 'CONTACT' }] as const
const COMMAND_MENU_ITEMS: CommandMenuItem[] = [
  { id: 'nav-home', path: '/', label: 'HOME', category: 'Navigation', keywords: 'home landing start', targetId: 'home' },
  { id: 'nav-about', path: '/about', label: 'ABOUT', category: 'Navigation', keywords: 'about profile me', targetId: 'about' },
  { id: 'nav-project', path: '/project', label: 'PROJECTS', category: 'Navigation', keywords: 'projects work portfolio', targetId: 'projects' },
  { id: 'nav-contact', path: '/contact', label: 'CONTACT', category: 'Navigation', keywords: 'contact email hire social', targetId: 'contact' },
  { id: 'sec-about', path: '/about', label: 'About Me', category: 'Content', keywords: 'about me background story', targetId: 'about-me' },
  { id: 'sec-skills', path: '/about', label: 'My Skills', category: 'Content', keywords: 'skills html css javascript react figma tech', targetId: 'skills' },
  { id: 'nav-privacy', path: '/privacy', label: 'Privacy Policy', category: 'Legal', keywords: 'privacy policy legal data' },
]
type IslandView = 'navigation' | 'compact' | 'search' | 'command'
const formatPillLabel = (label: string) => label.charAt(0) + label.slice(1).toLowerCase()
const SearchIcon = () => <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
const CloseIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>

function useContentSize(view: IslandView, mobile: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: mobile ? 180 : 480, height: mobile ? 45 : 50 })
  const update = useCallback(() => { const element = ref.current; if (!element) return; const next = { width: Math.ceil(element.offsetWidth), height: Math.ceil(element.offsetHeight) }; setSize(previous => previous.width === next.width && previous.height === next.height ? previous : next) }, [])
  useLayoutEffect(update, [update, view, mobile])
  useEffect(() => { const element = ref.current; if (!element || typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(() => requestAnimationFrame(update)); observer.observe(element); return () => observer.disconnect() }, [update])
  return [ref, size] as const
}

interface NavbarProps { isInteractive?: boolean }
const Navbar = ({ isInteractive = true }: NavbarProps) => {
  const location = useLocation(); const navigate = useNavigate(); const triggerRef = useRef<HTMLButtonElement>(null); const navigationRequestRef = useRef(0); const skipLocationScrollRef = useRef<string | null>(null); const closeTimerRef = useRef<number | null>(null); const progressRevealRef = useRef(false); const progressNavigationLockRef = useRef(false); const scrollProgressRef = useRef(0); const progressPercentageRef = useRef<HTMLSpanElement>(null); const reduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false); const [isMac, setIsMac] = useState(true); const [activePath, setActivePath] = useState(location.pathname); const [view, setView] = useState<IslandView>('navigation'); const [shouldMountCommandMenu, setShouldMountCommandMenu] = useState(false); const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false); const [projects, setProjects] = useState(getProjectCatalog); const [pillLabel, setPillLabel] = useState('Home'); const [pillLabelAnimation, setPillLabelAnimation] = useState<'idle' | 'exit' | 'enter'>('idle'); const [sizerRef, measuredSize] = useContentSize(view, isMobile)
  const currentLabel = NAV_ITEMS.find(item => item.path === activePath)?.label || 'HOME'; const currentPillLabel = formatPillLabel(currentLabel)
  const commandMenuItems = useMemo<CommandMenuItem[]>(() => [...COMMAND_MENU_ITEMS, ...(projects ?? []).map((project, index) => ({ id: `project-${project.id}`, path: '/project', label: project.title, category: 'Projects', keywords: `${project.title} ${project.tech.join(' ')}`.toLowerCase(), targetId: `project-${index}` }))], [projects])
  useEffect(() => subscribeToProjectCatalog(setProjects), [])
  useEffect(() => { const query = window.matchMedia('(max-width: 1024px)'); const sync = () => { setIsMobile(query.matches); if (query.matches) setView(previous => previous === 'compact' ? 'navigation' : previous) }; sync(); setIsMac(/Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)); query.addEventListener('change', sync); return () => query.removeEventListener('change', sync) }, [])
  useEffect(() => { setActivePath(location.pathname) }, [location.pathname])
  useEffect(() => subscribeToSectionChanges(path => { setActivePath(path); if (location.pathname !== path) { skipLocationScrollRef.current = path; navigate(path, { replace: true }) } }), [location.pathname, navigate])
  useEffect(() => resetNavigation, [])
  useEffect(() => { if (pillLabel === currentPillLabel) return; setPillLabelAnimation('exit'); const timer = window.setTimeout(() => { setPillLabel(currentPillLabel); setPillLabelAnimation('enter') }, 150); return () => window.clearTimeout(timer) }, [currentPillLabel, pillLabel])
  useEffect(() => { if (pillLabelAnimation !== 'enter') return; const frame = requestAnimationFrame(() => requestAnimationFrame(() => setPillLabelAnimation('idle'))); return () => cancelAnimationFrame(frame) }, [pillLabelAnimation])
  const closeSearchPreview = useCallback(() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); setView('navigation'); requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true })) }, [])
  const revealNavigation = useCallback(() => { setView(previous => { if (previous !== 'compact') return previous; progressRevealRef.current = true; return 'navigation' }) }, [])
  const releaseNavigationReveal = useCallback(() => { progressRevealRef.current = false }, [])
  const releaseProgressNavigationLock = useCallback(() => { if (!progressNavigationLockRef.current) return; if (isNavigationInProgress()) { cancelScrollAnimation(); resetNavigation() }; requestAnimationFrame(() => { if (!isNavigationInProgress()) progressNavigationLockRef.current = false }) }, [])
  const closeCommandMenu = useCallback(() => {
    if (!isCommandMenuOpen) return
    setIsCommandMenuOpen(false)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (!isMobile) {
      setView('navigation')
      requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }))
      return
    }
    setView('search')
    closeTimerRef.current = window.setTimeout(closeSearchPreview, reduceMotion ? 0 : 520)
  }, [closeSearchPreview, isCommandMenuOpen, isMobile, reduceMotion])
  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }, [])
  const openCommandMenu = useCallback(() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); setShouldMountCommandMenu(true); if (isMobile) setView('search'); if (!getProjectCatalog()) void loadProjectData().then(({ loadPublicProjects }) => loadPublicProjects()).catch(() => undefined); requestAnimationFrame(() => requestAnimationFrame(() => { setIsCommandMenuOpen(true); setView('command') })) }, [isMobile])
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === 'k' || event.code === 'KeyK')) { event.preventDefault(); if (isCommandMenuOpen) closeCommandMenu(); else openCommandMenu() } }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown) }, [closeCommandMenu, isCommandMenuOpen, openCommandMenu])
  useEffect(() => {
    if (isMobile) return
    const onScrollKey = (event: KeyboardEvent) => { if (SCROLL_INPUT_KEYS.has(event.key)) releaseProgressNavigationLock() }
    const onScrollbarPointerDown = (event: PointerEvent) => { if (event.clientX >= document.documentElement.clientWidth - 20) releaseProgressNavigationLock() }
    window.addEventListener('wheel', releaseProgressNavigationLock, { passive: true })
    window.addEventListener('touchstart', releaseProgressNavigationLock, { passive: true })
    window.addEventListener('keydown', onScrollKey)
    window.addEventListener('pointerdown', onScrollbarPointerDown, { passive: true })
    return () => { window.removeEventListener('wheel', releaseProgressNavigationLock); window.removeEventListener('touchstart', releaseProgressNavigationLock); window.removeEventListener('keydown', onScrollKey); window.removeEventListener('pointerdown', onScrollbarPointerDown) }
  }, [isMobile, releaseProgressNavigationLock])
  useEffect(() => {
    if (isMobile || isCommandMenuOpen) return
    let frame = 0
    let lastY = window.scrollY
    let accumulatedDelta = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const scrollProgress = Math.min(1, y / Math.max(1, maxScroll))
      scrollProgressRef.current = scrollProgress
      document.documentElement.style.setProperty('--navbar-scroll-progress', String(scrollProgress))
      if (progressPercentageRef.current) progressPercentageRef.current.textContent = `${Math.round(scrollProgress * 100)}%`
      if (isNavigationInProgress()) {
        accumulatedDelta = 0
        return
      }
      if (progressNavigationLockRef.current) {
        accumulatedDelta = 0
        return
      }
      const atBottom = maxScroll > SCROLL_TOP_THRESHOLD && y >= maxScroll - SCROLL_BOTTOM_THRESHOLD
      if (y <= SCROLL_TOP_THRESHOLD || atBottom) {
        accumulatedDelta = 0
        setView(previous => previous === 'compact' ? 'navigation' : previous)
        return
      }
      if (progressRevealRef.current) {
        accumulatedDelta = 0
        return
      }
      if (delta && Math.sign(delta) !== Math.sign(accumulatedDelta)) accumulatedDelta = 0
      accumulatedDelta += delta
      if (Math.abs(accumulatedDelta) < SCROLL_DIRECTION_THRESHOLD) return
      accumulatedDelta = 0
      setView(previous => previous === 'navigation' ? 'compact' : previous)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [isCommandMenuOpen, isMobile])
  const navigateToTarget = useCallback(async (path: string, targetId: string, updateHistory: boolean, options?: ScrollTargetOptions) => { const request = ++navigationRequestRef.current; if (getOwningSection(targetId)) { await ensureTargetReady(targetId); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())) }; if (request !== navigationRequestRef.current) return; const element = document.getElementById(targetId) ?? document.getElementById(getOwningSection(targetId) ?? 'home'); if (!element) {
    if (updateHistory) { skipLocationScrollRef.current = path; navigate(path); setActivePath(path); }
    return;
  }
  beginNavigation(); if (!isMobile) { progressRevealRef.current = false; progressNavigationLockRef.current = true; setView('navigation') }; const completeNavigation = () => { resetNavigation(); if (!isMobile) setView('navigation') }; scrollToTarget(element, { offset: targetId.startsWith('project-') || targetId === 'skills' ? -window.innerHeight / 4 : 0, ...options, onComplete: completeNavigation }); if (updateHistory) { skipLocationScrollRef.current = path; navigate(path) }; setActivePath(path); if (targetId.startsWith('project-')) requestProjectTarget(parseInt(targetId.replace('project-', ''), 10)) }, [isMobile, navigate])
  const handleNavClick = useCallback(async (event: React.MouseEvent<HTMLAnchorElement>, path: string, targetId?: string) => { event.preventDefault(); closeCommandMenu(); await navigateToTarget(path, targetId ?? getNavigationTarget(path).targetId, true) }, [closeCommandMenu, navigateToTarget])
  useEffect(() => { if (!isInteractive || skipLocationScrollRef.current === location.pathname) { if (skipLocationScrollRef.current) skipLocationScrollRef.current = null; return }; const target = getNavigationTarget(location.pathname); void navigateToTarget(target.path, target.targetId, false, { immediate: window.scrollY < 10 }) }, [isInteractive, location.pathname, navigateToTarget])
  const sharedSearch = <motion.span layoutId="navbar-search-icon"><SearchIcon /></motion.span>
  const content = view === 'command' && shouldMountCommandMenu ? <Suspense fallback={<div className="island-search-loading">{sharedSearch}<span>Search…</span></div>}><CommandMenu isOpen={isCommandMenuOpen} onClose={closeCommandMenu} menuItems={commandMenuItems} activePath={activePath} handleNavClick={handleNavClick} /></Suspense> : view === 'search' ? isMobile ? <div className="island-search-loading">{sharedSearch}<span>Search…</span><CloseIcon /></div> : <div className="island-search-preview"><motion.span layoutId="navbar-search-icon"><SearchIcon /></motion.span><input className="island-search-preview-input" type="search" aria-label="Search navigation and projects" placeholder="Search navigation and projects…" onFocus={openCommandMenu} /><button className="island-search-preview-close" type="button" onClick={closeSearchPreview} aria-label="Close search preview"><CloseIcon /></button></div> : view === 'compact' ? <div className="island-progress" aria-label={`Scroll progress — ${currentLabel}`}><span className={`island-progress-label t-text-swap${pillLabelAnimation === 'exit' ? ' is-exit' : pillLabelAnimation === 'enter' ? ' is-enter-start' : ''}`}>{pillLabel.toUpperCase()}</span><span ref={progressPercentageRef} className="island-progress-percentage">{Math.round(scrollProgressRef.current * 100)}%</span><span className="island-progress-track" /></div> : isMobile ? <button ref={triggerRef} className="command-pill-button" onClick={openCommandMenu} aria-label="Open command menu"><SearchIcon /><span className={`pill-text t-text-swap${pillLabelAnimation === 'exit' ? ' is-exit' : pillLabelAnimation === 'enter' ? ' is-enter-start' : ''}`}>{pillLabel}</span><span className="pill-shortcut">{isMac ? '⌘K' : 'Ctrl K'}</span></button> : <ul className="nav-links">{NAV_ITEMS.map(({ path, label }) => <li key={path}><a href={path} onClick={event => handleNavClick(event, path)} className={activePath === path ? 'nav-item active' : 'nav-item'} aria-current={activePath === path ? 'page' : undefined}>{label}</a></li>)}</ul>
  return <>{isCommandMenuOpen && <button className="island-backdrop" aria-label="Close command menu" onClick={closeCommandMenu} />}<nav className={`navbar ${isMobile ? 'navbar--mobile' : 'navbar--desktop'} ${isCommandMenuOpen ? 'navbar--expanded' : ''}`} role="navigation" aria-label="Main navigation" onFocusCapture={revealNavigation} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) releaseNavigationReveal() }}><motion.div className="dynamic-island-shell island-material" data-lenis-prevent={isCommandMenuOpen ? "true" : undefined} initial={false} animate={measuredSize} transition={reduceMotion ? { duration: 0 } : SHELL_SPRING} style={{ borderRadius: 30 }} onPointerEnter={revealNavigation} onPointerMove={revealNavigation} onPointerLeave={releaseNavigationReveal}><div ref={sizerRef} className={`dynamic-island-sizer dynamic-island-sizer--${view}`}><AnimatePresence mode="popLayout" initial={false}><motion.div key={view} className="dynamic-island-content" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .9, y: -8, filter: 'blur(5px)' }} animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .9, y: -6, transition: { duration: .1 } }} transition={reduceMotion ? { duration: .1 } : CONTENT_SPRING}>{content}</motion.div></AnimatePresence></div></motion.div>{!isMobile && (view === 'navigation' || view === 'compact') && <motion.button ref={triggerRef} layoutId="navbar-search-orb" className="desktop-command-btn island-material" onClick={openCommandMenu} aria-label="Open command menu" whileTap={reduceMotion ? undefined : { scale: .9 }}>{sharedSearch}</motion.button>}</nav></>
}
export default Navbar
