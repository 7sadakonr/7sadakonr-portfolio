// Preload critical images and resources
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const preloadImages = (imageSources: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(imageSources.map(preloadImage))
}

// Preload critical CSS
export const preloadCSS = (href: string): void => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = href
  document.head.appendChild(link)
}

// Resource hints for better performance
export const addResourceHints = () => {
  // Add common CDN domains if you use any
  // dnsPrefetch('//fonts.googleapis.com')
  // dnsPrefetch('//cdnjs.cloudflare.com')
}