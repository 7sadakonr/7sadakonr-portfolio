import { useEffect, useRef, useState } from 'react'

export const useDelayedLoading = (isLoading: boolean, delayMs = 180, minDisplayMs = 200) => {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const isSkeletonVisibleRef = useRef(false)
  const skeletonShownAtRef = useRef<number | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (isLoading) {
      if (isSkeletonVisibleRef.current) return

      timeoutId = setTimeout(() => {
        isSkeletonVisibleRef.current = true
        skeletonShownAtRef.current = Date.now()
        setShowSkeleton(true)
      }, delayMs)
    } else {
      if (!isSkeletonVisibleRef.current || skeletonShownAtRef.current === null) {
        setShowSkeleton(false)
        return
      }

      const elapsedTime = Date.now() - skeletonShownAtRef.current
      const remainingTime = Math.max(0, minDisplayMs - elapsedTime)
      timeoutId = setTimeout(() => {
        isSkeletonVisibleRef.current = false
        skeletonShownAtRef.current = null
        setShowSkeleton(false)
      }, remainingTime)
    }

    return () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [isLoading, delayMs, minDisplayMs])

  return showSkeleton
}
