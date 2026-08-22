const lazyLoader = <T>(loader: () => Promise<T>) => {
  let promise: Promise<T> | undefined
  return () => (promise ??= loader())
}

export const loadLenis = lazyLoader(() => import('lenis'))
export const loadFireflies = lazyLoader(() => import('../components/Animation/Fireflies'))
export const loadCommandMenu = lazyLoader(() => import('../components/CommandMenu/CommandMenu'))
export const loadAboutPage = lazyLoader(() => import('../pages/AboutPage'))
export const loadProjectPage = lazyLoader(() => import('../features/projects/ProjectPage'))
export const loadContactPage = lazyLoader(() => import('../features/contact/ContactPage'))
export const loadPageEnd = lazyLoader(() => import('../components/PageEnd/PageEnd'))

export type LenisModule = Awaited<ReturnType<typeof loadLenis>>
export type LenisInstance = InstanceType<LenisModule['default']>
