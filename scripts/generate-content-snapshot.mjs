import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const target = resolve(root, 'src/features/content/contentSnapshot.json')
// No `vite` import: it pulls native rollup binaries this script does not need.
for (const file of ['.env.local', '.env']) {
  try { process.loadEnvFile?.(resolve(root, file)) } catch { /* file is optional */ }
}
// Same fallbacks as vite.config.ts: Vercel projects may expose these without the VITE_ prefix.
const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY
const SITE_SETTINGS_SELECT = 'id,display_name,hero_subtitle,bio_paragraph_1,bio_paragraph_2,current_focus,contact_heading,contact_description,contact_links,resume_en_url,resume_en_storage_path,resume_th_url,resume_th_storage_path,updated_at'

const keepExisting = (reason) => {
  console.warn(`[content-snapshot] ${reason} — keeping the existing snapshot.`)
  process.exit(0)
}

if (!url || !key) keepExisting('Supabase env is not set')

try {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [projects, settings] = await Promise.all([
    client.from('projects').select('*').eq('is_visible', true).order('sort_order', { ascending: true }).order('id', { ascending: true }),
    client.from('site_settings').select(SITE_SETTINGS_SELECT).eq('id', 1).maybeSingle(),
  ])
  if (projects.error) throw projects.error
  if (settings.error) throw settings.error

  let previous = {}
  try { previous = JSON.parse(await readFile(target, 'utf8')) } catch { /* first run */ }
  const next = { projects: projects.data ?? [], siteSettings: settings.data ?? null }
  if (JSON.stringify({ projects: previous.projects, siteSettings: previous.siteSettings }) === JSON.stringify(next)) {
    console.log('[content-snapshot] No content changes.')
  } else {
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...next }, null, 2)}\n`)
    console.log(`[content-snapshot] Wrote ${next.projects.length} projects and ${next.siteSettings ? 'site settings' : 'no site settings'}.`)
  }
} catch (error) {
  keepExisting(`Fetch failed (${error instanceof Error ? error.message : String(error)})`)
}
