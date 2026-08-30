import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollToTarget } from '../../../components/SmoothScroll/scrollController'
import { subscribeToProjectTargets } from '../../navigation/navigationEvents'

export const useActiveProject = (projectCount: number) => {
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const projectRefs = useRef<(HTMLDivElement | null)[]>([])
  const isScrollingRef = useRef(false)
  const projectScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ratios = useRef<Record<number, number>>({})

  const observerRef = useRef<IntersectionObserver | null>(null)

  const setProjectRef = useCallback((index: number) => (element: HTMLDivElement | null) => {
    const prevElement = projectRefs.current[index]
    if (prevElement && observerRef.current) {
      observerRef.current.unobserve(prevElement)
    }
    projectRefs.current[index] = element
    if (element && observerRef.current) {
      observerRef.current.observe(element)
    }
  }, [])

  useEffect(() => {
    setActiveProjectIndex((index) => Math.max(0, Math.min(index, Math.max(projectCount - 1, 0))))
  }, [projectCount])

  useEffect(() => {
    const handleProjectScroll = (index: number) => {
      if (typeof index !== 'number') return
      setActiveProjectIndex(index)
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = projectRefs.current.findIndex((ref) => ref === entry.target)
        if (index !== -1) ratios.current[index] = entry.intersectionRatio
      })
      if (isScrollingRef.current) return
      let maxRatio = 0
      let maxIndex = -1
      Object.entries(ratios.current).forEach(([index, ratio]) => {
        if (ratio > maxRatio) {
          maxRatio = ratio
          maxIndex = Number(index)
        }
      })
      if (maxIndex !== -1 && maxRatio > 0) setActiveProjectIndex(maxIndex)
    }, {
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    })
    
    observerRef.current = observer
    projectRefs.current.forEach((ref) => { if (ref) observer.observe(ref) })
    
    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [projectCount])

  const scrollToProject = useCallback((index: number) => {
    setActiveProjectIndex(index)
    const element = projectRefs.current[index]
    if (element) scrollToTarget(element, { offset: -window.innerHeight / 4 })
  }, [])

  return { activeProjectIndex, setActiveProjectIndex, setProjectRef, scrollToProject }
}
