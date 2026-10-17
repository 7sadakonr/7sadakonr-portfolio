import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import { loadSiteSettings, replaceResume } from '../../siteSettings/api/siteSettingsRepository'
import type { ResumeLanguage, SiteSettings } from '../../siteSettings/types'
import PageHeader from '../components/ui/PageHeader'
import PageLoadState from '../components/ui/PageLoadState'
import { useToast } from '../components/ui/toastContext'

const fileName = (url: string) => {
  const parts = url.split('/')
  return decodeURIComponent(parts[parts.length - 1] ?? 'resume.pdf')
}

interface ResumeRowProps {
  language: ResumeLanguage
  title: string
  settings: SiteSettings
  onReplace: (language: ResumeLanguage, file: File) => Promise<void>
}

const ResumeRow = ({ language, title, settings, onReplace }: ResumeRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const url = language === 'en' ? settings.resumeEnUrl : settings.resumeThUrl

  const select = async (file: File | null) => {
    if (!file) return
    setIsReplacing(true)
    try {
      await onReplace(language, file)
    } finally {
      setIsReplacing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <article className="adm-row">
      <div className="adm-row__main">
        <h2 className="adm-row__title">
          {title}
          <span className="adm-badge">PDF · {language.toUpperCase()}</span>
        </h2>
        <p className="adm-row__meta" title={fileName(url)}>Current file: {fileName(url)}</p>
      </div>

      <div className="adm-row__actions">
        <a href={url} target="_blank" rel="noopener noreferrer" className="adm-link-button">
          View <span aria-hidden="true">↗</span><span className="sr-only"> {title} (opens in a new tab)</span>
        </a>
        <input
          ref={inputRef}
          className="admin-visually-hidden"
          type="file"
          accept="application/pdf,.pdf"
          tabIndex={-1}
          aria-label={`Choose a PDF to replace the ${title}`}
          onChange={(event) => void select(event.target.files?.[0] ?? null)}
        />
        <Button type="button" size="sm" variant="primary" className="admin-button" isPending={isReplacing} onClick={() => inputRef.current?.click()}>
          {isReplacing ? 'Uploading…' : 'Replace PDF'}
        </Button>
      </div>
    </article>
  )
}

const AdminResumePage = () => {
  const toast = useToast()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    void loadSiteSettings().then(
      setSettings,
      (reason: unknown) => setLoadError(reason instanceof Error ? reason.message : 'Unable to load Resume settings.'),
    )
  }, [])
  useEffect(load, [load])

  const replace = async (language: ResumeLanguage, file: File) => {
    const label = language === 'en' ? 'English' : 'Thai'
    try {
      const result = await replaceResume(language, file)
      setSettings(result.settings)
      toast.success(`${label} resume updated`, 'Visitors get the new file after the next publish.')
      if (result.cleanupWarning) toast.info('Heads up', result.cleanupWarning)
    } catch (reason) {
      toast.error(`Couldn't update the ${label} resume`, reason instanceof Error ? reason.message : 'Unable to replace Resume.')
    }
  }

  if (!settings) return <PageLoadState eyebrow="Documents" title="Resume" error={loadError} onRetry={load} />

  return (
    <section className="admin-page adm-narrow">
      <PageHeader eyebrow="Documents" title="Resume" description="The PDFs visitors download from your site. Replacing a file keeps the same download link." />
      <div className="adm-list">
        <ResumeRow language="en" title="English resume" settings={settings} onReplace={replace} />
        <ResumeRow language="th" title="Thai resume" settings={settings} onReplace={replace} />
      </div>
    </section>
  )
}

export default AdminResumePage
