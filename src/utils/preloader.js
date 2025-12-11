// Preload critical images and resources
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const preloadImages = (imageSources) => {
  return Promise.all(imageSources.map(preloadImage))
}

// Preload critical CSS
export const preloadCSS = (href) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = href
  document.head.appendChild(link)
}

// Resource hints for better performance
export const addResourceHints = () => {
  // DNS prefetch for external resources
  const dnsPrefetch = (domain) => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  }

  // Add common CDN domains if you use any
  // dnsPrefetch('//fonts.googleapis.com')
  // dnsPrefetch('//cdnjs.cloudflare.com')
}