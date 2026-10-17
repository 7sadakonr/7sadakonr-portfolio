import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Input, TextArea } from '@heroui/react'
import { loadSiteSettings, saveProfileSettings } from '../../siteSettings/api/siteSettingsRepository'
import type { SiteSettings } from '../../siteSettings/types'
import PageHeader from '../components/ui/PageHeader'
import PageLoadState from '../components/ui/PageLoadState'
import Panel from '../components/ui/Panel'
import FormActionBar from '../components/ui/FormActionBar'
import { useToast } from '../components/ui/toastContext'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

const AdminProfilePage = () => {
  const toast = useToast()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedChanges(isDirty)

  const load = useCallback(() => {
    setLoadError(null)
    void loadSiteSettings().then(
      setSettings,
      (reason: unknown) => setLoadError(reason instanceof Error ? reason.message : 'Unable to load Profile settings.'),
    )
  }, [])
  useEffect(load, [load])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settings) return
    setIsSaving(true)
    try {
      setSettings(await saveProfileSettings(settings))
      setIsDirty(false)
      toast.success('Profile saved', 'Your changes will appear after the next publish.')
    } catch (reason) {
      toast.error("Couldn't save profile", reason instanceof Error ? reason.message : 'Unable to save Profile settings.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!settings) return <PageLoadState eyebrow="Profile" title="Profile & bio" error={loadError} onRetry={load} />

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setIsDirty(true)
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  return (
    <section className="admin-page adm-narrow">
      <PageHeader eyebrow="Profile" title="Profile & bio" description="The name, tagline and story shown on your home and About pages." />

      <form onSubmit={(event) => void save(event)} className="adm-form-stack">
        <Panel title="Hero" description="Shown at the top of the home page.">
          <div className="adm-form-stack">
            <label className="adm-field">
              <span>Display name <span className="adm-required" aria-hidden="true">*</span></span>
              <Input value={settings.displayName} onChange={(event) => set('displayName', event.target.value)} placeholder="e.g. Alex Doe" required className="w-full" />
            </label>
            <label className="adm-field">
              <span>Hero subtitle <span className="adm-required" aria-hidden="true">*</span></span>
              <TextArea rows={3} value={settings.heroSubtitle} onChange={(event) => set('heroSubtitle', event.target.value)} placeholder="One line that sums up what you do" required className="w-full" />
            </label>
          </div>
        </Panel>

        <Panel title="About" description="The story and current focus shown on the About page.">
          <div className="adm-form-stack">
            <label className="adm-field">
              <span>Biography, paragraph 1 <span className="adm-required" aria-hidden="true">*</span></span>
              <TextArea rows={4} value={settings.bioParagraph1} onChange={(event) => set('bioParagraph1', event.target.value)} required className="w-full" />
            </label>
            <label className="adm-field">
              <span>Biography, paragraph 2 <span className="adm-required" aria-hidden="true">*</span></span>
              <TextArea rows={4} value={settings.bioParagraph2} onChange={(event) => set('bioParagraph2', event.target.value)} required className="w-full" />
            </label>
            <label className="adm-field">
              <span>Current focus <span className="adm-required" aria-hidden="true">*</span></span>
              <TextArea rows={3} value={settings.currentFocus} onChange={(event) => set('currentFocus', event.target.value)} placeholder="What you are building or learning right now" required className="w-full" />
            </label>
          </div>
        </Panel>

        <FormActionBar isDirty={isDirty} isSaving={isSaving} saveLabel="Save profile" />
      </form>
    </section>
  )
}

export default AdminProfilePage
