import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSkeletonPresence } from '../src/hooks/useDelayedLoading'

describe('useSkeletonPresence', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const options = { delayMs: 200, minVisibleMs: 400, exitMs: 240 }

  it('stays idle when nothing is loading', () => {
    const { result } = renderHook(() => useSkeletonPresence(false, options))
    expect(result.current).toBe('idle')
  })

  it('never becomes visible when loading finishes before the delay', () => {
    const { result, rerender } = renderHook(({ loading }) => useSkeletonPresence(loading, options), {
      initialProps: { loading: true },
    })
    expect(result.current).toBe('pending')

    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('pending')

    rerender({ loading: false })
    expect(result.current).toBe('idle')
  })

  it('shows after the delay, holds the minimum time, then fades out and unmounts', () => {
    const { result, rerender } = renderHook(({ loading }) => useSkeletonPresence(loading, options), {
      initialProps: { loading: true },
    })

    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe('visible')

    act(() => { vi.advanceTimersByTime(100) })
    rerender({ loading: false })
    expect(result.current).toBe('visible')

    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('leaving')

    act(() => { vi.advanceTimersByTime(240) })
    expect(result.current).toBe('idle')
  })

  it('restarts the delay when loading begins again after going idle', () => {
    const { result, rerender } = renderHook(({ loading }) => useSkeletonPresence(loading, options), {
      initialProps: { loading: false },
    })

    rerender({ loading: true })
    expect(result.current).toBe('pending')

    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe('visible')
  })
})
