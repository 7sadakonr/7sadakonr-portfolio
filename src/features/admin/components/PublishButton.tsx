import { useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import { supabase } from '../../../lib/supabase'

type PublishState = 'idle' | 'publishing' | 'done' | 'error'

const COOLDOWN_MS = 60_000

const LABELS: Record<PublishState, string> = {
  idle: 'Publish',
  publishing: 'Publishing…',
  done: 'Publishing started',
  error: 'Publish failed',
}

// One click = one rebuild, so edits can be batched instead of redeploying on every save.
const PublishButton = () => {
  const [state, setState] = useState<PublishState>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const handlePublish = async () => {
    if (!supabase || state === 'publishing' || state === 'done') return
    setState('publishing')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('No session')
      const response = await fetch('/api/publish', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error(`Publish failed (${response.status})`)
      setState('done')
      resetTimer.current = window.setTimeout(() => setState('idle'), COOLDOWN_MS)
    } catch {
      setState('error')
      resetTimer.current = window.setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <span title="Rebuild the public site with your latest changes (takes 1–3 minutes)">
    <Button
      size="sm"
      variant="primary"
      className="text-xs cursor-pointer px-3 py-1.5"
      isDisabled={state === 'publishing' || state === 'done'}
      aria-live="polite"
      onClick={() => void handlePublish()}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mr-1">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      {LABELS[state]}
    </Button>
    </span>
  )
}

export default PublishButton
