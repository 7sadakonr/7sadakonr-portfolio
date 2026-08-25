import React, { useEffect, useRef, useState } from 'react'

interface ImageMagnifierProps {
  src: string
  alt: string
  onError?: () => void
}

const ImageMagnifier = React.memo(({ src, alt, onError }: ImageMagnifierProps) => {
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const magnifierSize = 120
  const zoomLevel = 2
  const touchOffsetY = -70
  const cachedRect = useRef({ top: 0, left: 0, width: 0, height: 0 })

  const updateCachedRect = () => {
    const elem = containerRef.current
    if (elem) {
      const r = elem.getBoundingClientRect()
      cachedRect.current = { top: r.top, left: r.left, width: r.width, height: r.height }
      setImgSize({ width: r.width, height: r.height })
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { top, left, width, height } = cachedRect.current
    setMagnifierPos({ x: event.clientX - left, y: event.clientY - top })
    setImgSize({ width, height })
    setIsTouchDevice(false)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    const elem = containerRef.current
    if (!elem || !touch) return

    const { top, left, width, height } = elem.getBoundingClientRect()
    cachedRect.current = { top, left, width, height }
    setMagnifierPos({ x: touch.clientX - left, y: touch.clientY - top })
    setImgSize({ width, height })
    setIsTouchDevice(true)
    longPressTimer.current = setTimeout(() => setShowMagnifier(true), 300)
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    const elem = containerRef.current
    if (!elem || !touch) return

    const { top, left, width, height } = cachedRect.current
    const x = touch.clientX - left
    const y = touch.clientY - top
    if (!showMagnifier && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
      return
    }
    if (showMagnifier) event.preventDefault()
    setMagnifierPos({ x, y })
    setImgSize({ width, height })
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setShowMagnifier(false)
    setIsTouchDevice(false)
  }

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const lensX = magnifierPos.x - magnifierSize / 2
  const lensY = isTouchDevice
    ? magnifierPos.y - magnifierSize / 2 + touchOffsetY
    : magnifierPos.y - magnifierSize / 2
  const lensCenterX = lensX + magnifierSize / 2
  const lensCenterY = lensY + magnifierSize / 2
  const clampedZoomX = Math.max(0, Math.min(lensCenterX, imgSize.width))
  const clampedZoomY = Math.max(0, Math.min(lensCenterY, imgSize.height))
  const bgPosX = -(clampedZoomX * zoomLevel - magnifierSize / 2)
  const bgPosY = -(clampedZoomY * zoomLevel - magnifierSize / 2)

  return (
    <div
      ref={containerRef}
      className="magnifier-container"
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') { updateCachedRect(); setShowMagnifier(true) } }}
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
      {showMagnifier && isLoaded && (
        <div
          className="magnifier-lens"
          style={{
            left: lensX,
            top: lensY,
            width: magnifierSize,
            height: magnifierSize,
            backgroundImage: `url(${src})`,
            backgroundSize: `${imgSize.width * zoomLevel}px ${imgSize.height * zoomLevel}px`,
            backgroundPosition: `${bgPosX}px ${bgPosY}px`,
          }}
        />
      )}
    </div>
  )
})

ImageMagnifier.displayName = 'ImageMagnifier'

export default ImageMagnifier
