import { KeyboardEvent, useState } from 'react'
import { Chip, Input } from '@heroui/react'

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
    if (event.key === 'Backspace' && !pending && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {value.map((tag) => (
            <button
              type="button"
              key={tag}
              className="p-0 border-0 bg-transparent cursor-pointer"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              title={`Remove ${tag}`}
            >
              <Chip
                size="sm"
                variant="soft"
                color="default"
                className="text-xs text-zinc-200 border border-zinc-700/60 hover:border-red-500/60 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
              >
                <span>{tag}</span>
                <span className="ml-1 opacity-60 hover:opacity-100 font-bold" aria-hidden="true">×</span>
              </Chip>
            </button>
          ))}
        </div>
      )}

      <Input
        list="tech-suggestions"
        value={pending}
        onChange={(event) => setPending(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(pending)}
        placeholder="Type a technology and press Enter (e.g. React, TypeScript, Go)"
        className="w-full text-xs border border-zinc-700/80 bg-[#181820] text-zinc-100 placeholder:text-zinc-400 rounded-xl focus:border-violet-500"
      />
      <datalist id="tech-suggestions">
        {suggestions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  )
}

export default TechTagInput
