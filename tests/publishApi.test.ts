import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const getUser = vi.fn()
const maybeSingle = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))

const run = async (request: Partial<VercelRequest>) => {
  const { default: handler } = await import('../api/publish')
  const result = { status: 0, body: undefined as unknown }
  const response = {
    setHeader: vi.fn(),
    status(code: number) { result.status = code; return this },
    json(body: unknown) { result.body = body; return this },
  } as unknown as VercelResponse
  await handler({ method: 'POST', headers: {}, ...request } as VercelRequest, response)
  return result
}

describe('POST /api/publish', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'publishable')
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', 'https://api.vercel.com/hook')
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    maybeSingle.mockResolvedValue({ data: { user_id: 'user-1' }, error: null })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks() })

  it('rejects non-POST and unauthenticated requests without calling the hook', async () => {
    expect((await run({ method: 'GET' })).status).toBe(405)
    expect((await run({})).status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects signed-in users who are not admins', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    expect((await run({ headers: { authorization: 'Bearer token' } })).status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports missing configuration instead of failing silently', async () => {
    vi.stubEnv('VERCEL_DEPLOY_HOOK_URL', '')
    expect((await run({ headers: { authorization: 'Bearer token' } })).status).toBe(503)
  })

  it('triggers exactly one deploy for an admin', async () => {
    const result = await run({ headers: { authorization: 'Bearer token' } })
    expect(result.status).toBe(202)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('https://api.vercel.com/hook', { method: 'POST' })
  })
})
