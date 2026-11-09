const cache = new Map<string, GlassMap>()

/** Chromium-only gate: SVG filters inside backdrop-filter are only honoured there. */
export function supportsLiquidRefraction(): boolean {
  if (typeof navigator === 'undefined' || typeof CSS === 'undefined') return false
  // navigator.userAgentData only exists in secure contexts (not on http://<LAN-ip>),
  // so fall back to the user agent: Chrome / Chromium / Edge / Brave, never iOS browsers.
  const ua = navigator.userAgent
  const chromium = 'userAgentData' in navigator || (/\b(?:Chrome|Chromium|Edg)\//.test(ua) && !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) && !/iPhone|iPad|iPod/.test(ua))
  return chromium && !!CSS.supports?.('backdrop-filter', 'url(#x)')
}

export interface GlassMap { url: string; bezel: number }
const MAP_SCALE = 0.5

/**
 * Displacement map for a rounded rectangle (signed-distance field): neutral
 * (128,128) in the middle, an inward bend of strength (1 - depth/rim)^2 only
 * inside a narrow rim, so the edge refracts and the middle stays calm.
 * Built at half resolution; feImage stretches it to the element box.
 */
export function createGlassMap(width: number, height: number, radius: number, maxRim = 14): GlassMap | null {
  if (typeof document === 'undefined' || width < 2 || height < 2) return null
  const W = Math.max(2, Math.round(width * MAP_SCALE))
  const H = Math.max(2, Math.round(height * MAP_SCALE))
  const rimPx = Math.min(maxRim, Math.min(width, height) / 2)
  const key = `${W}x${H}-${radius}-${rimPx}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const R = Math.min(radius * MAP_SCALE, W / 2, H / 2)
  const B = Math.max(1, Math.min(rimPx * MAP_SCALE, Math.min(W, H) / 2))
  const hw = W / 2
  const hh = H / 2
  const img = ctx.createImageData(W, H)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - hw
      const py = y + 0.5 - hh
      const sx = px < 0 ? -1 : 1
      const sy = py < 0 ? -1 : 1
      const qx = Math.abs(px) - (hw - R)
      const qy = Math.abs(py) - (hh - R)
      const depth = -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R)
      let vx = 0
      let vy = 0
      if (depth >= 0 && depth < B) {
        const mag = (1 - depth / B) ** 2
        let nx: number
        let ny: number
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy) || 1
          nx = (sx * qx) / len
          ny = (sy * qy) / len
        } else if (qx > qy) { nx = sx; ny = 0 } else { nx = 0; ny = sy }
        vx = -nx * mag
        vy = -ny * mag
      }
      const i = (y * W + x) * 4
      img.data[i] = Math.round(128 + vx * 127)
      img.data[i + 1] = Math.round(128 + vy * 127)
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const result = { url: canvas.toDataURL(), bezel: rimPx }
  if (cache.size > 24) cache.clear()
  cache.set(key, result)
  return result
}
