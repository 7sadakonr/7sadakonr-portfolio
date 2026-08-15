let isNavigating = false
let timeoutId: number | undefined

export const isNavigationInProgress = () => isNavigating

export const beginNavigation = (duration = 1000) => {
  isNavigating = true
  if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  timeoutId = window.setTimeout(() => {
    isNavigating = false
    timeoutId = undefined
  }, duration)
}

export const resetNavigation = () => {
  if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  timeoutId = undefined
  isNavigating = false
}
