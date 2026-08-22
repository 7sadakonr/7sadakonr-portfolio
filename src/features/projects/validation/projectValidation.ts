export interface ProjectUrlErrors {
  liveUrl?: string
  githubUrl?: string
}

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const validateOptionalUrl = (value: string) =>
  !value.trim() || isHttpUrl(value.trim()) ? undefined : 'Use a valid http:// or https:// URL.'

export const validateProjectUrls = (liveUrl: string, githubUrl: string): ProjectUrlErrors => {
  const liveError = validateOptionalUrl(liveUrl)
  const githubError = validateOptionalUrl(githubUrl)

  return {
    ...(liveError ? { liveUrl: liveError } : {}),
    ...(githubError ? { githubUrl: githubError } : {}),
  }
}
