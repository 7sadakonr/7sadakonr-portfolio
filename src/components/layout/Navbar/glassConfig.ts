export const GLASS_BLEND_MODES = ['difference', 'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'exclusion'] as const
export type GlassChannel = 'R' | 'G' | 'B' | 'A'
export interface GlassSurfaceConfig {
  borderWidth: number
  brightness: number
  opacity: number
  blur: number
  displace: number
  saturation: number
  distortionScale: number
  redOffset: number
  greenOffset: number
  blueOffset: number
  xChannel: GlassChannel
  yChannel: GlassChannel
  mixBlendMode: (typeof GLASS_BLEND_MODES)[number]
}

export const GLASS_VIEWS = ['navigation', 'compact', 'command'] as const
export type GlassView = (typeof GLASS_VIEWS)[number]
/** Everything tunable for one surface: refraction settings plus its own blur and tint alpha. */
export interface ViewGlass extends GlassSurfaceConfig { frostBlur: number; tint: number }
export type ViewGlassMap = Record<GlassView, ViewGlass>
/** Original island tint colours; only the alpha is tunable. */
export const TINT_RGB: Record<GlassView, string> = { navigation: '26, 26, 26', compact: '26, 26, 26', command: '18, 18, 18' }

/** SVG filters inside backdrop-filter are only honoured by Chromium on desktop (same gate GlassSurface applies). */
export function supportsLiquidRefraction(): boolean {
  if (typeof navigator === 'undefined' || typeof CSS === 'undefined' || typeof window === 'undefined') return false
  if (window.matchMedia('(max-width: 768px), (pointer: coarse)').matches) return false
  const ua = navigator.userAgent
  const chromium = 'userAgentData' in navigator || (/\b(?:Chrome|Chromium|Edg)\//.test(ua) && !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) && !/iPhone|iPad|iPod/.test(ua))
  return chromium && !!CSS.supports?.('backdrop-filter', 'url(#x)')
}
