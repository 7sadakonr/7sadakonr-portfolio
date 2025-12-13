import { useState, useEffect, useRef } from 'react'
import './SmoothFollower.css'

export default function SmoothFollower() {
    const cursorDotRef = useRef(null)
    const cursorRingRef = useRef(null)

    // Physics & State
    const mousePosition = useRef({ x: 0, y: 0 })
    const dotPosition = useRef({ x: 0, y: 0 })
    const borderDotPosition = useRef({ x: 0, y: 0 })

    const [isHovering, setIsHovering] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [isClicking, setIsClicking] = useState(false)

    // Smoothness factors
    const DOT_SMOOTHNESS = 1
    const BORDER_DOT_SMOOTHNESS = 0.15

    useEffect(() => {
        // Check if device has mouse (not touch-only)
        const hasPointer = window.matchMedia('(pointer: fine)').matches
        if (!hasPointer) return

        const handleMouseMove = (e) => {
            mousePosition.current = { x: e.clientX, y: e.clientY }
            // Use functional update to avoid dependency on isVisible state
            setIsVisible(prev => {
                if (!prev) return true
                return prev
            })
        }

        const handleMouseEnter = () => setIsHovering(true)
        const handleMouseLeave = () => setIsHovering(false)
        const handleMouseOut = () => setIsVisible(false)
        const handleMouseOver = () => setIsVisible(true)

        const handleMouseDown = () => setIsClicking(true)
        const handleMouseUp = () => setIsClicking(false)

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('mouseout', handleMouseOut)
        document.addEventListener('mouseover', handleMouseOver)

        const addListeners = () => {
            const interactiveElements = document.querySelectorAll(
                'a, button, img, input, textarea, select, [role="button"]'
            )
            interactiveElements.forEach((element) => {
                element.addEventListener('mouseenter', handleMouseEnter)
                element.addEventListener('mouseleave', handleMouseLeave)
            })
        }

        // Initial setup
        addListeners()

        // Re-add listeners when DOM changes (for SPA navigation)
        const observer = new MutationObserver(addListeners)
        observer.observe(document.body, { childList: true, subtree: true })

        const animate = () => {
            const lerp = (start, end, factor) => {
                return start + (end - start) * factor
            }

            // Update positions
            dotPosition.current.x = lerp(dotPosition.current.x, mousePosition.current.x, DOT_SMOOTHNESS)
            dotPosition.current.y = lerp(dotPosition.current.y, mousePosition.current.y, DOT_SMOOTHNESS)

            borderDotPosition.current.x = lerp(borderDotPosition.current.x, mousePosition.current.x, BORDER_DOT_SMOOTHNESS)
            borderDotPosition.current.y = lerp(borderDotPosition.current.y, mousePosition.current.y, BORDER_DOT_SMOOTHNESS)

            // Direct DOM update for performance
            if (cursorDotRef.current) {
                cursorDotRef.current.style.left = `${dotPosition.current.x}px`
                cursorDotRef.current.style.top = `${dotPosition.current.y}px`
            }

            if (cursorRingRef.current) {
                cursorRingRef.current.style.left = `${borderDotPosition.current.x}px`
                cursorRingRef.current.style.top = `${borderDotPosition.current.y}px`
            }

            requestAnimationFrame(animate)
        }

        const animationId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('mouseout', handleMouseOut)
            document.removeEventListener('mouseover', handleMouseOver)
            observer.disconnect()
            cancelAnimationFrame(animationId)
        }
    }, [])

    // Don't render on touch devices
    if (typeof window === 'undefined') return null

    return (
        <div className={`cursor-container ${isVisible ? 'visible' : ''}`}>
            {/* Inner dot */}
            <div
                ref={cursorDotRef}
                className={`cursor-dot ${isClicking ? 'clicking' : ''}`}
            />

            {/* Outer ring */}
            <div
                ref={cursorRingRef}
                className={`cursor-ring ${isHovering ? 'hovering' : ''} ${isClicking ? 'clicking' : ''}`}
            />
        </div>
    )
}
