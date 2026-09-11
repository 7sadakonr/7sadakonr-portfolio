import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDelayedLoading } from '../src/hooks/useDelayedLoading'

describe('useDelayedLoading', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a visible skeleton mounted for its minimum display duration after loading settles', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDelayedLoading(isLoading, 10, 100),
      { initialProps: { isLoading: true } },
    )

    act(() => { vi.advanceTimersByTime(10) })
    expect(result.current).toBe(true)

    rerender({ isLoading: false })
    expect(result.current).toBe(true)

    act(() => { vi.advanceTimersByTime(99) })
    expect(result.current).toBe(true)

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe(false)
  })

  it('does not reset delay timer if effect reruns while still loading', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDelayedLoading(isLoading, 50, 100),
      { initialProps: { isLoading: true } },
    )

    act(() => { vi.advanceTimersByTime(30) })
    expect(result.current).toBe(false)

    // Re-render while still loading (should not reset 50ms timer)
    rerender({ isLoading: true })

    act(() => { vi.advanceTimersByTime(20) })
    expect(result.current).toBe(true)
  })
})
