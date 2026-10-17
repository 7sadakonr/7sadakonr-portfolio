import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataTable, { type Column } from '../src/features/admin/components/ui/DataTable'
import StatCard from '../src/features/admin/components/ui/StatCard'
import Panel from '../src/features/admin/components/ui/Panel'
import { ToastProvider } from '../src/features/admin/components/ui/Toast'
import { useToast } from '../src/features/admin/components/ui/toastContext'

interface Row { name: string; hits: number }
const rows: Row[] = [{ name: 'Alpha', hits: 3 }, { name: 'Beta', hits: 10 }]
const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', sortValue: (row) => row.name, render: (row) => row.name },
  { key: 'hits', header: 'Hits', align: 'right', sortValue: (row) => row.hits, render: (row) => row.hits },
]

describe('DataTable', () => {
  it('sorts by the default column, toggles direction, and renders a card list for small screens', () => {
    render(<DataTable caption="Things" columns={columns} rows={rows} getRowKey={(row) => row.name} defaultSort={{ key: 'hits', direction: 'desc' }} />)
    const table = screen.getByRole('table', { hidden: true })
    const names = () => within(table).getAllByRole('row', { hidden: true }).slice(1).map((row) => row.textContent)
    expect(names()).toEqual(['Beta10', 'Alpha3'])
    fireEvent.click(within(table).getByRole('button', { name: /Hits/, hidden: true }))
    expect(names()).toEqual(['Alpha3', 'Beta10'])
    expect(screen.getByRole('list', { name: 'Things', hidden: true }).children).toHaveLength(2)
  })

  it('activates a row from the keyboard-reachable first-cell button', () => {
    const onActivate = vi.fn()
    render(<DataTable caption="Things" columns={columns} rows={rows} getRowKey={(row) => row.name} onRowActivate={onActivate} rowActionLabel={(row) => `Details for ${row.name}`} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Details for Alpha', hidden: true })[0]!)
    expect(onActivate).toHaveBeenCalledWith(rows[0])
  })
})

describe('StatCard', () => {
  it('shows value, delta direction in text, and the metric definition', () => {
    render(<StatCard label="Visitors" value={1234} delta={{ pct: 12.5, direction: 'up' }} comparison="vs previous 7 days" hint="Unique people." />)
    expect(screen.getByText('1,234')).toBeTruthy()
    expect(screen.getByText(/up vs previous 7 days/)).toBeTruthy()
    expect(screen.getByText('Unique people.')).toBeTruthy()
  })

  it('shows an explicit unavailable state instead of a placeholder dash', () => {
    render(<StatCard label="Visitors" value={null} hint="x" unavailableText="Not connected" />)
    expect(screen.getByText('Not connected')).toBeTruthy()
  })
})

describe('Panel', () => {
  it('replaces the body with an empty state or a per-panel error', () => {
    const { rerender } = render(<Panel title="Referrers" empty={{ title: 'Nothing yet' }}><p>body</p></Panel>)
    expect(screen.getByText('Nothing yet')).toBeTruthy()
    rerender(<Panel title="Referrers" error="boom"><p>body</p></Panel>)
    expect(screen.getByText("Couldn't load referrers")).toBeTruthy()
    expect(screen.queryByText('body')).toBeNull()
  })
})

describe('ToastProvider', () => {
  afterEach(() => { cleanup(); vi.useRealTimers() })

  const Trigger = () => {
    const toast = useToast()
    return <button type="button" onClick={() => toast.success('Saved', 'All good')}>go</button>
  }

  it('announces a toast and removes it after its lifetime', () => {
    vi.useFakeTimers()
    render(<ToastProvider><Trigger /></ToastProvider>)
    fireEvent.click(screen.getByText('go'))
    expect(screen.getByRole('status').textContent).toContain('Saved')
    act(() => { vi.advanceTimersByTime(4100) })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('can be dismissed manually', () => {
    render(<ToastProvider><Trigger /></ToastProvider>)
    fireEvent.click(screen.getByText('go'))
    fireEvent.click(screen.getByLabelText('Dismiss notification'))
    expect(screen.queryByText('Saved')).toBeNull()
  })
})
