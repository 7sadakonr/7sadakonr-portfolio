export type LandingPath = '/' | '/about' | '/project' | '/contact' | '/privacy'

export type NavigationTargetId =
  | 'home'
  | 'about'
  | 'about-me'
  | 'skills'
  | 'projects'
  | 'contact'
  | 'privacy'
  | `project-${number}`

export interface NavigationTarget {
  path: LandingPath
  targetId: NavigationTargetId
  usesQuarterViewportOffset?: boolean
}
