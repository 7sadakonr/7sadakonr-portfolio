import { Suspense, useEffect, useState, type ReactNode } from 'react'
import {
  isSectionReady,
  isSectionRequested,
  markSectionReady,
  requestSection,
  subscribeToSectionRequests,
  type LazySectionId,
} from './sectionLoader'

interface LazySectionProps {
  id: LazySectionId
  children: ReactNode
}

const SectionReady = ({ id, children }: LazySectionProps) => {
  useEffect(() => {
    markSectionReady(id)
  }, [id])

  return children
}

const SectionPlaceholder = () => (
  <div className="lazy-section-placeholder" aria-hidden="true">
    <div className="lazy-section-placeholder__glow" />
  </div>
)

const LazySection = ({ id, children }: LazySectionProps) => {
  const [shouldRender, setShouldRender] = useState(() => isSectionRequested(id))
  const [isReady, setIsReady] = useState(() => isSectionReady(id))

  useEffect(() => {
    const unsubscribe = subscribeToSectionRequests((requestedId) => {
      if (requestedId === id) setShouldRender(true)
    })

    const element = document.getElementById(id)
    if (!element || shouldRender) return unsubscribe

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        setShouldRender(true)
        void requestSection(id)
        observer.disconnect()
      },
      { rootMargin: '800px 0px', threshold: 0 },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      unsubscribe()
    }
  }, [id, shouldRender])

  useEffect(() => {
    if (!shouldRender || isReady) return

    let isActive = true
    void requestSection(id).then(() => {
      if (isActive) setIsReady(true)
    })

    return () => {
      isActive = false
    }
  }, [id, isReady, shouldRender])

  return (
    <section
      id={id}
      className={`lazy-section${isReady ? ' is-ready' : ''}`}
      aria-busy={shouldRender && !isReady ? true : undefined}
    >
      {shouldRender ? (
        <Suspense fallback={<SectionPlaceholder />}>
          <SectionReady id={id}>{children}</SectionReady>
        </Suspense>
      ) : (
        <SectionPlaceholder />
      )}
    </section>
  )
}

export default LazySection
