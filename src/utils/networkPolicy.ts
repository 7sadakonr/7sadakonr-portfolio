export interface NetworkInformationLike {
  saveData?: boolean
  effectiveType?: string
}

export const canWarmHeavyAssets = (connection?: NetworkInformationLike) => {
  if (!connection) return true
  if (connection.saveData) return false

  return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g'
}
