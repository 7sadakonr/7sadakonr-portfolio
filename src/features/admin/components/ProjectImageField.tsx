import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'

interface ProjectImageFieldProps {
  currentUrl: string | null
  onChange: (file: File | null, removeCurrent: boolean) => void
}

const ProjectImageField = ({ currentUrl, onChange }: ProjectImageFieldProps) => {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  const handleFile = (nextFile: File | null) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setFile(nextFile)
    const nextPreview = nextFile ? URL.createObjectURL(nextFile) : currentUrl
    setPreview(nextPreview)
    onChange(nextFile, false)
  }

  return (
    <div className="admin-image-field flex flex-col gap-3">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-900 aspect-video max-w-[420px]">
          <img src={preview} alt="Project preview" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="admin-image-placeholder rounded-xl aspect-video max-w-[420px] flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-700 bg-zinc-900/60 p-6 text-zinc-400">
          <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 text-zinc-500" aria-hidden="true">
            <rect x="8" y="11" width="48" height="42" rx="6" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="23" cy="25" r="5" fill="currentColor" />
            <path d="m13 47 14-14 9 8 7-7 8 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium text-zinc-300">Project cover preview</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">16:9</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          id="project-image-input"
          accept="image/jpeg,image/png,image/webp"
          type="file"
          className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-zinc-700 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        {currentUrl && !file && (
          <Button
            type="button"
            size="sm"
            variant="danger-soft"
            className="admin-text-button text-xs cursor-pointer"
            onClick={() => {
              setPreview(null)
              onChange(null, true)
            }}
          >
            Remove current image
          </Button>
        )}
      </div>

      <small className="text-xs text-zinc-400">
        JPG, PNG, or WebP. Maximum 5 MB. Recommended: 1600 × 900 px (16:9).
      </small>
    </div>
  )
}

export default ProjectImageField

