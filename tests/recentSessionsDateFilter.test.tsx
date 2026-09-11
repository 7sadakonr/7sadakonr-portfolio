import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RecentSessions from '../src/features/admin/components/analytics/RecentSessions'
import type { RecentSessionItem } from '../src/features/admin/hooks/useAnalytics'

describe('RecentSessions date filtering', () => {
  afterEach(() => {
    cleanup()
  })

  const toLocalDateString = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const now = new Date()
  const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30).toISOString()
  const yesterday = new Date(now.getTime() - 86400000)
  const yesterdayIso = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 11, 15).toISOString()
  const olderDate = new Date(now.getTime() - 86400000 * 5)
  const olderDateStr = toLocalDateString(olderDate)
  const olderIso = new Date(olderDate.getFullYear(), olderDate.getMonth(), olderDate.getDate(), 9, 0).toISOString()

  const mockSessions: RecentSessionItem[] = [
    {
      session_id: 'sess-today',
      visitor_short: 'today01',
      started_at: todayIso,
      last_seen_at: todayIso,
      landing_path: '/',
      utm_source: 'github',
      utm_campaign: 'readme',
      country: 'TH',
      device_type: 'Desktop',
      event_count: 5,
      duration_seconds: 120,
    },
    {
      session_id: 'sess-yesterday',
      visitor_short: 'yest01',
      started_at: yesterdayIso,
      last_seen_at: yesterdayIso,
      landing_path: '/projects',
      utm_source: 'linkedin',
      utm_campaign: null,
      country: 'US',
      device_type: 'Mobile',
      event_count: 2,
      duration_seconds: 45,
    },
    {
      session_id: 'sess-older',
      visitor_short: 'older01',
      started_at: olderIso,
      last_seen_at: olderIso,
      landing_path: '/',
      utm_source: null,
      utm_campaign: null,
      country: null,
      device_type: 'Desktop',
      event_count: 1,
      duration_seconds: 10,
    },
  ]

  const mockFetchDetail = vi.fn().mockResolvedValue(null)

  it('renders date filter presets (All Recent, Today, Yesterday) and date picker input', () => {
    render(<RecentSessions sessions={mockSessions} isLoading={false} fetchDetail={mockFetchDetail} />)

    expect(screen.getByRole('button', { name: /^filter all recent$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^filter today$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^filter yesterday$/i })).toBeTruthy()
    expect(screen.getByLabelText(/select specific date/i)).toBeTruthy()

    // By default, displays all 3 sessions
    expect(screen.getByText(/visitor #today01/i)).toBeTruthy()
    expect(screen.getByText(/visitor #yest01/i)).toBeTruthy()
    expect(screen.getByText(/visitor #older01/i)).toBeTruthy()
  })

  it('filters to today sessions when "Today" preset is clicked', async () => {
    render(<RecentSessions sessions={mockSessions} isLoading={false} fetchDetail={mockFetchDetail} />)

    fireEvent.click(screen.getByRole('button', { name: /^filter today$/i }))

    expect(screen.getByText(/visitor #today01/i)).toBeTruthy()
    expect(screen.queryByText(/visitor #yest01/i)).toBeNull()
    expect(screen.queryByText(/visitor #older01/i)).toBeNull()
  })

  it('filters to yesterday sessions when "Yesterday" preset is clicked', async () => {
    render(<RecentSessions sessions={mockSessions} isLoading={false} fetchDetail={mockFetchDetail} />)

    fireEvent.click(screen.getByRole('button', { name: /^filter yesterday$/i }))

    expect(screen.queryByText(/visitor #today01/i)).toBeNull()
    expect(screen.getByText(/visitor #yest01/i)).toBeTruthy()
    expect(screen.queryByText(/visitor #older01/i)).toBeNull()
  })

  it('filters by choosing a specific calendar date in the date input', async () => {
    render(<RecentSessions sessions={mockSessions} isLoading={false} fetchDetail={mockFetchDetail} />)

    const dateInput = screen.getByLabelText(/select specific date/i)
    fireEvent.change(dateInput, { target: { value: olderDateStr } })

    expect(screen.queryByText(/visitor #today01/i)).toBeNull()
    expect(screen.queryByText(/visitor #yest01/i)).toBeNull()
    expect(screen.getByText(/visitor #older01/i)).toBeTruthy()
  })

  it('allows resetting back to all recent sessions', async () => {
    render(<RecentSessions sessions={mockSessions} isLoading={false} fetchDetail={mockFetchDetail} />)

    // Filter to today
    fireEvent.click(screen.getByRole('button', { name: /^filter today$/i }))
    expect(screen.queryByText(/visitor #yest01/i)).toBeNull()

    // Click "All Recent"
    fireEvent.click(screen.getByRole('button', { name: /^filter all recent$/i }))
    expect(screen.getByText(/visitor #today01/i)).toBeTruthy()
    expect(screen.getByText(/visitor #yest01/i)).toBeTruthy()
    expect(screen.getByText(/visitor #older01/i)).toBeTruthy()
  })

  it('calls fetchByDate when provided and displays fetched sessions', async () => {
    const customFetchedSession: RecentSessionItem = {
      session_id: 'sess-remote-fetched',
      visitor_short: 'remote01',
      started_at: `${olderDateStr}T15:00:00Z`,
      last_seen_at: `${olderDateStr}T15:05:00Z`,
      landing_path: '/projects/demo',
      utm_source: 'twitter',
      utm_campaign: 'post',
      country: 'JP',
      device_type: 'Desktop',
      event_count: 8,
      duration_seconds: 300,
    }

    const mockFetchByDate = vi.fn().mockResolvedValue([customFetchedSession])

    render(
      <RecentSessions
        sessions={mockSessions}
        isLoading={false}
        fetchDetail={mockFetchDetail}
        fetchByDate={mockFetchByDate}
      />,
    )

    const dateInput = screen.getByLabelText(/select specific date/i)
    fireEvent.change(dateInput, { target: { value: olderDateStr } })

    await waitFor(() => {
      expect(mockFetchByDate).toHaveBeenCalledWith(olderDateStr)
    })
    await waitFor(() => {
      expect(screen.getByText(/visitor #remote01/i)).toBeTruthy()
    })
  })
})
