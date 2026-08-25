import { useState, useEffect } from 'react'

export const useDelayedLoading = (isLoading: boolean, delayMs = 180, minDisplayMs = 200) => {
  const [showSkeleton, setShowSkeleton] = useState(false)
  // We need a ref to keep track of when the skeleton was actually shown
  // to avoid closure staleness issues in the useEffect.

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let minDisplayTimeoutId: ReturnType<typeof setTimeout>
    let isMounted = true
    let skeletonShownTime = 0

    if (isLoading) {
      setShowSkeleton(false) // Reset on new load if it was false
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setShowSkeleton(true)
          skeletonShownTime = Date.now()
        }
      }, delayMs)
    } else {
      setShowSkeleton((currentlyShowing) => {
        if (currentlyShowing) {
          const elapsedTime = Date.now() - skeletonShownTime
          const remainingTime = Math.max(0, minDisplayMs - elapsedTime)
          
          if (remainingTime > 0) {
             minDisplayTimeoutId = setTimeout(() => {
               if (isMounted) setShowSkeleton(false)
             }, remainingTime)
             return true
          }
          return false
        }
        return false
      })
    }

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      clearTimeout(minDisplayTimeoutId)
    }
  }, [isLoading, delayMs, minDisplayMs])

  return showSkeleton
}
