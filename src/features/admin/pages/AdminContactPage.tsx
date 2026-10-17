import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Input, Modal, Switch, TextArea } from '@heroui/react'
import { loadSiteSettings, saveContactSettings } from '../../siteSettings/api/siteSettingsRepository'
import { CONTACT_TYPES, type ContactDraftInput, type ContactLink, type ContactType, type SiteSettings } from '../../siteSettings/types'
import { normalizeContactDraft } from '../../siteSettings/validation/contactLinks'
import PageHeader from '../components/ui/PageHeader'
import PageLoadState from '../components/ui/PageLoadState'
import Panel from '../components/ui/Panel'
import FormActionBar from '../components/ui/FormActionBar'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/toastContext'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

const labels: Record<ContactType, string> = {
  email: 'Email',
  phone: 'Phone',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  website: 'Website',
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X (Twitter)',
  line: 'LINE',
  other: 'Other',
}

const emptyContact = (): ContactDraftInput => ({ type: 'email', label: 'Email', value: '', isVisible: true })

const AdminContactPage = () => {
  const toast = useToast()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState<ContactDraftInput | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [linkToDelete, setLinkToDelete] = useState<ContactLink | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  useUnsavedChanges(isDirty)

  const load = useCallback(() => {
    setLoadError(null)
    void loadSiteSettings().then(
      setSettings,
      (reason: unknown) => setLoadError(reason instanceof Error ? reason.message : 'Unable to load Contact settings.'),
    )
  }, [])
  useEffect(load, [load])

  if (!settings) return <PageLoadState eyebrow="Contact" title="Contact channels" error={loadError} onRetry={load} />

  const setSettingsField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setIsDirty(true)
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  const updateLinks = (links: ContactLink[]) => setSettingsField('contactLinks', links)

  const toggleLinkVisibility = (id: string) => {
    updateLinks(settings.contactLinks.map((item) => (item.id === id ? { ...item, isVisible: !item.isVisible } : item)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= settings.contactLinks.length) return
    const links = [...settings.contactLinks]
    const item = links[index]
    const neighbor = links[target]
    if (!item || !neighbor) return
    links[index] = neighbor
    links[target] = item
    updateLinks(links)
  }

  const closeModal = () => {
    setContactDraft(null)
    setEditingId(null)
    setModalError(null)
  }

  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contactDraft) return
    try {
      const normalized = normalizeContactDraft({ ...contactDraft, id: editingId ?? undefined })
      updateLinks(
        editingId
          ? settings.contactLinks.map((link) => (link.id === editingId ? normalized : link))
          : [...settings.contactLinks, normalized],
      )
      closeModal()
    } catch (reason) {
      setModalError(reason instanceof Error ? reason.message : 'Unable to save contact.')
    }
  }

  const persist = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setIsSaving(true)
    try {
      setSettings(await saveContactSettings(settings))
      setIsDirty(false)
      toast.success('Contact settings saved', 'Your changes will appear after the next publish.')
    } catch (reason) {
      toast.error("Couldn't save contact settings", reason instanceof Error ? reason.message : 'Unable to save Contact settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const openNew = () => {
    setEditingId(null)
    setContactDraft(emptyContact())
    setModalError(null)
  }

  return (
    <section className="admin-page adm-narrow">
      <PageHeader eyebrow="Contact" title="Contact channels" description="How visitors can reach you. Hidden channels stay saved but are not shown on the site." />

      <form onSubmit={(event) => void persist(event)} className="adm-form-stack">
        <Panel title="Section header" description="Heading and invitation shown above your contact methods.">
          <div className="adm-form-stack">
            <label className="adm-field">
              <span>Heading <span className="adm-required" aria-hidden="true">*</span></span>
              <Input value={settings.contactHeading} onChange={(event) => setSettingsField('contactHeading', event.target.value)} placeholder="e.g. Let's build something together" required className="w-full" />
            </label>
            <label className="adm-field">
              <span>Description <span className="adm-required" aria-hidden="true">*</span></span>
              <TextArea rows={3} value={settings.contactDescription} onChange={(event) => setSettingsField('contactDescription', event.target.value)} placeholder="A short invitation to get in touch" required className="w-full" />
            </label>
          </div>
        </Panel>

        <Panel
          title="Channels"
          description="Order here is the order on the site."
          actions={<Button type="button" size="sm" variant="primary" className="admin-button" onClick={openNew}>Add channel</Button>}
          empty={settings.contactLinks.length === 0 ? { title: 'No channels yet', description: 'Add an email, social profile or website so people can contact you.' } : null}
        >
          <div className="adm-list">
            {settings.contactLinks.map((contact, index) => (
              <article className="adm-row" key={contact.id}>
                <div className="adm-row__main">
                  <h3 className="adm-row__title">
                    {contact.label}
                    <span className={`adm-badge${contact.isVisible ? ' adm-badge--success' : ''}`}>{contact.isVisible ? 'Visible' : 'Hidden'}</span>
                    <span className="adm-badge">{labels[contact.type]}</span>
                  </h3>
                  <p className="adm-row__meta" title={contact.value}>{contact.value}</p>
                </div>
                <div className="adm-row__actions">
                  <Switch isSelected={contact.isVisible} onChange={() => toggleLinkVisibility(contact.id)} size="sm" aria-label={`Show ${contact.label} on the site`}>
                    <Switch.Content className="cursor-pointer"><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
                  </Switch>
                  <Button type="button" size="sm" isIconOnly variant="outline" isDisabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${contact.label} up`}>
                    <span aria-hidden="true">↑</span>
                  </Button>
                  <Button type="button" size="sm" isIconOnly variant="outline" isDisabled={index === settings.contactLinks.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${contact.label} down`}>
                    <span aria-hidden="true">↓</span>
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setEditingId(contact.id); setContactDraft(contact); setModalError(null) }}>Edit</Button>
                  <Button type="button" size="sm" variant="danger-soft" onClick={() => setLinkToDelete(contact)}>Delete</Button>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <FormActionBar isDirty={isDirty} isSaving={isSaving} saveLabel="Save changes" />
      </form>

      <ConfirmDialog
        isOpen={linkToDelete !== null}
        title="Delete this channel?"
        description={<>Remove <strong>{linkToDelete?.label}</strong> from your contact channels? This only takes effect once you save.</>}
        confirmLabel="Delete channel"
        onCancel={() => setLinkToDelete(null)}
        onConfirm={() => {
          if (linkToDelete) updateLinks(settings.contactLinks.filter((item) => item.id !== linkToDelete.id))
          setLinkToDelete(null)
        }}
      />

      {contactDraft && (
        <Modal.Root isOpen onOpenChange={(open) => !open && closeModal()}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" />
          <Modal.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Modal.Dialog className="adm-dialog dark" data-theme="dark" style={{ maxWidth: 520 }}>
              <form onSubmit={saveContact} className="adm-form-stack">
                <Modal.Header>
                  <span className="admin-eyebrow">{editingId ? 'Edit channel' : 'New channel'}</span>
                  <h3 className="adm-dialog__title" style={{ marginTop: 2 }}>{editingId ? 'Edit contact channel' : 'Add contact channel'}</h3>
                </Modal.Header>

                {modalError && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title className="text-xs font-bold">Check the details</Alert.Title>
                      <Alert.Description className="text-xs">{modalError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                <Modal.Body className="adm-form-stack p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="adm-field">
                      <span>Type</span>
                      <select
                        value={contactDraft.type}
                        onChange={(event) => {
                          const type = event.target.value as ContactType
                          setContactDraft({ ...contactDraft, type, label: labels[type] })
                        }}
                        className="adm-select"
                      >
                        {CONTACT_TYPES.map((type) => <option key={type} value={type}>{labels[type]}</option>)}
                      </select>
                    </label>
                    <label className="adm-field">
                      <span>Label <span className="adm-required" aria-hidden="true">*</span></span>
                      <Input value={contactDraft.label} onChange={(event) => setContactDraft({ ...contactDraft, label: event.target.value })} placeholder="e.g. GitHub" required className="w-full" />
                    </label>
                  </div>

                  <label className="adm-field">
                    <span>Value or URL <span className="adm-required" aria-hidden="true">*</span></span>
                    <Input value={contactDraft.value} onChange={(event) => setContactDraft({ ...contactDraft, value: event.target.value })} placeholder="https://github.com/handle or me@example.com" required className="w-full" />
                  </label>

                  <div className="adm-row" style={{ padding: '10px 14px' }}>
                    <span className="adm-field" style={{ flexDirection: 'row' }}>Show on the site</span>
                    <Switch isSelected={contactDraft.isVisible} onChange={(checked) => setContactDraft({ ...contactDraft, isVisible: checked })} size="sm" aria-label="Show this channel on the site">
                      <Switch.Content className="cursor-pointer"><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
                    </Switch>
                  </div>
                </Modal.Body>

                <Modal.Footer className="adm-dialog__footer">
                  <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button type="submit" variant="primary" className="admin-button">{editingId ? 'Save channel' : 'Add channel'}</Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Root>
      )}
    </section>
  )
}

export default AdminContactPage
