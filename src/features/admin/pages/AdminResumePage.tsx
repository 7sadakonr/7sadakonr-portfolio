import { useEffect, useRef, useState } from 'react'
import { loadSiteSettings, replaceResume } from '../../siteSettings/api/siteSettingsRepository'
import type { ResumeLanguage, SiteSettings } from '../../siteSettings/types'

const fileName = (url: string) => {
  const parts = url.split('/')
  return decodeURIComponent(parts[parts.length - 1] ?? 'resume.pdf')
}

const ResumeRow = ({ language, title, settings, onReplace }: { language: ResumeLanguage; title: string; settings: SiteSettings; onReplace: (language: ResumeLanguage, file: File) => Promise<void> }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const url = language === 'en' ? settings.resumeEnUrl : settings.resumeThUrl
  const select = async (file: File | null) => {
    if (!file) return
    setIsReplacing(true)
    try { await onReplace(language, file) } finally { setIsReplacing(false); if (inputRef.current) inputRef.current.value = '' }
  }
  return <article className="admin-resume-row"><div><h2>{title}</h2><p>Current: {fileName(url)}</p></div><div className="admin-row-actions"><a href={url} target="_blank" rel="noopener noreferrer">View</a><input ref={inputRef} className="admin-visually-hidden" type="file" accept="application/pdf,.pdf" onChange={(event) => void select(event.target.files?.[0] ?? null)} /><button type="button" disabled={isReplacing} onClick={() => inputRef.current?.click()}>{isReplacing ? 'Replacing…' : 'Replace PDF'}</button></div></article>
}

const AdminResumePage = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  useEffect(() => { void loadSiteSettings().then(setSettings, (reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Resume settings.')) }, [])
  const replace = async (language: ResumeLanguage, file: File) => { try { setError(null); setWarning(null); const result = await replaceResume(language, file); setSettings(result.settings); setWarning(result.cleanupWarning) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to replace Resume.') } }
  if (!settings) return <section className="admin-page"><p className={error ? 'admin-form-error' : 'admin-empty'}>{error ?? 'Loading Resumes…'}</p></section>
  return <section className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">Resume</p><h1>Manage PDFs</h1></div></div>{error && <p className="admin-form-error" role="alert">{error}</p>}{warning && <p className="admin-form-warning" role="status">{warning}</p>}<div className="admin-resume-list"><ResumeRow language="en" title="English Resume" settings={settings} onReplace={replace} /><ResumeRow language="th" title="Thai Resume" settings={settings} onReplace={replace} /></div></section>
}

export default AdminResumePage
