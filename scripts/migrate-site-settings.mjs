import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const env = loadEnv('', process.cwd(), '')
const url = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SECRET_KEY
if (!url || !secret) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY before migrating site settings.')
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: current, error: readError } = await client.from('site_settings').select('id,resume_en_url,resume_en_storage_path,resume_th_url,resume_th_storage_path').eq('id', 1).single()
if (readError || !current) throw readError ?? new Error('The singleton site settings row is missing.')
if (current.resume_en_storage_path || current.resume_th_storage_path) {
  if (!current.resume_en_storage_path || !current.resume_th_storage_path) throw new Error('Resume paths are partially migrated; resolve them before rerunning.')
  console.log('Resume files are already managed by Storage; no migration was applied.')
  process.exit(0)
}

const files = [
  ['en', 'Jetsadakorn_Muangwichit_Resume_EN.pdf'],
  ['th', 'Jetsadakorn_Muangwichit_Resume_TH.pdf'],
]
const uploaded = []
try {
  for (const [language, name] of files) {
    const path = `${language}/${randomUUID()}.pdf`
    const bytes = await readFile(resolve(root, 'public', 'resume', name))
    const { error } = await client.storage.from('resume-files').upload(path, bytes, { cacheControl: '31536000', contentType: 'application/pdf', upsert: false })
    if (error) throw error
    uploaded.push({ language, path, url: client.storage.from('resume-files').getPublicUrl(path).data.publicUrl })
  }
  const english = uploaded.find((item) => item.language === 'en')
  const thai = uploaded.find((item) => item.language === 'th')
  if (!english || !thai) throw new Error('Both resume files are required.')
  const { error } = await client.from('site_settings').update({ resume_en_url: english.url, resume_en_storage_path: english.path, resume_th_url: thai.url, resume_th_storage_path: thai.path }).eq('id', 1)
  if (error) throw error
  console.log('Migrated both resume PDFs to versioned Supabase Storage paths.')
} catch (error) {
  if (uploaded.length) await client.storage.from('resume-files').remove(uploaded.map((item) => item.path))
  throw error
}
