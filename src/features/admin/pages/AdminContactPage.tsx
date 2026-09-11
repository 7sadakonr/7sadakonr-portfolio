import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Chip, Input, Modal, Switch, TextArea } from '@heroui/react'
import { loadSiteSettings, saveContactSettings } from '../../siteSettings/api/siteSettingsRepository'
import { CONTACT_TYPES, type ContactDraftInput, type ContactLink, type ContactType, type SiteSettings } from '../../siteSettings/types'
import { normalizeContactDraft } from '../../siteSettings/validation/contactLinks'

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
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contactDraft, setContactDraft] = useState<ContactDraftInput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    void loadSiteSettings().then(
      setSettings,
      (reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load Contact settings.')
    )
  }, [])

  if (!settings) {
    return (
      <section className="admin-page max-w-3xl">
        <div className="admin-page-heading mb-6">
          <span className="admin-eyebrow">Contact</span>
          <h1 className="text-2xl font-bold text-white">{error ? 'Error' : 'Loading Contact…'}</h1>
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
            <div className="h-6 w-40 bg-zinc-800 animate-pulse rounded-lg" />
            <div className="h-10 w-full bg-zinc-800/60 animate-pulse rounded-lg" />
            <div className="h-24 w-full bg-zinc-800/40 animate-pulse rounded-lg" />
          </div>
        )}
      </section>
    )
  }

  const setSettingsField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setIsDirty(true)
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  const updateLinks = (links: ContactLink[]) => setSettingsField('contactLinks', links)

  const toggleLinkVisibility = (id: string) => {
    updateLinks(
      settings.contactLinks.map((item) =>
        item.id === id ? { ...item, isVisible: !item.isVisible } : item
      )
    )
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

  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contactDraft) return
    try {
      const normalized = normalizeContactDraft({ ...contactDraft, id: editingId ?? undefined })
      updateLinks(
        editingId
          ? settings.contactLinks.map((link) => (link.id === editingId ? normalized : link))
          : [...settings.contactLinks, normalized]
      )
      setContactDraft(null)
      setEditingId(null)
      setModalError(null)
    } catch (reason) {
      setModalError(reason instanceof Error ? reason.message : 'Unable to save contact.')
    }
  }

  const persist = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const saved = await saveContactSettings(settings)
      setSettings(saved)
      setIsDirty(false)
      setSuccessMessage('Contact settings saved successfully.')
      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save Contact settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="admin-page max-w-3xl">
      <div className="admin-page-heading flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="admin-eyebrow">Contact &amp; Social</span>
            {isDirty && (
              <Chip size="sm" variant="soft" color="warning" className="text-[11px] font-bold">
                Unsaved Changes
              </Chip>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">Contact Channels</h1>
        </div>
        <Button
          type="button"
          variant="primary"
          isDisabled={isSaving}
          className="admin-button font-bold text-xs cursor-pointer px-5"
          onClick={() => void persist()}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
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
              <Alert.Title className="text-xs font-bold">Saved</Alert.Title>
              <Alert.Description className="text-xs">{successMessage}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {/* Section Header Settings */}
      <Card className="border border-zinc-800 bg-[#16161b] p-6 sm:p-7 shadow-xl rounded-2xl mb-8">
        <div className="flex flex-col gap-4">
          <div className="border-b border-zinc-800/80 pb-3">
            <span className="admin-eyebrow">Section Overview</span>
            <h2 className="text-base font-bold text-white m-0 mt-0.5">Contact Section Header</h2>
            <p className="text-xs text-zinc-400 m-0 mt-0.5">Title and invitation copy displayed above contact methods on the home page.</p>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
            <span>Contact Heading <span className="text-rose-400">*</span></span>
            <Input
              value={settings.contactHeading}
              onChange={(event) => setSettingsField('contactHeading', event.target.value)}
              placeholder="e.g. Let's Build Something Together"
              required
              className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
            <span>Contact Description <span className="text-rose-400">*</span></span>
            <TextArea
              rows={3}
              value={settings.contactDescription}
              onChange={(event) => setSettingsField('contactDescription', event.target.value)}
              placeholder="Brief invitation or instructions for getting in touch…"
              required
              className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500 text-sm"
            />
          </label>
        </div>
      </Card>

      {/* Active Contact Links List Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-white m-0">Active Channels &amp; Links</h2>
          <p className="text-xs text-zinc-400 m-0">Manage communication links, social handles, and their public visibility.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="admin-button text-xs font-bold cursor-pointer px-4 shadow-sm"
          onClick={() => {
            setEditingId(null)
            setContactDraft(emptyContact())
            setModalError(null)
          }}
        >
          + Add Channel
        </Button>
      </div>

      <div className="admin-contact-list flex flex-col gap-3 mb-6">
        {settings.contactLinks.map((contact, index) => (
          <article
            className="border border-zinc-800 bg-[#16161b] hover:border-zinc-700/80 transition-all rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            key={contact.id}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="text-sm font-bold text-white m-0">{contact.label}</h2>
                <Chip
                  size="sm"
                  variant="soft"
                  color={contact.isVisible ? 'success' : 'default'}
                  className="text-[10px] font-semibold uppercase"
                >
                  {contact.isVisible ? 'Visible' : 'Hidden'}
                </Chip>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {contact.type}
                </span>
              </div>
              <p className="text-xs text-zinc-400 m-0 truncate font-mono">{contact.value}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end w-full sm:w-auto">
              {/* HeroUI Switch for instant Live/Hidden toggle */}
              <div className="flex items-center gap-2 mr-1">
                <Switch
                  isSelected={contact.isVisible}
                  onChange={() => toggleLinkVisibility(contact.id)}
                  size="sm"
                  aria-label={`Toggle visibility for ${contact.label}`}
                >
                  <Switch.Content className="cursor-pointer">
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>

              {/* Reorder Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  isIconOnly
                  variant="outline"
                  className="w-8 h-8 text-xs cursor-pointer border-zinc-700 hover:bg-zinc-800"
                  isDisabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move channel up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isIconOnly
                  variant="outline"
                  className="w-8 h-8 text-xs cursor-pointer border-zinc-700 hover:bg-zinc-800"
                  isDisabled={index === settings.contactLinks.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move channel down"
                >
                  ↓
                </Button>
              </div>

              {/* Edit Button */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs font-semibold cursor-pointer px-3 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                onClick={() => {
                  setEditingId(contact.id)
                  setContactDraft(contact)
                  setModalError(null)
                }}
              >
                Edit
              </Button>

              {/* Delete Button */}
              <Button
                type="button"
                size="sm"
                variant="danger-soft"
                className="text-xs font-semibold cursor-pointer px-3 hover:bg-red-950/40 text-red-400 border border-red-900/40"
                onClick={() => updateLinks(settings.contactLinks.filter((item) => item.id !== contact.id))}
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* HeroUI Modal for Add / Edit Contact Channel */}
      {contactDraft && (
        <Modal.Root isOpen={contactDraft !== null} onOpenChange={(open) => !open && setContactDraft(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" />
          <Modal.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Modal.Dialog className="border border-zinc-800 bg-[#16161c] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <form onSubmit={saveContact} className="flex flex-col gap-5">
                <Modal.Header>
                  <span className="admin-eyebrow">{editingId ? 'Edit Channel' : 'New Channel'}</span>
                  <h3 className="text-lg font-bold text-white m-0 mt-0.5">
                    {editingId ? 'Edit Contact Link' : 'Add Contact Link'}
                  </h3>
                </Modal.Header>

                {modalError && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title className="text-xs font-bold">Error</Alert.Title>
                      <Alert.Description className="text-xs">{modalError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                <Modal.Body className="flex flex-col gap-4 p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                      <span>Channel Type</span>
                      <select
                        value={contactDraft.type}
                        onChange={(event) => {
                          const type = event.target.value as ContactType
                          setContactDraft({ ...contactDraft, type, label: labels[type] })
                        }}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 p-2.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all"
                      >
                        {CONTACT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {labels[type]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                      <span>Label <span className="text-rose-400">*</span></span>
                      <Input
                        value={contactDraft.label}
                        onChange={(event) => setContactDraft({ ...contactDraft, label: event.target.value })}
                        placeholder="e.g. GitHub"
                        required
                        className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
                    <span>Value / URL <span className="text-rose-400">*</span></span>
                    <Input
                      value={contactDraft.value}
                      onChange={(event) => setContactDraft({ ...contactDraft, value: event.target.value })}
                      placeholder="e.g. https://github.com/myhandle or me@example.com"
                      required
                      className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-200">Visible on Site</span>
                    <Switch
                      isSelected={contactDraft.isVisible}
                      onChange={(checked) => setContactDraft({ ...contactDraft, isVisible: checked })}
                      size="sm"
                      aria-label="Channel visibility"
                    >
                      <Switch.Content className="cursor-pointer">
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs font-semibold cursor-pointer px-4 border-zinc-700"
                    onClick={() => {
                      setContactDraft(null)
                      setEditingId(null)
                      setModalError(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="admin-button text-xs font-bold cursor-pointer px-5"
                  >
                    {editingId ? 'Save Channel' : 'Add Channel'}
                  </Button>
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
