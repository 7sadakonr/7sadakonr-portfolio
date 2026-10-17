import { FormEvent, useMemo, useState } from 'react'
import { Alert, Button, Input, Switch, TextArea } from '@heroui/react'
import type { ProjectDraft, ProjectRecord } from '../../projects/types'
import { validateProjectUrls } from '../../projects/validation/projectValidation'
import TechTagInput from './TechTagInput'
import ProjectImageField from './ProjectImageField'
import { createUuid } from '../../../utils/createUuid'
import Panel from './ui/Panel'
import FormActionBar from './ui/FormActionBar'
import ConfirmDialog from './ui/ConfirmDialog'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

export interface ProjectFormValues extends ProjectDraft {
  newImage: File | null
  removeCurrentImage: boolean
}

interface ProjectFormProps {
  initialProject: ProjectRecord | null
  sortOrder: number
  suggestions: string[]
  onSave: (values: ProjectFormValues) => Promise<void>
  onCancel: () => void
}

const toValues = (project: ProjectRecord | null, sortOrder: number): ProjectFormValues => ({
  id: project?.id ?? createUuid(),
  title: project?.title ?? '',
  description: project?.description ?? '',
  imageUrl: project?.image_url ?? null,
  imageStoragePath: project?.image_storage_path ?? null,
  liveUrl: project?.live_url ?? '',
  githubUrl: project?.github_url ?? '',
  tech: project?.tech ?? [],
  isInProgress: project?.is_in_progress ?? false,
  isVisible: project?.is_visible ?? true,
  sortOrder: project?.sort_order ?? sortOrder,
  fallbackGradient: project?.fallback_gradient ?? null,
  newImage: null,
  removeCurrentImage: false,
})

type FieldErrors = Partial<Record<'title' | 'description' | 'liveUrl' | 'githubUrl', string>>

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <span id={id} className="adm-field__error" role="alert">{message}</span> : null

const ProjectForm = ({ initialProject, sortOrder, suggestions, onSave, onCancel }: ProjectFormProps) => {
  const [values, setValues] = useState(() => toValues(initialProject, sortOrder))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  useUnsavedChanges(isDirty)
  const uniqueSuggestions = useMemo(() => [...new Set([...suggestions, ...values.tech])].sort(), [suggestions, values.tech])

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setIsDirty(true)
    setValues((current) => ({ ...current, [key]: value }))
    if (key in fieldErrors) setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const urlErrors = validateProjectUrls(values.liveUrl, values.githubUrl)
    const errors: FieldErrors = {
      ...(values.title.trim() ? {} : { title: 'Enter a project title.' }),
      ...(values.description.trim() ? {} : { description: 'Enter a short description.' }),
      ...(urlErrors.liveUrl ? { liveUrl: urlErrors.liveUrl } : {}),
      ...(urlErrors.githubUrl ? { githubUrl: urlErrors.githubUrl } : {}),
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSaveError(null)
    setIsSaving(true)
    try {
      await onSave(values)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save project.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="adm-form-stack" noValidate>
      {saveError && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title className="text-xs font-bold">Couldn&apos;t save the project</Alert.Title>
            <Alert.Description className="text-xs">{saveError}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Panel title="Basics" description="What visitors read first on the project card.">
        <div className="adm-form-stack">
          <label className="adm-field">
            <span>Title <span className="adm-required" aria-hidden="true">*</span></span>
            <Input value={values.title} onChange={(event) => set('title', event.target.value)} placeholder="e.g. Real-time analytics platform" required aria-invalid={Boolean(fieldErrors.title)} aria-describedby="project-title-error" className="w-full" />
            <FieldError id="project-title-error" message={fieldErrors.title} />
          </label>
          <label className="adm-field">
            <span>Description <span className="adm-required" aria-hidden="true">*</span></span>
            <TextArea rows={4} value={values.description} onChange={(event) => set('description', event.target.value)} placeholder="What it does, what you built and what you learned" required aria-invalid={Boolean(fieldErrors.description)} aria-describedby="project-description-error" className="w-full" />
            <FieldError id="project-description-error" message={fieldErrors.description} />
          </label>
          <fieldset className="adm-fieldset">
            <legend>Technologies</legend>
            <TechTagInput value={values.tech} onChange={(tech) => set('tech', tech)} suggestions={uniqueSuggestions} />
          </fieldset>
        </div>
      </Panel>

      <Panel title="Links" description="Optional. Each link gets its own button on the project card.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="adm-field">
            <span>Live demo URL</span>
            <Input type="url" value={values.liveUrl} onChange={(event) => set('liveUrl', event.target.value)} placeholder="https://example.com" aria-invalid={Boolean(fieldErrors.liveUrl)} aria-describedby="project-live-error" className="w-full" />
            <FieldError id="project-live-error" message={fieldErrors.liveUrl} />
          </label>
          <label className="adm-field">
            <span>GitHub repository URL</span>
            <Input type="url" value={values.githubUrl} onChange={(event) => set('githubUrl', event.target.value)} placeholder="https://github.com/…" aria-invalid={Boolean(fieldErrors.githubUrl)} aria-describedby="project-github-error" className="w-full" />
            <FieldError id="project-github-error" message={fieldErrors.githubUrl} />
          </label>
        </div>
      </Panel>

      <Panel title="Cover image" description="Shown on the project card. A gradient is used when there is no image.">
        <ProjectImageField
          currentUrl={values.imageUrl}
          onChange={(newImage, removeCurrentImage) => {
            setIsDirty(true)
            setValues((current) => ({ ...current, newImage, removeCurrentImage }))
          }}
        />
      </Panel>

      <Panel title="Visibility">
        <div className="adm-list">
          <div className="adm-row">
            <div className="adm-row__main">
              <p className="adm-row__title" style={{ marginBottom: 2 }}>Show on portfolio</p>
              <p className="adm-row__meta">Hidden projects stay saved but visitors cannot see them.</p>
            </div>
            <Switch isSelected={values.isVisible} onChange={(checked) => set('isVisible', checked)} size="sm" aria-label="Show on portfolio">
              <Switch.Content className="cursor-pointer"><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
            </Switch>
          </div>
          <div className="adm-row">
            <div className="adm-row__main">
              <p className="adm-row__title" style={{ marginBottom: 2 }}>In development</p>
              <p className="adm-row__meta">Adds an &quot;In progress&quot; badge to the card.</p>
            </div>
            <Switch isSelected={values.isInProgress} onChange={(checked) => set('isInProgress', checked)} size="sm" aria-label="In development">
              <Switch.Content className="cursor-pointer"><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
            </Switch>
          </div>
        </div>
      </Panel>

      <FormActionBar isDirty={isDirty || !initialProject} isSaving={isSaving} saveLabel={initialProject ? 'Save project' : 'Create project'}>
        <Button type="button" variant="outline" isDisabled={isSaving} onClick={() => (isDirty ? setConfirmDiscard(true) : onCancel())}>Cancel</Button>
      </FormActionBar>

      <ConfirmDialog
        isOpen={confirmDiscard}
        tone="default"
        title="Discard your changes?"
        description="The edits you made to this project will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={onCancel}
      />
    </form>
  )
}

export default ProjectForm
