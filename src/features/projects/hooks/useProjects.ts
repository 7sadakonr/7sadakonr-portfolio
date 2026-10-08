import { useCallback, useEffect, useState } from 'react'
import { invalidatePublicProjects, loadPublicProjects, peekPublicProjects } from '../api/projectRepository'
import { getProjectCatalog } from '../data/projectCatalogStore'
import type { PublicProjectItem } from '../types'

interface UseProjectsState {
  projects: PublicProjectItem[]
  isLoading: boolean
  error: Error | null
}

export const useProjects = () => {
  const [state, setState] = useState<UseProjectsState>(() => {
    const catalog = getProjectCatalog() ?? peekPublicProjects()
    return { projects: catalog ?? [], isLoading: !catalog, error: null }
  })
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let isActive = true
    setState((previous) => (previous.projects.length ? previous : { ...previous, isLoading: true, error: null }))
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
