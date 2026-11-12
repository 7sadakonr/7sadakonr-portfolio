import { useEffect, type ReactNode } from 'react'
import { motion } from 'motion/react'

export interface FlightPoint { x: number; y: number }
export interface Flight { id: number; dir: 'open' | 'close'; from: FlightPoint; to: FlightPoint }

const HALF = 9.5 // half of the 19px icon
const EASE = [.45, 0, .25, 1] as const
const DURATION = .4

// A single magnifier that slides between the orb and the command-menu field using measured
// screen coordinates (no shared-layout projection). Opening: leaves the orb, slides left and
// fades out just before arriving. Closing: mirrors it, fading in and landing on the orb.
export default function SearchFlight({ flight, onDone, children }: { flight: Flight | null; onDone: () => void; children: ReactNode }) {
  const id = flight?.id
  // Safety net: never leave the orb glyph hidden if onAnimationComplete doesn't fire.
  useEffect(() => { if (id === undefined) return; const t = window.setTimeout(onDone, DURATION * 1000 + 150); return () => window.clearTimeout(t) }, [id, onDone])
  if (!flight) return null
  const open = flight.dir === 'open'
  return (
    <motion.span
      key={flight.id}
      className="search-flight"
      aria-hidden="true"
      initial={{ x: flight.from.x - HALF, y: flight.from.y - HALF, opacity: open ? 1 : 0, filter: open ? 'blur(0px)' : 'blur(6px)' }}
      animate={{
        x: flight.to.x - HALF,
        y: flight.to.y - HALF,
        opacity: open ? [1, 1, 0, 0] : [0, 1, 1],
        filter: open ? ['blur(0px)', 'blur(3px)', 'blur(6px)', 'blur(6px)'] : ['blur(6px)', 'blur(3px)', 'blur(0px)'],
        transition: {
          x: { duration: DURATION, ease: EASE },
          y: { duration: DURATION, ease: EASE },
          opacity: { duration: DURATION, ease: 'linear', times: open ? [0, .6, .85, 1] : [0, .2, 1] },
          filter: { duration: DURATION, ease: 'linear', times: open ? [0, .35, .85, 1] : [0, .3, 1] },
        },
      }}
      onAnimationComplete={onDone}
    >
      {children}
    </motion.span>
  )
}
