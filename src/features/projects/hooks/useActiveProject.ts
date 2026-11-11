import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollToTarget } from '../../../components/layout/SmoothScroll/scrollController'
import { subscribeToProjectTargets } from '../../navigation/navigationEvents'

export const useActiveProject = (projectCount: number) => {
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  // Stays false until a project card actually enters the viewport, so the sidebar
  // doesn't open its first item while the cards are still off-screen.
  const [hasReachedProjects, setHasReachedProjects] = useState(false)
  const projectRefs = useRef<(HTMLDivElement | null)[]>([])
  const isScrollingRef = useRef(false)
  const projectScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setProjectRef = useCallback((index: number) => (element: HTMLDivElement | null) => {
    projectRefs.current[index] = element
  }, [])

  useEffect(() => {
    setActiveProjectIndex((index) => Math.max(0, Math.min(index, Math.max(projectCount - 1, 0))))
  }, [projectCount])

  useEffect(() => {
    const handleProjectScroll = (index: number) => {
      if (typeof index !== 'number') return
      setActiveProjectIndex(index)
      setHasReachedProjects(true)
      isScrollingRef.current = true
      if (projectScrollTimeoutRef.current) clearTimeout(projectScrollTimeoutRef.current)
      projectScrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
        projectScrollTimeoutRef.current = null
      }, 1000)
    }
    const unsubscribe = subscribeToProjectTargets(handleProjectScroll)
    return () => {
      unsubscribe()
      if (projectScrollTimeoutRef.current) clearTimeout(projectScrollTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    // Active project = the last card whose top has crossed a reference line at 40% of
    // the viewport. Evaluated on scroll (rAF-throttled) rather than via IntersectionObserver
    // thresholds, which rarely fire for tall cards and never reset when scrolling back up.
    let frame: number | null = null
    const update = () => {
      frame = null
      if (isScrollingRef.current) return
      const line = window.innerHeight * 0.4
      let nextIndex = -1
      projectRefs.current.forEach((ref, index) => {
        if (ref && ref.getBoundingClientRect().top <= line) nextIndex = index
      })
      setHasReachedProjects(nextIndex !== -1)
      if (nextIndex !== -1) setActiveProjectIndex(nextIndex)
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [projectCount])

  const scrollToProject = useCallback((index: number) => {
    setActiveProjectIndex(index)
    setHasReachedProjects(true)
    // Hold the active item while the programmatic scroll passes over other cards.
    isScrollingRef.current = true
    if (projectScrollTimeoutRef.current) clearTimeout(projectScrollTimeoutRef.current)
    projectScrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false
      projectScrollTimeoutRef.current = null
    }, 1200)
    const element = projectRefs.current[index]
    if (element) scrollToTarget(element, { offset: -window.innerHeight / 4 })
  }, [])

  return { hasReachedProjects, activeProjectIndex, setActiveProjectIndex, setProjectRef, scrollToProject }
}
