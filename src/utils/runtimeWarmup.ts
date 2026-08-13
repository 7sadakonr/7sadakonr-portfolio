import todoListImg from '../assets/img/todo_list_real.webp'
import portfolioImg from '../assets/img/portfolio_real_new.webp'
import fileTransferImg from '../assets/img/zendix_real.webp'

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string }

const preloadImage = (src: string) => new Promise<void>((resolve) => {
  const image = new Image()
  const finish = () => resolve()
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.onload = () => {
    if (typeof image.decode === 'function') image.decode().catch(() => undefined).finally(finish)
    else finish()
  }
  image.onerror = finish
  image.src = src
})

const canWarmHeavyAssets = () => {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  if (!connection) return true
  if (connection.saveData) return false
  return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g'
}

const warmCoreRuntime = () => Promise.allSettled([
  import('lenis'),
  import('../components/BackgroundBeams/BackgroundBeams'),
  import('../components/Animation/TextReveal'),
  import('../components/Animation/Fireflies'),
  import('../components/Animation/AnimatedContent'),
])

const warmLazySections = async () => {
  const modules: Promise<unknown>[] = [
    import('../pages/AboutPage'),
    import('../pages/ProjectPage'),
    import('../pages/ContactPage'),
    import('../components/PageEnd/PageEnd'),
  ]
  const images = canWarmHeavyAssets()
    ? [preloadImage(todoListImg), preloadImage(portfolioImg), preloadImage(fileTransferImg)]
    : []
  await Promise.allSettled([...modules, ...images])
}

let warmupStarted = false

export const warmPortfolioRuntime = () => {
  if (warmupStarted) return
  warmupStarted = true
  void warmCoreRuntime()
  window.setTimeout(() => void warmLazySections(), 250)
}
