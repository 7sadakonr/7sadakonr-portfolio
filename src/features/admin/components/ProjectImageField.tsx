import { useEffect, useState } from 'react'

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
    <div className="admin-image-field">
      {preview ? <img src={preview} alt="Project preview" /> : (
        <div className="admin-image-placeholder" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="11" width="48" height="42" rx="6" stroke="currentColor" strokeWidth="3" /><circle cx="23" cy="25" r="5" fill="currentColor" /><path d="m13 47 14-14 9 8 7-7 8 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Project cover preview</span>
          <b>16:9</b>
        </div>
      )}
      <input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
      {currentUrl && !file && <button type="button" className="admin-text-button" onClick={() => { setPreview(null); onChange(null, true) }}>Remove current image</button>}
      <small>JPG, PNG, or WebP. Maximum 5 MB. Recommended: 1600 × 900 px (16:9).</small>
    </div>
  )
}

export default ProjectImageField
