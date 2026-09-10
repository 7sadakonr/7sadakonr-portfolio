import { useEffect, useState, type FormEvent } from 'react'
import { loadSiteSettings, saveContactSettings } from '../../siteSettings/api/siteSettingsRepository'
import { CONTACT_TYPES, type ContactDraftInput, type ContactLink, type ContactType, type SiteSettings } from '../../siteSettings/types'
import { normalizeContactDraft } from '../../siteSettings/validation/contactLinks'

const labels: Record<ContactType, string> = { email: 'Email', phone: 'Phone', github: 'GitHub', linkedin: 'LinkedIn', website: 'Website', facebook: 'Facebook', instagram: 'Instagram', x: 'X', line: 'LINE', other: 'Other' }
const emptyContact = (): ContactDraftInput => ({ type: 'email', label: 'Email', value: '', isVisible: true })

const AdminContactPage = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState<ContactDraftInput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => { void loadSiteSettings().then(setSettings, (reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Contact settings.')) }, [])
  if (!settings) return <section className="admin-page"><p className={error ? 'admin-form-error' : 'admin-empty'}>{error ?? 'Loading Contact…'}</p></section>

  const setSettingsField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => { setIsDirty(true); setSettings((current) => current ? { ...current, [key]: value } : current) }
  const updateLinks = (links: ContactLink[]) => setSettingsField('contactLinks', links)
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= settings.contactLinks.length) return
    const links = [...settings.contactLinks]
    const item = links[index]
    const neighbor = links[target]
    if (!item || !neighbor) return
    links[index] = neighbor; links[target] = item; updateLinks(links)
  }
  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contactDraft) return
    try {
      const normalized = normalizeContactDraft({ ...contactDraft, id: editingId ?? undefined })
      updateLinks(editingId ? settings.contactLinks.map((link) => link.id === editingId ? normalized : link) : [...settings.contactLinks, normalized])
      setContactDraft(null); setEditingId(null); setError(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to add contact.') }
  }
  const persist = async () => {
    setIsSaving(true); setError(null)
    try { setSettings(await saveContactSettings(settings)); setIsDirty(false) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save Contact settings.') } finally { setIsSaving(false) }
  }

  return <section className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">Contact</p><h1>Manage contact links</h1></div><button className="admin-button" type="button" disabled={isSaving} onClick={() => void persist()}>Save Changes</button></div>
    <div className="admin-settings-form"><label>Contact Heading<input value={settings.contactHeading} onChange={(event) => setSettingsField('contactHeading', event.target.value)} required /></label><label>Contact Description<textarea rows={3} value={settings.contactDescription} onChange={(event) => setSettingsField('contactDescription', event.target.value)} required /></label></div>
    {error && <p className="admin-form-error" role="alert">{error}</p>}{isDirty && <p className="admin-form-warning" role="status">Unsaved changes</p>}
    <div className="admin-contact-list">{settings.contactLinks.map((contact, index) => <article className="admin-contact-row" key={contact.id}><div><h2>{contact.label}</h2><p>{contact.value}</p><span>{contact.isVisible ? 'Visible' : 'Hidden'}</span></div><div className="admin-row-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === settings.contactLinks.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" onClick={() => { setEditingId(contact.id); setContactDraft(contact) }}>Edit</button><button type="button" onClick={() => updateLinks(settings.contactLinks.map((item) => item.id === contact.id ? { ...item, isVisible: !item.isVisible } : item))}>{contact.isVisible ? 'Hide' : 'Show'}</button><button className="admin-delete" type="button" onClick={() => updateLinks(settings.contactLinks.filter((item) => item.id !== contact.id))}>Delete</button></div></article>)}</div>
    {!contactDraft ? <button className="admin-button admin-add-contact" type="button" onClick={() => { setEditingId(null); setContactDraft(emptyContact()) }}>+ Add Contact</button> : <form className="admin-settings-form admin-contact-editor" onSubmit={saveContact}><label>Type<select value={contactDraft.type} onChange={(event) => { const type = event.target.value as ContactType; setContactDraft({ ...contactDraft, type, label: labels[type] }) }}>{CONTACT_TYPES.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label><label>Label<input value={contactDraft.label} onChange={(event) => setContactDraft({ ...contactDraft, label: event.target.value })} required /></label><label>Value / URL<input value={contactDraft.value} onChange={(event) => setContactDraft({ ...contactDraft, value: event.target.value })} required /></label><div className="admin-form-actions"><button className="admin-button" type="submit">{editingId ? 'Save Contact' : 'Add Contact'}</button><button className="admin-button admin-button--quiet" type="button" onClick={() => { setContactDraft(null); setEditingId(null); setError(null) }}>Cancel</button></div></form>}
  </section>
}

export default AdminContactPage
