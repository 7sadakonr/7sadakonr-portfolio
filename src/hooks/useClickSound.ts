import { useEffect } from 'react'
import { playTick } from '../lib/sound'

const SELECTOR = 'button, a[href], [role="button"]'

/** Plays a soft tick for clicks on buttons and links anywhere in the app. */
export const useClickSound = () => {
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const el = target.closest<HTMLElement>(SELECTOR)
      if (!el || el.closest('[data-no-sound]')) return
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
      playTick()
    }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [])
}
