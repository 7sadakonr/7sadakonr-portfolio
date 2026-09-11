import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Input, Skeleton, TextArea } from '@heroui/react'
import { loadSiteSettings, saveProfileSettings } from '../../siteSettings/api/siteSettingsRepository'
import type { SiteSettings } from '../../siteSettings/types'

const AdminProfilePage = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    void loadSiteSettings().then(
      setSettings,
      (reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Profile settings.')
    )
  }, [])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settings) return
    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)
    try {
      const saved = await saveProfileSettings(settings)
      setSettings(saved)
      setSuccessMessage('Profile settings saved successfully.')
      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save Profile settings.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!settings) {
    return (
      <section className="admin-page max-w-3xl">
        <div className="admin-page-heading mb-6">
          <span className="admin-eyebrow">Profile</span>
          <h1 className="text-2xl font-bold text-white">{error ? 'Error' : 'Loading Profile…'}</h1>
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
            <Skeleton className="h-10 w-full rounded-lg bg-zinc-800/60" />
            <Skeleton className="h-28 w-full rounded-lg bg-zinc-800/40" />
          </div>
        )}
      </section>
    )
  }

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings((current) => (current ? { ...current, [key]: value } : current))

  return (
    <section className="admin-page max-w-3xl">
      <form onSubmit={(event) => void save(event)}>
        <div className="admin-page-heading flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="admin-eyebrow mb-1">Portfolio Settings</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">Profile &amp; Bio Content</h1>
          </div>
          <Button
            type="submit"
            variant="primary"
            isDisabled={isSaving}
            className="admin-button font-bold text-xs cursor-pointer px-5"
          >
            {isSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title className="text-xs font-bold">Error</Alert.Title>
                <Alert.Description className="text-xs">{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        )}

        {successMessage && (
          <div className="mb-6">
            <Alert status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title className="text-xs font-bold">Success</Alert.Title>
                <Alert.Description className="text-xs">{successMessage}</Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Identity & Hero Card */}
          <Card className="border border-zinc-800 bg-[#16161b] p-6 sm:p-7 shadow-xl rounded-2xl">
            <div className="flex flex-col gap-5">
              <div className="border-b border-zinc-800/80 pb-3">
                <span className="admin-eyebrow">Identity &amp; Hero</span>
                <h2 className="text-base font-bold text-white m-0 mt-0.5">Hero Section Information</h2>
                <p className="text-xs text-zinc-400 m-0 mt-0.5">Basic identity information displayed on the home page hero.</p>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                <span>Display Name <span className="text-rose-400">*</span></span>
                <Input
                  value={settings.displayName}
                  onChange={(event) => set('displayName', event.target.value)}
                  placeholder="e.g. Alex Doe"
                  required
                  className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                <span>Hero Subtitle <span className="text-rose-400">*</span></span>
                <TextArea
                  rows={3}
                  value={settings.heroSubtitle}
                  onChange={(event) => set('heroSubtitle', event.target.value)}
                  placeholder="A short punchy line summarizing your craft…"
                  required
                  className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500 text-sm"
                />
              </label>
            </div>
          </Card>

          {/* About Story & Focus Card */}
          <Card className="border border-zinc-800 bg-[#16161b] p-6 sm:p-7 shadow-xl rounded-2xl">
            <div className="flex flex-col gap-5">
              <div className="border-b border-zinc-800/80 pb-3">
                <span className="admin-eyebrow">Story &amp; Narrative</span>
                <h2 className="text-base font-bold text-white m-0 mt-0.5">About Section Content</h2>
                <p className="text-xs text-zinc-400 m-0 mt-0.5">Narrative paragraphs and active learning focus displayed in the About bento grid.</p>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                <span>Biography Paragraph 1 <span className="text-rose-400">*</span></span>
                <TextArea
                  rows={4}
                  value={settings.bioParagraph1}
                  onChange={(event) => set('bioParagraph1', event.target.value)}
                  placeholder="First paragraph of your bio…"
                  required
                  className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                <span>Biography Paragraph 2 <span className="text-rose-400">*</span></span>
                <TextArea
                  rows={4}
                  value={settings.bioParagraph2}
                  onChange={(event) => set('bioParagraph2', event.target.value)}
                  placeholder="Second paragraph of your bio…"
                  required
                  className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                <span>Current Focus <span className="text-rose-400">*</span></span>
                <TextArea
                  rows={3}
                  value={settings.currentFocus}
                  onChange={(event) => set('currentFocus', event.target.value)}
                  placeholder="What you're currently exploring, building, or learning…"
                  required
                  className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500 text-sm"
                />
              </label>
            </div>
          </Card>
        </div>

        <div className="admin-form-actions flex items-center justify-end gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            isDisabled={isSaving}
            className="admin-button font-bold text-xs cursor-pointer px-6"
          >
            {isSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </section>
  )
}

export default AdminProfilePage
