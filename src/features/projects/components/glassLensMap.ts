const cache = new Map<string, string>()

/**
 * Builds a displacement map for a circular glass lens.
 * Centre and outside the circle are neutral (128,128); inside the bezel band
 * the vector points toward the centre with a convex profile, so the edge
 * looks like a refracting dome.
 */
export function createLensDisplacementMap(size: number, bezel: number): string | null {
  const key = `${size}-${bezel}`
  const cached = cache.get(key)
  if (cached) return cached
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const img = ctx.createImageData(size, size)
  const r = size / 2
  const inner = r - bezel

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - r
      const dy = y + 0.5 - r
      const dist = Math.sqrt(dx * dx + dy * dy)
      let vx = 0
      let vy = 0
      if (dist > inner && dist <= r && dist > 0) {
        const t = (dist - inner) / bezel
        const mag = 1 - Math.sqrt(1 - t * t)
        vx = -(dx / dist) * mag
        vy = -(dy / dist) * mag
      }
      const i = (y * size + x) * 4
      img.data[i] = Math.round(128 + vx * 127)
      img.data[i + 1] = Math.round(128 + vy * 127)
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)
  const url = canvas.toDataURL('image/png')
  cache.set(key, url)
  return url
}
