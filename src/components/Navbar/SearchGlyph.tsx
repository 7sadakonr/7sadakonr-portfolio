import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// The search icon shown in the orb and in the command menu. Instead of travelling between
// them it blurs and shrinks away where it is, then the one on the other side blurs/grows in.
const HIDDEN = { opacity: 0, scale: .5, filter: 'blur(8px)' }
const SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' }

export default function SearchGlyph({ children, delay = .12, instantExit = false }: { children: ReactNode; delay?: number; instantExit?: boolean }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .1 }}>{children}</motion.span>
  return (
    <motion.span
      initial={HIDDEN}
      animate={{ ...SHOWN, transition: { duration: .28, delay, ease: [.22, 1, .36, 1] } }}
      exit={{ ...HIDDEN, transition: instantExit ? { duration: 0 } : { duration: .15, ease: [.4, 0, 1, 1] } }}
    >
      {children}
    </motion.span>
  )
}
