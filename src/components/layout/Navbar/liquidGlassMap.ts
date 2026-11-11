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

export interface GlassMap { url: string; bezel: number; scale: number }
const MAP_SCALE = 0.5
// Displacement scale as a multiple of the bezel (magnifier: BEND 100 / BEZEL 33 ~ 3 for a shift of ~1.5x the bezel).
const BEND = 3

// Same dome profile as the project image magnifier (glassLensMap.ts): 0 at the inner edge of the bezel,
// rising steeply to 1 at the outer edge, so the rim bends hard and the middle stays flat.
const domeProfile = (t: number) => 1 - Math.sqrt(1 - t * t)

export interface GlassMapOptions {
  /** Bezel width (px) along the flat top/bottom edges. */
  band?: number
  /** Bezel width (px) at the rounded left/right ends. */
  end?: number
}

/**
 * Displacement map for a rounded rectangle (signed-distance field): neutral (128,128) in the middle,
 * rays bent inward by a dome-shaped bezel so the edge acts as a lens. The bezel is thinner along the
 * flat top/bottom (`band`) than at the rounded ends (`end`), leaving a clear strip in the middle.
 * Built at half resolution; feImage stretches it to the element box.
 */
export function createGlassMap(width: number, height: number, radius: number, { band = 14, end = 14 }: GlassMapOptions = {}): GlassMap | null {
  if (typeof document === 'undefined' || width < 2 || height < 2) return null
  const W = Math.max(2, Math.round(width * MAP_SCALE))
  const H = Math.max(2, Math.round(height * MAP_SCALE))
  const half = Math.min(width, height) / 2
  const endPx = Math.min(end, half)
  const bandPx = Math.min(band, half)
  const key = `${W}x${H}-${radius}-${bandPx}-${endPx}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const R = Math.min(radius * MAP_SCALE, W / 2, H / 2)
  const endB = Math.max(1, endPx * MAP_SCALE)
  const bandB = Math.max(1, bandPx * MAP_SCALE)
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
      if (depth >= 0) {
        let nx: number
        let ny: number
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy) || 1
          nx = (sx * qx) / len
          ny = (sy * qy) / len
        } else if (qx > qy) { nx = sx; ny = 0 } else { nx = 0; ny = sy }
        // bezel width follows the edge direction: `band` on flat top/bottom, `end` on the rounded ends
        const B = bandB + (endB - bandB) * nx * nx
        if (depth < B) {
          const mag = domeProfile(1 - depth / B) * (B / endB)
          vx = -nx * mag
          vy = -ny * mag
        }
      }
      const i = (y * W + x) * 4
      img.data[i] = Math.round(128 + vx * 127)
      img.data[i + 1] = Math.round(128 + vy * 127)
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const result = { url: canvas.toDataURL(), bezel: endPx, scale: BEND * endPx }
  if (cache.size > 24) cache.clear()
  cache.set(key, result)
  return result
}
