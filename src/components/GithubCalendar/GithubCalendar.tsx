import { useEffect, useMemo, useRef, useState } from 'react'
import DotPattern from '../DotPattern/DotPattern'
import './GithubCalendar.css'

type CalendarVariant = 'default' | 'city-lights' | 'minimal'
type CalendarShape = 'square' | 'rounded' | 'circle' | 'squircle'
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

type GithubCalendarProps = {
    username: string
    variant?: CalendarVariant
    shape?: CalendarShape
    className?: string
    showTotal?: boolean
    colorSchema?: ColorSchema
}

const GithubIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 16 16">
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
)

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
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
    </svg>
)

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CacheEntry<T> {
    timestamp: number
    data: T
}

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
        // Ignore storage errors (private mode, quota)
    }
    return null
}

const setCachedData = <T,>(key: string, data: T): void => {
    try {
        sessionStorage.setItem(
            key,
            JSON.stringify({ timestamp: Date.now(), data } as CacheEntry<T>),
        )
    } catch {
        // Ignore storage errors
    }
}

const GithubCalendar = ({
    username,
    variant = 'default',
    shape = 'rounded',
    className = '',
    showTotal = true,
    colorSchema = 'green',
}: GithubCalendarProps) => {
    const contribCacheKey = `gh_contrib_${username}`
    const statsCacheKey = `gh_stats_${username}`

    const [data, setData] = useState<GithubContributionData | null>(() => getCachedData<GithubContributionData>(contribCacheKey))
    const [stats, setStats] = useState<GithubStats | null>(() => getCachedData<GithubStats>(statsCacheKey))
    const [loading, setLoading] = useState(() => !getCachedData<GithubContributionData>(contribCacheKey))
    const [error, setError] = useState(false)
    const viewportRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const cached = getCachedData<GithubContributionData>(contribCacheKey)
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
                const response = await fetch(
                    `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
                    { signal: controller.signal },
                )

                if (!response.ok) {
                    throw new Error('Unable to load GitHub contributions')
                }

                const result = await response.json() as GithubContributionData

                if (!Array.isArray(result.contributions)) {
                    throw new Error('Invalid GitHub contribution data')
                }

                setCachedData(contribCacheKey, result)
                setData(result)
            } catch (fetchError) {
                if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                    return
                }

                setError(true)
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        fetchContributions()

        return () => controller.abort()
    }, [username, contribCacheKey])

    useEffect(() => {
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
                    fetch(`https://api.github.com/users/${username}`, {
                        headers,
                        signal: controller.signal,
                    }),
                    fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, {
                        headers,
                        signal: controller.signal,
                    }),
                ])

                if (!profileResponse.ok || !repositoriesResponse.ok) {
                    throw new Error('Unable to load GitHub stats')
                }

                const profile = await profileResponse.json() as {
                    followers: number
                    public_repos: number
                }
                const repositories = await repositoriesResponse.json() as Array<{
                    stargazers_count: number
                }>

                const computedStats: GithubStats = {
                    followers: profile.followers,
                    repositories: profile.public_repos,
                    stars: repositories.reduce(
                        (total, repository) => total + repository.stargazers_count,
                        0,
                    ),
                }

                setCachedData(statsCacheKey, computedStats)
                setStats(computedStats)
            } catch (fetchError) {
                if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                    return
                }

                setStats(null)
            }
        }

        fetchStats()

        return () => controller.abort()
    }, [username, statsCacheKey])

    const calendarCells = useMemo(() => {
        if (!data?.contributions.length) {
            return []
        }

        const firstDay = new Date(`${data.contributions[0].date}T00:00:00Z`).getUTCDay()
        const cells: Array<Contribution | null> = [
            ...Array<null>(firstDay).fill(null),
            ...data.contributions,
        ]

        while (cells.length % 7 !== 0) {
            cells.push(null)
        }

        return cells
    }, [data])

    const calendarMonths = useMemo(() => {
        if (!data?.contributions.length) {
            return []
        }

        const firstDay = new Date(`${data.contributions[0].date}T00:00:00Z`).getUTCDay()
        const seenMonths = new Set<string>()

        return data.contributions.flatMap((contribution, index) => {
            const monthKey = contribution.date.slice(0, 7)

            if (seenMonths.has(monthKey)) {
                return []
            }

            seenMonths.add(monthKey)

            return [{
                label: new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    timeZone: 'UTC',
                }).format(new Date(`${contribution.date}T00:00:00Z`)),
                weekIndex: Math.floor((firstDay + index) / 7),
            }]
        })
    }, [data])

    useEffect(() => {
        if (!data || !viewportRef.current) {
            return
        }

        viewportRef.current.scrollLeft = viewportRef.current.scrollWidth
    }, [data])

    const totalContributions = data
        ? data.total.lastYear
            ?? data.contributions.reduce((total, contribution) => total + contribution.count, 0)
        : 0
    const currentYear = new Date().getUTCFullYear().toString()
    const thisYearContributions = data
        ? data.contributions.reduce(
            (total, contribution) => contribution.date.startsWith(`${currentYear}-`)
                ? total + contribution.count
                : total,
            0,
        )
        : 0
    const statItems = [
        {
            label: 'Followers',
            value: stats?.followers,
            tone: 'followers',
            icon: <FollowersIcon />,
        },
        {
            label: 'Public Repos',
            value: stats?.repositories,
            tone: 'repositories',
            icon: <RepositoriesIcon />,
        },
        {
            label: 'GitHub Stars',
            value: stats?.stars,
            tone: 'stars',
            icon: <StarsIcon />,
        },
    ]

    return (
        <div
            className={[
                'github-calendar',
                `github-calendar--${variant}`,
                `github-calendar--${colorSchema}`,
                className,
            ].filter(Boolean).join(' ')}
            aria-busy={loading}
        >
            <section className="github-calendar-main">
                {loading ? (
                    <div className="github-calendar-loading" aria-label="Loading GitHub contributions">
                        <div className="github-calendar-loading-header" />
                        <div className="github-calendar-loading-grid" />
                    </div>
                ) : error || !data ? (
                    <div className="github-calendar-error" role="alert">
                        <span>GitHub activity is unavailable right now.</span>
                        <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer">
                            View @{username} on GitHub
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="github-calendar-header">
                            <div className="github-calendar-identity">
                                <span className="github-calendar-icon">
                                    <GithubIcon />
                                </span>
                                <div className="github-calendar-identity-copy">
                                    <a
                                        className="github-calendar-profile"
                                        href={`https://github.com/${username}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`Open ${username} on GitHub`}
                                    >
                                        @{username}
                                    </a>
                                    <span>Contribution Graph</span>
                                </div>
                            </div>
                            <div className="github-calendar-period">
                                <strong>{thisYearContributions.toLocaleString()}</strong>
                                <span>This year total</span>
                            </div>
                        </div>

                        <div
                            className="github-calendar-viewport"
                            ref={viewportRef}
                            role="region"
                            tabIndex={0}
                            aria-label={`GitHub contribution calendar for ${username}, ${totalContributions} contributions in the last year`}
                        >
                            <div className="github-calendar-track">
                                <div
                                    className="github-calendar-months"
                                    style={{
                                        gridTemplateColumns: `repeat(${calendarCells.length / 7}, var(--calendar-cell-size))`,
                                    }}
                                    aria-hidden="true"
                                >
                                    {calendarMonths.map((month) => (
                                        <span
                                            style={{ gridColumnStart: month.weekIndex + 1 }}
                                            key={`${month.label}-${month.weekIndex}`}
                                        >
                                            {month.label}
                                        </span>
                                    ))}
                                </div>
                                <div className="github-calendar-grid" role="img" aria-hidden="true">
                                    {calendarCells.map((contribution, index) => (
                                        contribution ? (
                                            <span
                                                className="github-calendar-cell"
                                                data-level={Math.max(0, Math.min(4, contribution.level))}
                                                data-shape={shape}
                                                title={`${contribution.count} contributions on ${contribution.date}`}
                                                key={contribution.date}
                                            />
                                        ) : (
                                            <span className="github-calendar-cell-placeholder" key={`placeholder-${index}`} />
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="github-calendar-footer">
                            {showTotal && (
                                <span className="github-calendar-summary">
                                    <strong>{totalContributions.toLocaleString()}</strong> contributions in the last year
                                </span>
                            )}
                            <div className="github-calendar-legend" aria-hidden="true">
                                <span>Less</span>
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <span className="github-calendar-cell" data-level={level} data-shape={shape} key={level} />
                                ))}
                                <span>More</span>
                            </div>
                        </div>
                    </>
                )}
            </section>

            <aside className="github-calendar-stats" aria-label={`GitHub statistics for ${username}`}>
                {statItems.map((item) => (
                    <div
                        className={`github-calendar-stat github-calendar-stat--${item.tone}`}
                        key={item.label}
                    >
                        <DotPattern
                            className="github-calendar-stat-dot-pattern"
                            width={14}
                            height={14}
                            cx={1.25}
                            cy={1.25}
                            cr={1.25}
                        />
                        <div className="github-calendar-stat-content">
                            <span className="github-calendar-stat-label">{item.label}</span>
                            <strong className="github-calendar-stat-value">{item.value?.toLocaleString() ?? '0'}</strong>
                        </div>
                        <div className="github-calendar-stat-watermark" aria-hidden="true">
                            {item.icon}
                            {item.tone === 'followers' && (
                                <>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--followers-1">
                                        <SparkleStar size={13} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--followers-2">
                                        <SparkleStar size={9} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle-dot github-calendar-stat-sparkle-dot--followers-1" />
                                </>
                            )}
                            {item.tone === 'repositories' && (
                                <>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--repos-1">
                                        <SparkleStar size={11} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--repos-2">
                                        <SparkleStar size={14} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle-dot github-calendar-stat-sparkle-dot--repos-1" />
                                </>
                            )}
                            {item.tone === 'stars' && (
                                <>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--stars-1">
                                        <SparkleStar size={15} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--stars-2">
                                        <SparkleStar size={10} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle github-calendar-stat-sparkle--stars-3">
                                        <SparkleStar size={8} />
                                    </span>
                                    <span className="github-calendar-stat-sparkle-dot github-calendar-stat-sparkle-dot--stars-1" />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </aside>
        </div>
    )
}

export default GithubCalendar
