import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSkeletonPresence } from '../../hooks/useDelayedLoading'
import SectionSkeleton from './SectionSkeleton'
import {
  isSectionReady,
  isSectionRequested,
  markSectionReady,
  requestSection,
  ensureTargetReady,
  prefetchSection,
  subscribeToSectionRequests,
  type LazySectionId,
} from './sectionLoader'

interface LazySectionProps {
  id: LazySectionId
  children: ReactNode
  canLoad?: boolean
}

const SectionReady = ({ id, children, onReady }: LazySectionProps & { onReady: () => void }) => {
  useEffect(() => {
    markSectionReady(id)
    onReady()
  }, [id, onReady])

  return children
}

const DelayedSectionSkeleton = ({ id, loading, onComplete }: { id: LazySectionId; loading: boolean; onComplete: () => void }) => {
  const phase = useSkeletonPresence(loading, { delayMs: 120, minVisibleMs: 0, exitMs: 180 })
  const completedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'idle' || completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [phase, onComplete])

  return <SectionSkeleton id={id} phase={phase} />
}

const LazySection = ({ id, children, canLoad = true }: LazySectionProps) => {
  const [shouldRender, setShouldRender] = useState(() => isSectionRequested(id))
  const [isReady, setIsReady] = useState(() => isSectionReady(id))
  const [isContentReady, setIsContentReady] = useState(() => isSectionReady(id))
  const [isLayoutStable, setIsLayoutStable] = useState(() => isSectionReady(id))
  const [isEffectActive, setIsEffectActive] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeToSectionRequests((requestedId) => {
      if (requestedId === id) setShouldRender(true)
    })

    if (isSectionRequested(id)) setShouldRender(true)
    if (!canLoad) return unsubscribe

    const element = document.getElementById(id)
    if (!element || shouldRender) return unsubscribe

    const prefetchObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      prefetchSection(id)
      prefetchObserver.disconnect()
    }, { rootMargin: '0px 0px -64px 0px', threshold: 0 })

    const mountObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      void ensureTargetReady(id)
      mountObserver.disconnect()
    }, { rootMargin: '0px 0px -180px 0px', threshold: 0 })

    prefetchObserver.observe(element)
    mountObserver.observe(element)
    return () => {
      prefetchObserver.disconnect()
      mountObserver.disconnect()
      unsubscribe()
    }
  }, [canLoad, id, shouldRender])

  useEffect(() => {
    if (!canLoad || !shouldRender || isReady) return
    let active = true
    void requestSection(id).then(() => {
      if (active) setIsReady(true)
    })
    return () => { active = false }
  }, [canLoad, id, isReady, shouldRender])

  useEffect(() => {
    if (!canLoad) return
    const element = document.getElementById(id)
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      setIsEffectActive(Boolean(entry?.isIntersecting) && !document.hidden)
    }, { rootMargin: '150px 0px', threshold: 0 })

    const onVisibilityChange = () => {
      if (document.hidden) return setIsEffectActive(false)
      const rect = element.getBoundingClientRect()
      setIsEffectActive(rect.bottom >= -150 && rect.top <= window.innerHeight + 150)
    }

    observer.observe(element)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [canLoad, id])

  useEffect(() => {
    if (!isContentReady || !contentRef.current || typeof ResizeObserver === 'undefined') return
    let frame: number | null = null
    let triggerResize: (() => void) | undefined
    const requestResize = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        triggerResize?.()
      })
    }

    void import('../SmoothScroll/scrollController').then(({ triggerResize: resize }) => {
      triggerResize = resize
      requestResize()
    })
    const observer = new ResizeObserver(requestResize)
    observer.observe(contentRef.current)
    return () => {
      observer.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [isContentReady])

  const handleContentReady = useCallback(() => {
    setIsContentReady(true)
    setIsReady(true)
  }, [])

  const handleHandoffComplete = useCallback(() => {
    requestAnimationFrame(() => {
      setIsLayoutStable(true)
      void import('../SmoothScroll/scrollController').then(({ triggerResize }) => triggerResize())
    })
  }, [])

  const showHandoff = shouldRender && !isLayoutStable

  return (
    <section
      id={id}
      className={`lazy-section lazy-section--${id}${isReady ? ' is-ready' : ''}${isEffectActive ? ' is-effect-active' : ''}`}
      data-loading={!isLayoutStable ? 'true' : undefined}
      aria-busy={!isLayoutStable ? true : undefined}
    >
      <div className={`lazy-section-handoff${isContentReady ? ' is-content-ready' : ''}`}>
        {shouldRender && <div ref={contentRef} className="lazy-section-handoff-content">
          <Suspense fallback={null}><SectionReady id={id} onReady={handleContentReady}>{children}</SectionReady></Suspense>
        </div>}
        {showHandoff && <DelayedSectionSkeleton id={id} loading={!isContentReady} onComplete={handleHandoffComplete} />}
      </div>
    </section>
  )
}

export default LazySection
