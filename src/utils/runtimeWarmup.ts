import todoListImg from '../assets/img/todo_list_real.webp'
import portfolioImg from '../assets/img/portfolio_real_new.webp'
import fileTransferImg from '../assets/img/zendix_real.webp'
import { canWarmHeavyAssets, type NetworkInformationLike } from './networkPolicy'

type IdleCallbackHandle = number
type IdleDeadlineLike = { timeRemaining: () => number; didTimeout: boolean }

const lazyLoader = <T>(loader: () => Promise<T>) => {
  let promise: Promise<T> | undefined
  return () => (promise ??= loader())
}

export const loadLenis = lazyLoader(() => import('lenis'))
export const loadFireflies = lazyLoader(() => import('../components/Animation/Fireflies'))
export const loadAnimatedContent = lazyLoader(() => import('../components/Animation/AnimatedContent'))
export const loadAboutPage = lazyLoader(() => import('../pages/AboutPage'))
export const loadProjectPage = lazyLoader(() => import('../pages/ProjectPage'))
export const loadContactPage = lazyLoader(() => import('../pages/ContactPage'))
export const loadPageEnd = lazyLoader(() => import('../components/PageEnd/PageEnd'))

export type LenisModule = Awaited<ReturnType<typeof loadLenis>>
export type LenisInstance = InstanceType<LenisModule['default']>

const preloadImage = (src: string) => new Promise<void>((resolve) => {
  const image = new Image()
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    image.onload = null
    image.onerror = null
    resolve()
  }

  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.onload = () => {
    if (typeof image.decode === 'function') image.decode().catch(() => undefined).finally(finish)
    else finish()
  }
  image.onerror = finish
  image.src = src

  if (image.complete) {
    if (image.naturalWidth > 0 && typeof image.decode === 'function') image.decode().catch(() => undefined).finally(finish)
    else finish()
  }
})

const getConnection = () => (navigator as Navigator & { connection?: NetworkInformationLike }).connection

export const shouldWarmHeavyAssets = () => canWarmHeavyAssets(getConnection())

const runWhenIdle = (task: () => void, timeout: number) => {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: (deadline: IdleDeadlineLike) => void, options?: { timeout: number }) => IdleCallbackHandle
    cancelIdleCallback?: (id: IdleCallbackHandle) => void
  }
  let idleId: IdleCallbackHandle | undefined
  let timeoutId: number | undefined
  let cancelled = false

  const schedule = () => {
    if (cancelled) return
    if (document.hidden) {
      document.addEventListener('visibilitychange', schedule, { once: true })
      return
    }
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback((deadline) => {
        if (!document.hidden && (deadline.didTimeout || deadline.timeRemaining() > 0)) task()
        else schedule()
      }, { timeout })
      return
    }
    timeoutId = window.setTimeout(() => {
      if (!document.hidden) task()
      else schedule()
    }, timeout)
  }

  schedule()
  return () => {
    cancelled = true
    if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId)
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    document.removeEventListener('visibilitychange', schedule)
  }
}

let backgroundWarmupStarted = false

export const warmBackgroundRuntime = () => {
  if (backgroundWarmupStarted) return () => undefined
  backgroundWarmupStarted = true

  const stages: (() => Promise<unknown>)[] = [
    () => loadAboutPage(),
    () => loadProjectPage(),
    () => Promise.allSettled([loadContactPage(), loadPageEnd()]),
  ]
  if (shouldWarmHeavyAssets()) {
    stages.push(async () => {
      for (const src of [todoListImg, portfolioImg, fileTransferImg, '/aceternity-world.svg']) await preloadImage(src)
    })
  }

  let cancelled = false
  let cancelCurrent: () => void = () => undefined
  const scheduleStage = (index: number) => {
    if (cancelled || index >= stages.length) return
    cancelCurrent = runWhenIdle(() => {
      const stage = stages[index]
      if (!stage) return
      void stage().catch(() => undefined).finally(() => scheduleStage(index + 1))
    }, 500)
  }
  scheduleStage(0)

  return () => {
    cancelled = true
    cancelCurrent()
  }
}
