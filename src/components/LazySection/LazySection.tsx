import { Suspense, useEffect, useState, type ReactNode } from 'react'
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

const SectionReady = ({ id, children }: LazySectionProps) => {
  useEffect(() => {
    markSectionReady(id)
  }, [id])

  return children
}

const SectionPlaceholder = ({ id }: { id?: LazySectionId }) => (
  <div className={`lazy-section-placeholder${id ? ` lazy-section-placeholder--${id}` : ''}`} aria-hidden="true">
    <div className="lazy-section-placeholder__glow" />
  </div>
)

const LazySection = ({ id, children, canLoad = true }: LazySectionProps) => {
  const [shouldRender, setShouldRender] = useState(() => isSectionRequested(id))
  const [isReady, setIsReady] = useState(() => isSectionReady(id))
  const [isEffectActive, setIsEffectActive] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToSectionRequests((requestedId) => {
      if (requestedId === id) setShouldRender(true)
    })

    if (!canLoad) return unsubscribe

    const element = document.getElementById(id)
    if (!element || shouldRender) return unsubscribe

    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        prefetchSection(id)
        prefetchObserver.disconnect()
      },
      { rootMargin: '800px 0px', threshold: 0 },
    )
    
    const mountObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        void ensureTargetReady(id)
        mountObserver.disconnect()
      },
      { rootMargin: '300px 0px', threshold: 0 },
    )

    prefetchObserver.observe(element)
    mountObserver.observe(element)

    return () => {
      prefetchObserver.disconnect()
      mountObserver.disconnect()
      unsubscribe()
    }
  }, [canLoad, id, shouldRender])

  useEffect(() => {
    if (!canLoad) return

    const element = document.getElementById(id)
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setIsEffectActive(Boolean(entry?.isIntersecting) && !document.hidden),
      { rootMargin: '150px 0px', threshold: 0 },
    )
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsEffectActive(false)
        return
      }
      const rect = element.getBoundingClientRect()
      setIsEffectActive(rect.bottom >= -150 && rect.top <= window.innerHeight + 150)
    }

    observer.observe(element)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [canLoad, id])

  useEffect(() => {
    if (!canLoad || !shouldRender || isReady) return

    let isActive = true
    void requestSection(id).then(() => {
      if (isActive) setIsReady(true)
    })

    return () => {
      isActive = false
    }
  }, [canLoad, id, isReady, shouldRender])

  return (
    <section
      id={id}
      className={`lazy-section${isReady ? ' is-ready' : ''}${isEffectActive ? ' is-effect-active' : ''}`}
      aria-busy={shouldRender && !isReady ? true : undefined}
    >
      {shouldRender ? (
        <Suspense fallback={<SectionPlaceholder id={id} />}>
          <SectionReady id={id}>{children}</SectionReady>
        </Suspense>
      ) : (
        <SectionPlaceholder id={id} />
      )}
    </section>
  )
}

export default LazySection
