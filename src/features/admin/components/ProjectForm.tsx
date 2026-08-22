import { FormEvent, useMemo, useState } from 'react'
import type { ProjectDraft, ProjectRecord } from '../../projects/types'
import { validateProjectUrls } from '../../projects/validation/projectValidation'
import TechTagInput from './TechTagInput'
import ProjectImageField from './ProjectImageField'
import { createUuid } from '../../../utils/createUuid'

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

const ProjectForm = ({ initialProject, sortOrder, suggestions, onSave, onCancel }: ProjectFormProps) => {
  const [values, setValues] = useState(() => toValues(initialProject, sortOrder))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const uniqueSuggestions = useMemo(() => [...new Set([...suggestions, ...values.tech])].sort(), [suggestions, values.tech])

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => setValues((current) => ({ ...current, [key]: value }))
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const urlErrors = validateProjectUrls(values.liveUrl, values.githubUrl)
    if (!values.title.trim() || !values.description.trim()) {
      setError('Title and description are required.')
      return
    }
    if (urlErrors.liveUrl || urlErrors.githubUrl) {
      setError(urlErrors.liveUrl ?? urlErrors.githubUrl ?? null)
      return
    }
    setError(null)
    setIsSaving(true)
    try { await onSave(values) } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save project.') } finally { setIsSaving(false) }
  }

  return (
    <form className="admin-project-form" onSubmit={(event) => void handleSubmit(event)}>
      <label>Title<input value={values.title} onChange={(event) => set('title', event.target.value)} required /></label>
      <label>Description<textarea rows={6} value={values.description} onChange={(event) => set('description', event.target.value)} required /></label>
      <label>Live demo URL<input type="url" value={values.liveUrl} onChange={(event) => set('liveUrl', event.target.value)} /></label>
      <label>GitHub URL<input type="url" value={values.githubUrl} onChange={(event) => set('githubUrl', event.target.value)} /></label>
      <fieldset><legend>Tech stack</legend><TechTagInput value={values.tech} onChange={(tech) => set('tech', tech)} suggestions={uniqueSuggestions} /></fieldset>
      <fieldset><legend>Image</legend><ProjectImageField currentUrl={values.imageUrl} onChange={(newImage, removeCurrentImage) => setValues((current) => ({ ...current, newImage, removeCurrentImage }))} /></fieldset>
      <label className="admin-check"><input type="checkbox" checked={values.isInProgress} onChange={(event) => set('isInProgress', event.target.checked)} />Currently in development</label>
      <label className="admin-check"><input type="checkbox" checked={values.isVisible} onChange={(event) => set('isVisible', event.target.checked)} />Show on Portfolio</label>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="admin-form-actions"><button className="admin-button" disabled={isSaving} type="submit">{isSaving ? 'Saving…' : 'Save project'}</button><button className="admin-button admin-button--quiet" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

export default ProjectForm
