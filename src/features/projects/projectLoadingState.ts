export type ProjectLoadingPhase = 'reserved' | 'visible' | 'exiting'

export const getProjectLoadingPhase = (isLoading: boolean, showSkeleton: boolean): ProjectLoadingPhase => {
  if (showSkeleton) return 'visible'
  if (isLoading) return 'reserved'
  return 'exiting'
}
