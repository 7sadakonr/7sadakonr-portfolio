import { KeyboardEvent, useState } from 'react'

interface TechTagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  suggestions: string[]
}

const normalize = (value: string) => value.trim()

const TechTagInput = ({ value, onChange, suggestions }: TechTagInputProps) => {
  const [pending, setPending] = useState('')
  const add = (candidate: string) => {
    const tag = normalize(candidate)
    if (!tag || value.some((item) => item.localeCompare(tag, undefined, { sensitivity: 'accent' }) === 0)) return
    onChange([...value, tag])
    setPending('')
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(pending)
    }
    if (event.key === 'Backspace' && !pending && value.length > 0) onChange(value.slice(0, -1))
  }

  return (
    <div className="admin-tags">
      <div className="admin-tag-list">
        {value.map((tag) => <button type="button" className="admin-tag" key={tag} onClick={() => onChange(value.filter((item) => item !== tag))}>{tag} ×</button>)}
      </div>
      <input
        list="tech-suggestions"
        value={pending}
        onChange={(event) => setPending(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(pending)}
        placeholder="Add a technology"
      />
      <datalist id="tech-suggestions">{suggestions.map((item) => <option key={item} value={item} />)}</datalist>
    </div>
  )
}

export default TechTagInput
