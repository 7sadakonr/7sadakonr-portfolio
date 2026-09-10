import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const url = process.env.VITE_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !secret) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY before verifying site settings migration.')
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
const { data, error } = await client.from('site_settings').select('id,resume_en_url,resume_en_storage_path,resume_th_url,resume_th_storage_path').eq('id', 1).single()
if (error || !data) throw error ?? new Error('The singleton site settings row is missing.')
for (const [language, name, path, fileUrl] of [['en', 'Jetsadakorn_Muangwichit_Resume_EN.pdf', data.resume_en_storage_path, data.resume_en_url], ['th', 'Jetsadakorn_Muangwichit_Resume_TH.pdf', data.resume_th_storage_path, data.resume_th_url]]) {
  if (!path || !new RegExp(`^${language}/[0-9a-f-]+\\.pdf$`, 'i').test(path)) throw new Error(`Missing versioned ${language} resume path.`)
  const [source, response] = await Promise.all([readFile(resolve(root, 'public', 'resume', name)), fetch(fileUrl)])
  if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) throw new Error(`Stored ${language} resume is unavailable.`)
  const remote = Buffer.from(await response.arrayBuffer())
  if (createHash('sha256').update(source).digest('hex') !== createHash('sha256').update(remote).digest('hex')) throw new Error(`Stored ${language} resume bytes differ from the initial PDF.`)
}
console.log('Verified the singleton settings row and both migrated resume PDFs.')
