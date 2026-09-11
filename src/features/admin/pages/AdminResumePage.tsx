import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Chip, Skeleton } from '@heroui/react'
import { loadSiteSettings, replaceResume } from '../../siteSettings/api/siteSettingsRepository'
import type { ResumeLanguage, SiteSettings } from '../../siteSettings/types'

const fileName = (url: string) => {
  const parts = url.split('/')
  return decodeURIComponent(parts[parts.length - 1] ?? 'resume.pdf')
}

const ResumeRow = ({
  language,
  title,
  settings,
  onReplace,
}: {
  language: ResumeLanguage
  title: string
  settings: SiteSettings
  onReplace: (language: ResumeLanguage, file: File) => Promise<void>
}) => {
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
    <Card className="border border-zinc-800 bg-[#16161b] p-5 sm:p-6 shadow-xl rounded-2xl">
      <article className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 font-bold text-xs shrink-0 font-mono shadow-sm">
            PDF
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-white m-0">{title}</h2>
              <Chip size="sm" variant="soft" color="default" className="text-[10px] uppercase font-mono font-bold">
                {language}
              </Chip>
            </div>
            <p className="text-xs text-zinc-400 m-0 font-mono break-all">Current: {fileName(url)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-850 text-zinc-200 hover:text-white hover:bg-zinc-750 transition-colors"
          >
            View
          </a>

          <input
            ref={inputRef}
            className="admin-visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => void select(event.target.files?.[0] ?? null)}
          />

          <Button
            type="button"
            size="sm"
            variant="primary"
            isDisabled={isReplacing}
            className="admin-button text-xs font-bold cursor-pointer px-4"
            onClick={() => inputRef.current?.click()}
          >
            {isReplacing ? 'Replacing…' : 'Replace PDF'}
          </Button>
        </div>
      </article>
    </Card>
  )
}

const AdminResumePage = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadSiteSettings().then(
      setSettings,
      (reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Resume settings.')
    )
  }, [])

  const replace = async (language: ResumeLanguage, file: File) => {
    try {
      setError(null)
      setWarning(null)
      setSuccessMessage(null)
      const result = await replaceResume(language, file)
      setSettings(result.settings)
      setWarning(result.cleanupWarning)
      setSuccessMessage(`Successfully updated ${language === 'en' ? 'English' : 'Thai'} resume PDF.`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to replace Resume.')
    }
  }

  if (!settings) {
    return (
      <section className="admin-page max-w-3xl">
        <div className="admin-page-heading mb-6">
          <span className="admin-eyebrow">Resume</span>
          <h1 className="text-2xl font-bold text-white">{error ? 'Error' : 'Loading Resumes…'}</h1>
        </div>
        {error ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="text-xs font-bold">Failed to load</Alert.Title>
              <Alert.Description className="text-xs">{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : (
          <div className="border border-zinc-800 bg-[#16161b] p-8 rounded-2xl flex flex-col gap-4">
            <Skeleton className="h-6 w-40 rounded-lg bg-zinc-800" />
            <Skeleton className="h-20 w-full rounded-lg bg-zinc-800/60" />
            <Skeleton className="h-20 w-full rounded-lg bg-zinc-800/60" />
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="admin-page max-w-3xl">
      <div className="admin-page-heading flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="admin-eyebrow mb-1">Documents</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">Resume Management</h1>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="text-xs font-bold">Upload Error</Alert.Title>
              <Alert.Description className="text-xs">{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {warning && (
        <div className="mb-5">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="text-xs font-bold">Notice</Alert.Title>
              <Alert.Description className="text-xs">{warning}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {successMessage && (
        <div className="mb-5">
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="text-xs font-bold">Updated</Alert.Title>
              <Alert.Description className="text-xs">{successMessage}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <ResumeRow language="en" title="English Resume" settings={settings} onReplace={replace} />
        <ResumeRow language="th" title="Thai Resume" settings={settings} onReplace={replace} />
      </div>
    </section>
  )
}

export default AdminResumePage
