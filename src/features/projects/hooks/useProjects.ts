import { useCallback, useEffect, useState } from 'react'
import { invalidatePublicProjects, loadPublicProjects } from '../api/projectRepository'
import type { PublicProjectItem } from '../types'

interface UseProjectsState {
  projects: PublicProjectItem[]
  isLoading: boolean
  error: Error | null
}

export const useProjects = () => {
  const [state, setState] = useState<UseProjectsState>({ projects: [], isLoading: true, error: null })
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let isActive = true
    setState((previous) => ({ ...previous, isLoading: true, error: null }))
    void loadPublicProjects().then(
      (projects) => {
        if (isActive) setState({ projects, isLoading: false, error: null })
      },
      (error: unknown) => {
        if (isActive) setState({ projects: [], isLoading: false, error: error instanceof Error ? error : new Error('Unable to load projects') })
      },
    )
    return () => { isActive = false }
  }, [requestVersion])

  const retry = useCallback(() => {
    invalidatePublicProjects()
    setRequestVersion((version) => version + 1)
  }, [])

  return { ...state, retry }
}
