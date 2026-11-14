import type { VercelRequest, VercelResponse } from '@vercel/node'

// Top repositories (real commits in the last year) and profile stats for the About card.
// Runs server-side with a GitHub token so the browser never hits the unauthenticated
// 60 req/hour limit, and is CDN-cached so GitHub is queried roughly once an hour.
// Without GITHUB_TOKEN it answers 503 and the client falls back to the public API.

const DEFAULT_USERNAME = '7sadakonr'
const REPOSITORY_LIMIT = 5

const QUERY = `
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
      totalCount
      nodes { stargazerCount }
    }
    contributionsCollection {
      commitContributionsByRepository(maxRepositories: 25) {
        repository { name nameWithOwner isPrivate url owner { login avatarUrl } }
        contributions { totalCount }
      }
    }
  }
}`

interface GraphqlResponse {
  data?: {
    user: {
      followers: { totalCount: number }
      repositories: { totalCount: number; nodes: { stargazerCount: number }[] }
      contributionsCollection: {
        commitContributionsByRepository: {
          repository: {
            name: string
            nameWithOwner: string
            isPrivate: boolean
            url: string
            owner: { login: string; avatarUrl: string }
          }
          contributions: { totalCount: number }
        }[]
      }
    } | null
  }
  errors?: { message: string }[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const allowed = (process.env.GITHUB_USERNAME || DEFAULT_USERNAME).toLowerCase()
  const requested = typeof req.query.username === 'string' ? req.query.username : allowed
  // Only the configured profile, so this can't be used as an open proxy for the token.
  if (requested.toLowerCase() !== allowed) {
    return res.status(400).json({ error: 'Unknown username' })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(503).json({ error: 'GITHUB_TOKEN is not configured' })
  }

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-github-activity',
      },
      body: JSON.stringify({ query: QUERY, variables: { login: allowed } }),
    })
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`)

    const body = await response.json() as GraphqlResponse
    const user = body.data?.user
    if (!user) throw new Error(body.errors?.[0]?.message ?? 'User not found')

    const repositories = user.contributionsCollection.commitContributionsByRepository
      .filter(({ repository }) => !repository.isPrivate && repository.name.toLowerCase() !== allowed)
      .map(({ repository, contributions }) => ({
        name: repository.name,
        count: contributions.totalCount,
        href: repository.url,
        avatarUrl: repository.owner.login.toLowerCase() === allowed ? undefined : repository.owner.avatarUrl,
      }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, REPOSITORY_LIMIT)

    const stats = {
      followers: user.followers.totalCount,
      repositories: user.repositories.totalCount,
      stars: user.repositories.nodes.reduce((total, node) => total + node.stargazerCount, 0),
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800')
    return res.status(200).json({ repositories, stats })
  } catch (error) {
    console.error('github-activity failed', error)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(502).json({ error: 'Unable to load GitHub activity' })
  }
}
