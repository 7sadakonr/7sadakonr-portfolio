import { useEffect, useState, type FormEvent } from 'react'
import { loadSiteSettings, saveProfileSettings } from '../../siteSettings/api/siteSettingsRepository'
import type { SiteSettings } from '../../siteSettings/types'

const AdminProfilePage = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { void loadSiteSettings().then(setSettings, (reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Profile settings.')) }, [])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settings) return
    setError(null)
    setIsSaving(true)
    try { setSettings(await saveProfileSettings(settings)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save Profile settings.') } finally { setIsSaving(false) }
  }

  if (!settings) return <section className="admin-page"><p className={error ? 'admin-form-error' : 'admin-empty'}>{error ?? 'Loading Profile…'}</p></section>
  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setSettings((current) => current ? { ...current, [key]: value } : current)
  return <section className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">Profile</p><h1>Edit About content</h1></div></div><form className="admin-settings-form" onSubmit={(event) => void save(event)}>
    <label>Display Name<input value={settings.displayName} onChange={(event) => set('displayName', event.target.value)} required /></label>
    <label>Hero Subtitle<textarea rows={4} value={settings.heroSubtitle} onChange={(event) => set('heroSubtitle', event.target.value)} required /></label>
    <label>Biography Paragraph 1<textarea rows={5} value={settings.bioParagraph1} onChange={(event) => set('bioParagraph1', event.target.value)} required /></label>
    <label>Biography Paragraph 2<textarea rows={5} value={settings.bioParagraph2} onChange={(event) => set('bioParagraph2', event.target.value)} required /></label>
    <label>Current Focus<textarea rows={4} value={settings.currentFocus} onChange={(event) => set('currentFocus', event.target.value)} required /></label>
    {error && <p className="admin-form-error" role="alert">{error}</p>}<div className="admin-form-actions"><button className="admin-button" disabled={isSaving} type="submit">{isSaving ? 'Saving…' : 'Save Profile'}</button></div>
  </form></section>
}

export default AdminProfilePage

