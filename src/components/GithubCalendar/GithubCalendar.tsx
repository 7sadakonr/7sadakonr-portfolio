import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import GitHubActivity, {
    type Contribution as ActivityContribution,
    type RepoContribution,
} from '../ui/github-activity'
import DotPattern from '../DotPattern/DotPattern'
import './GithubCalendar.css'

type ColorSchema = 'green' | 'blue' | 'purple' | 'orange' | 'gray'

type Contribution = {
    date: string
    count: number
    level: number
}

type GithubContributionData = {
    total: Record<string, number>
    contributions: Contribution[]
}

type GithubStats = {
    followers: number
    repositories: number
    stars: number
}

type CachedRepository = {
    name: string
    count: number
    href: string
    avatarUrl?: string
}

type GithubCalendarProps = {
    username: string
    className?: string
    colorSchema?: ColorSchema
}

type GitHubPushEvent = {
    type: string
    repo?: { name: string }
    payload?: { commits?: unknown[] }
}

type GitHubOwnedRepository = {
    full_name: string
    name: string
    owner?: {
        login: string
        avatar_url?: string
    }
}

const CACHE_TTL_MS = 30 * 60 * 1000
const REPOSITORY_LIMIT = 3

const COLOR_SCALES: Record<ColorSchema, [string, string, string, string, string]> = {
    green: ['#202024', '#273f32', '#2f6b46', '#3ea060', '#56d477'],
    purple: ['#202024', '#34204b', '#562e7d', '#7a3fc0', '#a66df4'],
    blue: ['#202024', '#1c3355', '#25568e', '#347ec4', '#58a6ff'],
    orange: ['#202024', '#4a2a1b', '#824322', '#c5642c', '#f58a4c'],
    gray: ['#202024', '#34343a', '#55555e', '#81818d', '#b8b8c2'],
}

const ACTIVITY_THEME = {
    '--foreground': '#fff',
    '--color-foreground': '#fff',
    '--card': '#202024',
    '--color-card': '#202024',
    '--background': '#0d0d0f',
    '--color-background': '#0d0d0f',
    '--color-neutral-200': '#202024',
    backgroundColor: 'rgba(15, 15, 18, 0.4)',
} as CSSProperties

interface CacheEntry<T> {
    timestamp: number
    data: T
}

const FollowersIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 640 512" fill="currentColor">
        <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
    </svg>
)

const RepositoriesIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H6A1.5 1.5 0 0 0 4.5 18v.75c0 .716.43 1.334 1.05 1.605a.75.75 0 0 1-.6 1.374A3.251 3.251 0 0 1 3 18.75ZM19.5 1.5H5.75c-.69 0-1.25.56-1.25 1.25v12.651A2.989 2.989 0 0 1 6 15h13.5Z" />
        <path d="M7 18.25a.25.25 0 0 1 .25-.25h5a.25.25 0 0 1 .25.25v5.01a.25.25 0 0 1-.397.201l-2.206-1.604a.25.25 0 0 0-.294 0L7.397 23.46a.25.25 0 0 1-.397-.2v-5.01Z" />
    </svg>
)

const StarsIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 576 512" fill="currentColor">
        <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
    </svg>
)

const SparkleStar = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
)

const getCachedData = <T,>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return null

        const parsed = JSON.parse(raw) as CacheEntry<T>
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            return parsed.data
        }

        sessionStorage.removeItem(key)
    } catch {
        // Storage can be unavailable in private browsing mode.
    }

    return null
}

const setCachedData = <T,>(key: string, data: T): void => {
    try {
        sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data } satisfies CacheEntry<T>))
    } catch {
        // Storage quota errors must not block activity rendering.
    }
}

const ACTIVITY_WEEKS = 53
const MIN_ACTIVITY_CELL_SIZE = 11
const MAX_ACTIVITY_CELL_SIZE = 64
const ACTIVITY_CELL_STEP = 0.25

const activityCellGap = (cellSize: number) => Math.max(2, Math.round(cellSize / 4))

const activityWidthFor = (cellSize: number) => {
    const gap = activityCellGap(cellSize)
    return ACTIVITY_WEEKS * (cellSize + gap) - gap
}

const fitActivityCell = (availableWidth: number) => {
    let best = MIN_ACTIVITY_CELL_SIZE

    for (let cell = MIN_ACTIVITY_CELL_SIZE; cell <= MAX_ACTIVITY_CELL_SIZE && activityWidthFor(cell) <= availableWidth - 1; cell += ACTIVITY_CELL_STEP) {
        best = cell
    }

    return best
}

const useFittedActivityCell = () => {
    const ref = useRef<HTMLDivElement>(null)
    const [cellSize, setCellSize] = useState(MIN_ACTIVITY_CELL_SIZE)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const measure = () => {
            const activity = element.querySelector<HTMLElement>('[data-slot="github-activity"]')
            if (!activity) return

            const styles = window.getComputedStyle(activity)
            const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight)
            setCellSize(fitActivityCell(activity.clientWidth - horizontalPadding))
        }
        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    return [ref, cellSize] as const
}

const normalizeContributions = (contributions: Contribution[]): ActivityContribution[] => {
    const firstSunday = contributions.findIndex(
        (contribution) => new Date(`${contribution.date}T00:00:00Z`).getUTCDay() === 0,
    )

    return contributions.slice(firstSunday < 0 ? 0 : firstSunday).map((contribution) => ({
        date: contribution.date,
        count: contribution.count,
        level: Math.max(0, Math.min(4, contribution.level)) as ActivityContribution['level'],
    }))
}

const toRepositories = (
    events: GitHubPushEvent[],
    ownedRepositories: GitHubOwnedRepository[],
    username: string,
): CachedRepository[] => {
    const counts = new Map<string, number>()

    events.forEach((event) => {
        if (event.type !== 'PushEvent' || !event.repo) return

        const commits = event.payload?.commits?.length ?? 1
        counts.set(event.repo.name, (counts.get(event.repo.name) ?? 0) + commits)
    })

    const repositories = new Map<string, CachedRepository>()

    ownedRepositories.forEach((repository) => {
        repositories.set(repository.full_name, {
            name: repository.name,
            count: counts.get(repository.full_name) ?? 0,
            href: `https://github.com/${repository.full_name}`,
            avatarUrl: repository.owner?.login.toLowerCase() === username.toLowerCase()
                ? undefined
                : repository.owner?.avatar_url,
        })
    })

    counts.forEach((count, fullName) => {
        if (repositories.has(fullName)) return

        const [owner = '', name = fullName] = fullName.split('/')
        repositories.set(fullName, {
            name,
            count,
            href: `https://github.com/${fullName}`,
            avatarUrl: owner.toLowerCase() === username.toLowerCase()
                ? undefined
                : `https://github.com/${owner}.png?size=64`,
        })
    })

    return [...repositories.values()]
        .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
        .slice(0, REPOSITORY_LIMIT)
}

const GithubCalendar = ({ username, className = '', colorSchema = 'green' }: GithubCalendarProps) => {
    const contributionCacheKey = `gh_contrib_${username}`
    const repositoryCacheKey = `gh_activity_repos_v3_${username}`
    const statsCacheKey = `gh_stats_${username}`

    const [data, setData] = useState<GithubContributionData | null>(() => getCachedData<GithubContributionData>(contributionCacheKey))
    const [repositories, setRepositories] = useState<CachedRepository[]>(() => getCachedData<CachedRepository[]>(repositoryCacheKey) ?? [])
    const [stats, setStats] = useState<GithubStats | null>(() => getCachedData<GithubStats>(statsCacheKey))
    const [loading, setLoading] = useState(() => !getCachedData<GithubContributionData>(contributionCacheKey))
    const [error, setError] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [activityRef, cellSize] = useFittedActivityCell()

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry?.isIntersecting) {
                setIsVisible(true)
                observer.disconnect()
            }
        }, { rootMargin: '200px 0px' })

        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!isVisible) return

        const cached = getCachedData<GithubContributionData>(contributionCacheKey)
        if (cached) {
            setData(cached)
            setLoading(false)
            return
        }

        const controller = new AbortController()

        const fetchContributions = async () => {
            setLoading(true)
            setError(false)

            try {
                const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`, {
                    signal: controller.signal,
                })

                if (!response.ok) throw new Error('Unable to load GitHub contributions')

                const result = await response.json() as GithubContributionData
                if (!Array.isArray(result.contributions)) throw new Error('Invalid GitHub contribution data')

                setCachedData(contributionCacheKey, result)
                setData(result)
            } catch (fetchError) {
                if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
                    setError(true)
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        fetchContributions()
        return () => controller.abort()
    }, [contributionCacheKey, isVisible, username])

    useEffect(() => {
        if (!isVisible) return

        const cached = getCachedData<CachedRepository[]>(repositoryCacheKey)
        if (cached) {
            setRepositories(cached)
            return
        }

        const controller = new AbortController()

        const fetchRepositories = async () => {
            try {
                const headers = { Accept: 'application/vnd.github+json' }
                const [eventsResponse, ownedRepositoriesResponse] = await Promise.all([
                    fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
                        headers,
                        signal: controller.signal,
                    }),
                    fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, {
                        headers,
                        signal: controller.signal,
                    }),
                ])
                if (!eventsResponse.ok || !ownedRepositoriesResponse.ok) {
                    throw new Error('Unable to load GitHub repository activity')
                }

                const events = await eventsResponse.json() as GitHubPushEvent[]
                const ownedRepositories = await ownedRepositoriesResponse.json() as GitHubOwnedRepository[]
                const nextRepositories = toRepositories(events, ownedRepositories, username)
                setCachedData(repositoryCacheKey, nextRepositories)
                setRepositories(nextRepositories)
            } catch (fetchError) {
                if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
                    setRepositories([])
                }
            }
        }

        fetchRepositories()
        return () => controller.abort()
    }, [isVisible, repositoryCacheKey, username])

    useEffect(() => {
        if (!isVisible) return

        const cached = getCachedData<GithubStats>(statsCacheKey)
        if (cached) {
            setStats(cached)
            return
        }

        const controller = new AbortController()

        const fetchStats = async () => {
            try {
                const headers = { Accept: 'application/vnd.github+json' }
                const [profileResponse, repositoriesResponse] = await Promise.all([
                    fetch(`https://api.github.com/users/${username}`, { headers, signal: controller.signal }),
                    fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, { headers, signal: controller.signal }),
                ])

                if (!profileResponse.ok || !repositoriesResponse.ok) throw new Error('Unable to load GitHub stats')

                const profile = await profileResponse.json() as { followers: number; public_repos: number }
                const ownedRepositories = await repositoriesResponse.json() as Array<{ stargazers_count: number }>
                const computedStats = {
                    followers: profile.followers,
                    repositories: profile.public_repos,
                    stars: ownedRepositories.reduce((total, repository) => total + repository.stargazers_count, 0),
                }

                setCachedData(statsCacheKey, computedStats)
                setStats(computedStats)
            } catch (fetchError) {
                if (!(fetchError instanceof DOMException && fetchError.name === 'AbortError')) setStats(null)
            }
        }

        fetchStats()
        return () => controller.abort()
    }, [isVisible, statsCacheKey, username])

    const activityContributions = useMemo(
        () => normalizeContributions(data?.contributions ?? []),
        [data],
    )
    const activityRepositories = useMemo<RepoContribution[]>(
        () => repositories.map((repository) => ({
            name: repository.name,
            count: repository.count,
            href: repository.href,
            logo: repository.avatarUrl ? <img src={repository.avatarUrl} alt="" /> : undefined,
        })),
        [repositories],
    )
    const activityLoading = loading
    const statItems = [
        { label: 'Followers', value: stats?.followers, tone: 'followers', icon: <FollowersIcon /> },
        { label: 'Public Repos', value: stats?.repositories, tone: 'repositories', icon: <RepositoriesIcon /> },
        { label: 'GitHub Stars', value: stats?.stars, tone: 'stars', icon: <StarsIcon /> },
    ]

    return (
        <div
            ref={containerRef}
            className={['github-calendar', `github-calendar--${colorSchema}`, className].filter(Boolean).join(' ')}
            aria-busy={activityLoading}
        >
            {activityLoading ? (
                <section className="github-calendar-main github-calendar-main--state">
                    <div className="github-calendar-loading" aria-label="Loading GitHub contributions">
                        <div className="github-calendar-loading-header" />
                        <div className="github-calendar-loading-grid" />
                    </div>
                </section>
            ) : error || !data ? (
                <section className="github-calendar-main github-calendar-main--state">
                    <div className="github-calendar-error" role="alert">
                        <span>GitHub activity is unavailable right now.</span>
                        <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer">
                            View @{username} on GitHub
                        </a>
                    </div>
                </section>
            ) : (
                <div ref={activityRef} className="github-calendar-activity-frame">
                    <GitHubActivity
                        username={username}
                        contributions={activityContributions}
                        repos={activityRepositories}
                        className="github-calendar-activity dark"
                        accent={COLOR_SCALES[colorSchema]}
                        cellSize={cellSize}
                        showMonths
                        style={{ ...ACTIVITY_THEME, width: '100%' }}
                    />
                </div>
            )}

            <aside className="github-calendar-stats" aria-label={`GitHub statistics for ${username}`}>
                {statItems.map((item) => (
                    <div className={`github-calendar-stat github-calendar-stat--${item.tone}`} key={item.label}>
                        <DotPattern className="github-calendar-stat-dot-pattern" width={14} height={14} cx={1.25} cy={1.25} cr={1.25} />
                        <div className="github-calendar-stat-content">
                            <span className="github-calendar-stat-label">{item.label}</span>
                            <strong className="github-calendar-stat-value">{item.value?.toLocaleString() ?? '0'}</strong>
                        </div>
                        <div className="github-calendar-stat-watermark" aria-hidden="true">
                            {item.icon}
                            {item.tone === 'followers' && <><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--followers-1"><SparkleStar size={13} /></span><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--followers-2"><SparkleStar size={9} /></span><span className="github-calendar-stat-sparkle-dot github-calendar-stat-sparkle-dot--followers-1" /></>}
                            {item.tone === 'repositories' && <><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--repos-1"><SparkleStar size={11} /></span><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--repos-2"><SparkleStar size={14} /></span><span className="github-calendar-stat-sparkle-dot github-calendar-stat-sparkle-dot--repos-1" /></>}
                            {item.tone === 'stars' && <><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--stars-1"><SparkleStar size={15} /></span><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--stars-2"><SparkleStar size={10} /></span><span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--stars-3"><SparkleStar size={8} /></span><span className="github-calendar-stat-sparkle-dot github-calendar-stat-sparkle-dot--stars-1" /></>}
                        </div>
                    </div>
                ))}
            </aside>
        </div>
    )
}

export default GithubCalendar
