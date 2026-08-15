export type LandingPath = '/' | '/about' | '/project' | '/contact'

export type NavigationTargetId =
  | 'home'
  | 'about'
  | 'about-me'
  | 'skills'
  | 'projects'
  | 'contact'
  | `project-${number}`

export interface NavigationTarget {
  path: LandingPath
  targetId: NavigationTargetId
  usesQuarterViewportOffset?: boolean
}
