import { FormEvent, useMemo, useState } from 'react'
import { Alert, Button, Card, Input, Switch, TextArea } from '@heroui/react'
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
    try {
      await onSave(values)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save project.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border border-zinc-800 bg-[#16161b] p-0 shadow-2xl max-w-3xl rounded-2xl">
      <form onSubmit={(event) => void handleSubmit(event)} className="p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 border-b border-zinc-800/80 pb-4">
          <span className="admin-eyebrow">Project Configuration</span>
          <h2 className="text-xl font-bold text-white m-0">Project Details</h2>
          <p className="text-xs text-zinc-400 m-0">
            Define metadata, media, repository &amp; demo URLs, and technologies for this showcase item.
          </p>
        </div>

        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="text-xs font-bold">Validation Error</Alert.Title>
              <Alert.Description className="text-xs">{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
            <span>Project Title <span className="text-rose-400">*</span></span>
            <Input
              value={values.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="e.g. Real-Time Analytics Platform"
              required
              className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
            <span>Description <span className="text-rose-400">*</span></span>
            <TextArea
              rows={4}
              value={values.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="A concise overview of the project, features, challenges, and outcomes…"
              required
              className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500 text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
            <span>Live Demo URL</span>
            <Input
              type="url"
              value={values.liveUrl}
              onChange={(event) => set('liveUrl', event.target.value)}
              placeholder="https://example.com"
              className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
            <span>GitHub Repository URL</span>
            <Input
              type="url"
              value={values.githubUrl}
              onChange={(event) => set('githubUrl', event.target.value)}
              placeholder="https://github.com/..."
              className="w-full border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
            />
          </label>
        </div>

        <fieldset className="border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-2 bg-[#121216]">
          <legend className="text-xs font-bold text-zinc-300 px-2 uppercase tracking-wider">Technologies &amp; Tags</legend>
          <TechTagInput value={values.tech} onChange={(tech) => set('tech', tech)} suggestions={uniqueSuggestions} />
        </fieldset>

        <fieldset className="border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-2 bg-[#121216]">
          <legend className="text-xs font-bold text-zinc-300 px-2 uppercase tracking-wider">Cover Media</legend>
          <ProjectImageField
            currentUrl={values.imageUrl}
            onChange={(newImage, removeCurrentImage) => setValues((current) => ({ ...current, newImage, removeCurrentImage }))}
          />
        </fieldset>

        {/* HeroUI Switches for Status & Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-zinc-800/80 bg-[#121216]">
          <div className="flex items-center justify-between gap-3 p-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-200">Show on Portfolio</span>
              <span className="text-[11px] text-zinc-400">Make this project public and visible to visitors</span>
            </div>
            <Switch
              isSelected={values.isVisible}
              onChange={(checked) => set('isVisible', checked)}
              size="sm"
              aria-label="Show on Portfolio"
            >
              <Switch.Content className="cursor-pointer">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>

          <div className="flex items-center justify-between gap-3 p-2 border-t sm:border-t-0 sm:border-l border-zinc-800/80 pt-3 sm:pt-0 sm:pl-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-200">In Development</span>
              <span className="text-[11px] text-zinc-400">Display "In Progress" badge on the card</span>
            </div>
            <Switch
              isSelected={values.isInProgress}
              onChange={(checked) => set('isInProgress', checked)}
              size="sm"
              aria-label="Currently in development"
            >
              <Switch.Content className="cursor-pointer">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>
        </div>

        <div className="admin-form-actions flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="text-xs font-semibold cursor-pointer px-4 border-zinc-700 hover:bg-zinc-800"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={isSaving}
            className="admin-button text-xs font-bold cursor-pointer px-6"
          >
            {isSaving ? 'Saving…' : 'Save Project'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default ProjectForm
