export {}

declare global {
  interface Window {
    isNavigating?: boolean
    navTimeoutId?: number
  }
}
