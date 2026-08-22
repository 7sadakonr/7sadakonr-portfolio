import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const seed = JSON.parse(await readFile(resolve(root, 'scripts/data/projects.seed.json'), 'utf8'))
const url = process.env.VITE_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !secret) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY before migrating projects.')

const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: existingProjects, error: existingError } = await client.from('projects').select('*')
if (existingError) throw existingError
const existingByLegacyId = new Map((existingProjects ?? []).filter((project) => project.legacy_source_id !== null).map((project) => [project.legacy_source_id, project]))
if ((existingProjects ?? []).some((project) => project.legacy_source_id === null)) {
  throw new Error('Migration is pre-cutover only: projects created outside the legacy manifest already exist.')
}
const rows = []
for (const item of seed) {
  let image_url = null
  let image_storage_path = null
  if (item.image_source_path) {
    const bytes = await readFile(resolve(root, item.image_source_path))
    const hash = createHash('sha256').update(bytes).digest('hex')
    if (hash !== item.image_sha256) throw new Error(`Source image hash changed for ${item.title}; regenerate the reviewed migration manifest first.`)
    image_storage_path = `legacy/${item.legacy_source_id}/${hash}.webp`
    const { error: uploadError } = await client.storage.from('project-images').upload(image_storage_path, bytes, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    })
    if (uploadError) throw uploadError
    image_url = client.storage.from('project-images').getPublicUrl(image_storage_path).data.publicUrl
  }
  rows.push({
    legacy_source_id: item.legacy_source_id,
    title: item.title,
    description: item.description,
    tech: item.tech,
    image_url,
    image_storage_path,
    live_url: item.live_url || null,
    github_url: item.github_url || null,
    fallback_gradient: item.fallback_gradient,
    sort_order: item.sort_order,
    is_visible: true,
    is_in_progress: false,
  })
}

for (const row of rows) {
  const existing = existingByLegacyId.get(row.legacy_source_id)
  if (!existing) continue
  const comparableFields = ['title', 'description', 'image_url', 'image_storage_path', 'live_url', 'github_url', 'fallback_gradient', 'sort_order', 'is_visible', 'is_in_progress']
  const hasMismatch = comparableFields.some((field) => existing[field] !== row[field]) || JSON.stringify(existing.tech) !== JSON.stringify(row.tech)
  if (hasMismatch) throw new Error(`Migration is pre-cutover only: legacy project ${row.legacy_source_id} no longer matches the reviewed manifest.`)
}

const missingRows = rows.filter((row) => !existingByLegacyId.has(row.legacy_source_id))
if (missingRows.length > 0) {
  const { error } = await client.from('projects').insert(missingRows)
  if (error) throw error
}

const { data: migratedRows, error: migratedRowsError } = await client.from('projects').select('id, legacy_source_id').not('legacy_source_id', 'is', null).order('legacy_source_id')
if (migratedRowsError) throw migratedRowsError
await mkdir(resolve(root, '.project-migration'), { recursive: true })
await writeFile(resolve(root, '.project-migration/legacy-project-uuid-map.json'), JSON.stringify(migratedRows, null, 2))
console.log(`Migrated ${missingRows.length} new project(s); ${rows.length - missingRows.length} existing row(s) matched without overwrite. Run npm run projects:verify before cutover.`)
