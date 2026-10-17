import { createContext, useContext, useEffect, useRef, type MutableRefObject } from 'react'

interface UnsavedChangesApi {
  dirtyRef: MutableRefObject<boolean>
}

export const UnsavedChangesContext = createContext<UnsavedChangesApi | null>(null)

// Pages call this with their dirty flag. The layout reads it before in-app navigation and
// the browser warns before a reload or tab close.
export function useUnsavedChanges(isDirty: boolean): void {
  const api = useContext(UnsavedChangesContext)

  useEffect(() => {
    if (api) api.dirtyRef.current = isDirty
    return () => {
      if (api) api.dirtyRef.current = false
    }
  }, [api, isDirty])

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])
}

export function useCreateUnsavedChangesApi(): UnsavedChangesApi {
  const dirtyRef = useRef(false)
  const apiRef = useRef<UnsavedChangesApi>({ dirtyRef })
  return apiRef.current
}
