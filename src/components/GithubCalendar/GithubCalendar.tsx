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

const GithubCalendar = ({
    username,
    variant = 'default',
    shape = 'rounded',
    className = '',
    showTotal = true,
    colorSchema = 'green',
}: GithubCalendarProps) => {
    const [data, setData] = useState<GithubContributionData | null>(null)
    const [stats, setStats] = useState<GithubStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const viewportRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
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
    }, [username])

    useEffect(() => {
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

                setStats({
                    followers: profile.followers,
                    repositories: profile.public_repos,
                    stars: repositories.reduce(
                        (total, repository) => total + repository.stargazers_count,
                        0,
                    ),
                })
            } catch (fetchError) {
                if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                    return
                }

                setStats(null)
            }
        }

        fetchStats()

        return () => controller.abort()
    }, [username])

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
            iconClass: 'fi fi-rr-users',
            pattern: { width: 16, height: 16, cx: 1, cy: 1, cr: 1 },
        },
        {
            label: 'Repositories',
            value: stats?.repositories,
            tone: 'repositories',
            iconClass: 'fi fi-rr-folder',
            pattern: { width: 20, height: 20, cx: 1.25, cy: 1.25, cr: 1.25 },
        },
        {
            label: 'Stars',
            value: stats?.stars,
            tone: 'stars',
            iconClass: 'fi fi-rr-star',
            pattern: { width: 12, height: 12, cx: 0.8, cy: 0.8, cr: 0.8 },
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
                            className="github-calendar-stat-pattern"
                            {...item.pattern}
                        />
                        <div className="github-calendar-stat-header">
                            <span>{item.label}</span>
                            <i className={`${item.iconClass} github-calendar-stat-icon`} aria-hidden="true" />
                        </div>
                        <strong>{item.value?.toLocaleString() ?? '—'}</strong>
                    </div>
                ))}
            </aside>
        </div>
    )
}

export default GithubCalendar
