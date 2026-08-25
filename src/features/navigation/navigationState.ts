let isNavigating = false
let timeoutId: number | undefined

export const isNavigationInProgress = () => isNavigating

export const beginNavigation = () => {
  isNavigating = true
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId)
    timeoutId = undefined
  }
}

export const resetNavigation = () => {
  if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  timeoutId = undefined
  isNavigating = false
}
