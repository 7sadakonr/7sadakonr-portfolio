import type { LandingPath, NavigationTarget, NavigationTargetId } from './navigation.types'

const TOP_LEVEL_TARGETS: Record<LandingPath, NavigationTarget> = {
  '/': { path: '/', targetId: 'home' },
  '/about': { path: '/about', targetId: 'about' },
  '/project': { path: '/project', targetId: 'projects' },
  '/contact': { path: '/contact', targetId: 'contact' },
}

const SECTION_ROUTES: Record<string, LandingPath> = {
  home: '/',
  about: '/about',
  'about-me': '/about',
  skills: '/about',
  projects: '/project',
  contact: '/contact',
}

export const getNavigationTarget = (path: string): NavigationTarget =>
  TOP_LEVEL_TARGETS[path as LandingPath] ?? TOP_LEVEL_TARGETS['/']

export const getRouteForSection = (sectionId: string): LandingPath | null =>
  SECTION_ROUTES[sectionId] ?? (sectionId.startsWith('project-') ? '/project' : null)

export const getOwningSection = (targetId: NavigationTargetId) => {
  if (targetId === 'about' || targetId === 'about-me' || targetId === 'skills') return 'about'
  if (targetId === 'projects' || targetId.startsWith('project-')) return 'projects'
  if (targetId === 'contact') return 'contact'
  return null
}
