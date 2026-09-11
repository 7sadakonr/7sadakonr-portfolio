import { useEffect, useRef, useState } from 'react'

export const useDelayedLoading = (isLoading: boolean, delayMs = 180, minDisplayMs = 200) => {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const isSkeletonVisibleRef = useRef(false)
  const skeletonShownAtRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLoadingRef = useRef<boolean | null>(null)

  useEffect(() => {
    const loadingChanged = prevLoadingRef.current !== isLoading
    prevLoadingRef.current = isLoading

    if (isLoading) {
      if (isSkeletonVisibleRef.current) return

      // If already waiting for delay and loading state did not change, keep the existing timeout
      if (!loadingChanged && timeoutRef.current !== null) return

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        isSkeletonVisibleRef.current = true
        skeletonShownAtRef.current = Date.now()
        setShowSkeleton(true)
      }, delayMs)
    } else {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (!isSkeletonVisibleRef.current || skeletonShownAtRef.current === null) {
        isSkeletonVisibleRef.current = false
        skeletonShownAtRef.current = null
        setShowSkeleton(false)
        return
      }

      const elapsedTime = Date.now() - skeletonShownAtRef.current
      const remainingTime = Math.max(0, minDisplayMs - elapsedTime)

      if (remainingTime <= 0) {
        isSkeletonVisibleRef.current = false
        skeletonShownAtRef.current = null
        setShowSkeleton(false)
        return
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        isSkeletonVisibleRef.current = false
        skeletonShownAtRef.current = null
        setShowSkeleton(false)
      }, remainingTime)
    }
  }, [isLoading, delayMs, minDisplayMs])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return showSkeleton
}
