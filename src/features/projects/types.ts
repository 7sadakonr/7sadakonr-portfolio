export interface ProjectRecord {
  id: string
  title: string
  description: string
  image_url: string | null
  image_storage_path: string | null
  live_url: string | null
  github_url: string | null
  tech: string[]
  is_in_progress: boolean
  is_visible: boolean
  sort_order: number
  fallback_gradient: string | null
  legacy_source_id: number | null
  created_at: string
  updated_at: string
}

export interface PublicProjectItem {
  id: string
  title: string
  description: string
  tech: readonly string[]
  image: string | null
  liveUrl: string | null
  githubUrl: string | null
  gradient?: string
  isInProgress: boolean
  isVisible: boolean
  sortOrder: number
}

export interface ProjectDraft {
  id: string
  title: string
  description: string
  imageUrl: string | null
  imageStoragePath: string | null
  liveUrl: string
  githubUrl: string
  tech: string[]
  isInProgress: boolean
  isVisible: boolean
  sortOrder: number
  fallbackGradient: string | null
}

export const DEFAULT_PROJECT_GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)'
