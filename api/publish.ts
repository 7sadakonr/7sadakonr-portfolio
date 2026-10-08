import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Triggers one Vercel rebuild so the public site picks up the latest admin edits.
// Admin-only: the caller must send their Supabase access token and be listed in portfolio_admins.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authorization = req.headers.authorization ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const deployHookUrl = (process.env.VERCEL_DEPLOY_HOOK_URL ?? '').trim()
  if (!supabaseUrl || !supabaseKey || !deployHookUrl) {
    res.status(503).json({ error: 'Publishing is not configured' })
    return
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { data: membership, error: membershipError } = await client
    .from('portfolio_admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (membershipError || !membership) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  try {
    const response = await fetch(deployHookUrl, { method: 'POST' })
    if (!response.ok) {
      res.status(502).json({ error: 'Deploy hook rejected the request' })
      return
    }
    res.status(202).json({ ok: true })
  } catch {
    res.status(502).json({ error: 'Deploy hook is unreachable' })
  }
}
