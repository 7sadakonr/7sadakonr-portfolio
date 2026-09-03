import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GithubCalendar from '../src/components/GithubCalendar/GithubCalendar'

const contributionResponse = {
    total: { lastYear: 3 },
    contributions: [
        { date: '2026-08-30', count: 0, level: 0 },
        { date: '2026-08-31', count: 3, level: 4 },
    ],
}

describe('GitHub activity card', () => {
    beforeEach(() => {
        vi.stubGlobal('matchMedia', (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }))
        vi.stubGlobal('ResizeObserver', class {
            observe() {}
            disconnect() {}
        })
        vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
            const url = String(input)

            if (url.includes('github-contributions-api.jogruber.de')) {
                return Promise.resolve({ ok: true, json: async () => contributionResponse })
            }

            if (url.endsWith('/events/public?per_page=100')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{
                        type: 'PushEvent',
                        repo: { name: '7sadakonr/portfolio' },
                        payload: { commits: [{}, {}] },
                    }],
                })
            }

            if (url.endsWith('/repos?per_page=100&type=owner')) {
                return Promise.resolve({ ok: true, json: async () => [] })
            }

            return Promise.resolve({ ok: true, json: async () => ({ followers: 4, public_repos: 2 }) })
        }))
    })

    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
        sessionStorage.clear()
    })

    it('opens the fetched top repositories panel after activity loading completes', async () => {
        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        expect(screen.getByLabelText('Loading GitHub contributions')).not.toBeNull()

        const toggle = await screen.findByRole('button', { name: 'Show top repositories' })
        fireEvent.click(toggle)

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /portfolio/ }).getAttribute('href')).toBe(
                'https://github.com/7sadakonr/portfolio',
            )
        })
    })

    it('keeps the existing recovery link when contribution loading fails', async () => {
        vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
            const url = String(input)

            if (url.includes('github-contributions-api.jogruber.de')) {
                return Promise.resolve({ ok: false, json: async () => ({}) })
            }

            if (url.endsWith('/events/public?per_page=100') || url.endsWith('/repos?per_page=100&type=owner')) {
                return Promise.resolve({ ok: true, json: async () => [] })
            }

            return Promise.resolve({ ok: true, json: async () => ({ followers: 4, public_repos: 2 }) })
        }))

        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toContain('GitHub activity is unavailable right now.')
        expect(screen.getByRole('link', { name: 'View @7sadakonr on GitHub' }).getAttribute('href')).toBe(
            'https://github.com/7sadakonr',
        )
    })

    it('keeps the heatmap visible when repository events are unavailable', async () => {
        vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
            const url = String(input)

            if (url.includes('github-contributions-api.jogruber.de')) {
                return Promise.resolve({ ok: true, json: async () => contributionResponse })
            }

            if (url.endsWith('/events/public?per_page=100')) {
                return Promise.resolve({ ok: false, json: async () => ({}) })
            }

            if (url.endsWith('/repos?per_page=100&type=owner')) {
                return Promise.resolve({ ok: true, json: async () => [] })
            }

            return Promise.resolve({ ok: true, json: async () => ({ followers: 4, public_repos: 2 }) })
        }))

        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        expect(await screen.findByRole('img', { name: '3 contributions in 2026' })).not.toBeNull()
        expect(screen.queryByRole('button', { name: 'Show top repositories' })).toBeNull()
    })

    it('shows the heatmap before a delayed repository events request resolves', async () => {
        let resolveEvents: ((response: { ok: boolean; json: () => Promise<unknown> }) => void) | undefined

        vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
            const url = String(input)

            if (url.includes('github-contributions-api.jogruber.de')) {
                return Promise.resolve({ ok: true, json: async () => contributionResponse })
            }

            if (url.endsWith('/events/public?per_page=100')) {
                return new Promise((resolve) => {
                    resolveEvents = resolve
                })
            }

            if (url.endsWith('/repos?per_page=100&type=owner')) {
                return Promise.resolve({ ok: true, json: async () => [] })
            }

            return Promise.resolve({ ok: true, json: async () => ({ followers: 4, public_repos: 2 }) })
        }))

        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        expect(await screen.findByRole('img', { name: '3 contributions in 2026' })).not.toBeNull()

        resolveEvents?.({
            ok: true,
            json: async () => [{
                type: 'PushEvent',
                repo: { name: '7sadakonr/portfolio' },
                payload: { commits: [{}] },
            }],
        })

        expect(await screen.findByRole('button', { name: 'Show top repositories' })).not.toBeNull()
    })

    it('measures the activity card after the loading skeleton is replaced', async () => {
        const observed: Element[] = []
        vi.stubGlobal('ResizeObserver', class {
            observe(element: Element) {
                observed.push(element)
            }
            disconnect() {}
        })

        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        await screen.findByRole('img', { name: '3 contributions in 2026' })

        await waitFor(() => {
            expect(observed.some((element) => element.getAttribute('data-slot') === 'github-activity')).toBe(true)
        })
    })

    it('shows only the top three repositories in the expanded activity panel', async () => {
        vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
            const url = String(input)

            if (url.includes('github-contributions-api.jogruber.de')) {
                return Promise.resolve({ ok: true, json: async () => contributionResponse })
            }

            if (url.endsWith('/events/public?per_page=100')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { type: 'PushEvent', repo: { name: '7sadakonr/portfolio' }, payload: { commits: [{}, {}, {}] } },
                        { type: 'PushEvent', repo: { name: '7sadakonr/nyeta' }, payload: { commits: [{}, {}] } },
                        { type: 'PushEvent', repo: { name: '7sadakonr/inventory' }, payload: { commits: [{}] } },
                    ],
                })
            }

            if (url.endsWith('/repos?per_page=100&type=owner')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { full_name: '7sadakonr/portfolio', name: 'portfolio', owner: { login: '7sadakonr' }, stargazers_count: 0 },
                        { full_name: '7sadakonr/nyeta', name: 'nyeta', owner: { login: '7sadakonr' }, stargazers_count: 0 },
                        { full_name: '7sadakonr/inventory', name: 'inventory', owner: { login: '7sadakonr' }, stargazers_count: 0 },
                        { full_name: '7sadakonr/other-project', name: 'other-project', owner: { login: '7sadakonr' }, stargazers_count: 0 },
                    ],
                })
            }

            return Promise.resolve({ ok: true, json: async () => ({ followers: 4, public_repos: 4 }) })
        }))

        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        fireEvent.click(await screen.findByRole('button', { name: 'Show top repositories' }))

        expect(await screen.findByRole('link', { name: /portfolio/ })).not.toBeNull()
        expect(await screen.findByRole('link', { name: /nyeta/ })).not.toBeNull()
        expect(await screen.findByRole('link', { name: /inventory/ })).not.toBeNull()
        expect(screen.queryByRole('link', { name: /other-project/ })).toBeNull()
    })

    it('exposes dedicated layout slots for the expanded contributions panel', async () => {
        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        fireEvent.click(await screen.findByRole('button', { name: 'Show top repositories' }))

        expect(document.querySelector('[data-slot="github-activity-panel-header"]')).not.toBeNull()
        expect(document.querySelector('[data-slot="github-activity-panel-list"]')).not.toBeNull()
        expect(document.querySelectorAll('[data-slot="github-activity-repo-row"]')).toHaveLength(1)
    })

    it('keeps the heatmap in a centered content region', async () => {
        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        const graph = await screen.findByRole('img', { name: '3 contributions in 2026' })
        const content = graph.closest('[data-slot="github-activity-content"]')

        expect(content).not.toBeNull()
        expect(content?.contains(graph)).toBe(true)
    })

    it('links the GitHub profile identity on the left of the activity heading', async () => {
        render(<GithubCalendar username="7sadakonr" colorSchema="purple" />)

        const profile = await screen.findByRole('link', { name: 'GitHub profile for 7sadakonr' })

        expect(profile.getAttribute('href')).toBe('https://github.com/7sadakonr')
        expect(screen.getByText('@7sadakonr')).not.toBeNull()
        expect(screen.getByText('Contribution Graph')).not.toBeNull()
        expect(screen.getByText('3')).not.toBeNull()
        expect(screen.getByText('THIS YEAR TOTAL')).not.toBeNull()
    })
})
