import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const seed = JSON.parse(await readFile(resolve(root, 'scripts/data/projects.seed.json'), 'utf8'))
const url = process.env.VITE_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !secret) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY before verifying migration.')

const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
const { data, error } = await client.from('projects').select('*').order('sort_order')
if (error) throw error
if (!data || data.length !== seed.length) throw new Error(`Expected exactly ${seed.length} projects before cutover, found ${data?.length ?? 0}.`)
if (data.some((project) => project.legacy_source_id === null)) throw new Error('Found a project without a legacy source id before cutover.')
const uuidMap = JSON.parse(await readFile(resolve(root, '.project-migration/legacy-project-uuid-map.json'), 'utf8'))
const expectedUuidByLegacyId = new Map(uuidMap.map((item) => [item.legacy_source_id, item.id]))

for (const [index, expected] of seed.entries()) {
  const actual = data[index]
  if (!actual || actual.legacy_source_id !== expected.legacy_source_id
    || actual.title !== expected.title
    || actual.description !== expected.description
    || JSON.stringify(actual.tech) !== JSON.stringify(expected.tech)
    || actual.live_url !== (expected.live_url || null)
    || actual.github_url !== (expected.github_url || null)
    || actual.sort_order !== expected.sort_order
    || actual.is_visible !== true
    || actual.is_in_progress !== false
    || actual.fallback_gradient !== expected.fallback_gradient) {
    throw new Error(`Parity mismatch for legacy project ${expected.legacy_source_id}.`)
  }
  if (expectedUuidByLegacyId.get(expected.legacy_source_id) !== actual.id) throw new Error(`UUID changed for legacy project ${expected.legacy_source_id}.`)
  if (expected.image_source_path) {
    if (!actual.image_url || !actual.image_storage_path) throw new Error(`Missing image for ${expected.title}.`)
    const [sourceBytes, response] = await Promise.all([readFile(resolve(root, expected.image_source_path)), fetch(actual.image_url)])
    if (!response.ok || !response.headers.get('content-type')?.includes('image/webp')) throw new Error(`Stored image is unavailable for ${expected.title}.`)
    const remoteHash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')
    const sourceHash = createHash('sha256').update(sourceBytes).digest('hex')
    if (sourceHash !== expected.image_sha256) throw new Error(`Source image hash changed for ${expected.title}.`)
    if (remoteHash !== sourceHash) throw new Error(`Stored image bytes differ for ${expected.title}.`)
  }
}

console.log(`Verified ${seed.length} migrated project(s), including image parity.`)
