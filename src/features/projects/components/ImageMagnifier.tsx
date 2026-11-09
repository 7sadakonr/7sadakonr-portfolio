import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createLensDisplacementMap } from './glassLensMap'

interface ImageMagnifierProps {
  src: string
  alt: string
  onError?: () => void
}

const LENS_SIZE = 180
const BEND = 100
const FRINGE = 28
const BEZEL = 11 * 3
const ZOOM = 1.8
// Spring tuning for the jelly motion
const STIFFNESS = 220
const DAMPING = 16
const STRETCH_MAX = 0.2
const STRETCH_STIFFNESS = 260
const STRETCH_DAMPING = 13
const SCALE_STIFFNESS = 150
const SCALE_DAMPING = 14
const TOUCH_OFFSET_Y = -110

const ImageMagnifier = React.memo(({ src, alt, onError }: ImageMagnifierProps) => {
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lensRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const reducedMotion = useRef(false)
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, s: 0, sv: 0, scale: 0, scv: 0, angle: 0, last: 0 })
  const pointer = useRef({ x: 0, y: 0, touch: false })
  const cachedRect = useRef({ top: 0, left: 0, width: 0, height: 0 })
  const filterId = `lens-${useId().replace(/:/g, '-')}`
  const mapUrl = useMemo(() => createLensDisplacementMap(LENS_SIZE, BEZEL), [])

  const tick = (now: number) => {
    const lens = lensRef.current
    const image = imageRef.current
    if (!lens || !image) { rafRef.current = null; return }
    const st = motion.current
    const dt = Math.min((now - st.last) / 1000, 1 / 30) || 1 / 60
    st.last = now

    const { width, height } = cachedRect.current
    const { x: px, y: py, touch } = pointer.current
    const tx = px
    const ty = touch ? py + TOUCH_OFFSET_Y : py

    // Position spring: the lens trails the cursor and overshoots a little.
    st.vx += (STIFFNESS * (tx - st.x) - DAMPING * st.vx) * dt
    st.vy += (STIFFNESS * (ty - st.y) - DAMPING * st.vy) * dt
    st.x += st.vx * dt
    st.y += st.vy * dt

    // Stretch spring: driven by speed, rings (wobbles) after the cursor stops.
    // Axis-aligned (no rotation): horizontal motion widens, vertical motion makes it taller.
    const stretchTarget = reducedMotion.current
      ? 0
      : Math.max(-STRETCH_MAX, Math.min((Math.abs(st.vx) - Math.abs(st.vy)) / 1200, STRETCH_MAX))
    st.sv += (STRETCH_STIFFNESS * (stretchTarget - st.s) - STRETCH_DAMPING * st.sv) * dt
    st.s += st.sv * dt

    // Entrance spring: scale 0 -> 1 with overshoot.
    st.scv += (SCALE_STIFFNESS * (1 - st.scale) - SCALE_DAMPING * st.scv) * dt
    st.scale += st.scv * dt

    if (bodyRef.current) {
      bodyRef.current.style.opacity = String(Math.max(0, Math.min(st.scale * 1.6, 1)))
    }

    const sx = st.scale * (1 + st.s)
    const sy = st.scale * (1 - st.s * 0.7)
    lens.style.transform =
      `translate3d(${st.x - LENS_SIZE / 2}px, ${st.y - LENS_SIZE / 2}px, 0) scale(${sx}, ${sy})`

    const zx = Math.max(0, Math.min(st.x, width))
    const zy = Math.max(0, Math.min(st.y, height))
    image.style.backgroundSize = `${width * ZOOM}px ${height * ZOOM}px`
    image.style.backgroundPosition = `${-(zx * ZOOM - LENS_SIZE / 2)}px ${-(zy * ZOOM - LENS_SIZE / 2)}px`

    rafRef.current = requestAnimationFrame(tick)
  }

  const updateCachedRect = () => {
    const elem = containerRef.current
    if (!elem) return
    const r = elem.getBoundingClientRect()
    cachedRect.current = { top: r.top, left: r.left, width: r.width, height: r.height }
  }

  const setPointer = (clientX: number, clientY: number, touch: boolean) => {
    const { top, left } = cachedRect.current
    pointer.current = { x: clientX - left, y: clientY - top, touch }
  }

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    updateCachedRect()
    setPointer(event.clientX, event.clientY, false)
    setShowMagnifier(true)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setPointer(event.clientX, event.clientY, false)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    updateCachedRect()
    setPointer(touch.clientX, touch.clientY, true)
    longPressTimer.current = setTimeout(() => setShowMagnifier(true), 300)
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    if (!showMagnifier && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
      return
    }
    if (showMagnifier) event.preventDefault()
    setPointer(touch.clientX, touch.clientY, true)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setShowMagnifier(false)
  }

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])

  // Run the spring loop only while the lens is visible.
  useEffect(() => {
    if (!(showMagnifier && isLoaded)) return
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const st = motion.current
    const { x, y, touch } = pointer.current
    st.x = x
    st.y = touch ? y + TOUCH_OFFSET_Y : y
    st.vx = 0; st.vy = 0; st.s = 0; st.sv = 0
    st.scale = reducedMotion.current ? 1 : 0
    st.scv = 0
    st.last = performance.now()
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMagnifier, isLoaded])

  return (
    <div
      ref={containerRef}
      className="magnifier-container"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') setShowMagnifier(false) }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        width="960"
        height="540"
        className="project-preview-image"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={() => setIsLoaded(true)}
        onError={onError}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
      {mapUrl && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <feImage href={mapUrl} x="0" y="0" width={LENS_SIZE} height={LENS_SIZE} preserveAspectRatio="none" result="map" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={BEND} xChannelSelector="R" yChannelSelector="G" result="dR" />
              <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={BEND + FRINGE / 2} xChannelSelector="R" yChannelSelector="G" result="dG" />
              <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={BEND + FRINGE} xChannelSelector="R" yChannelSelector="G" result="dB" />
              <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
              <feBlend in="r" in2="g" mode="screen" result="rg" />
              <feBlend in="rg" in2="b" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}
      {showMagnifier && isLoaded && (
        <div
          ref={lensRef}
          className="magnifier-lens"
          style={{ width: LENS_SIZE, height: LENS_SIZE }}
        >
          <div ref={bodyRef} className="magnifier-lens__body" style={{ opacity: 0 }}>
            <div
              ref={imageRef}
              className="magnifier-lens__image"
              style={{
                backgroundImage: `url(${src})`,
                filter: mapUrl ? `url(#${filterId})` : undefined,
              }}
            />
            <div className="magnifier-lens__shine" />
          </div>
        </div>
      )}
    </div>
  )
})

ImageMagnifier.displayName = 'ImageMagnifier'

export default ImageMagnifier
