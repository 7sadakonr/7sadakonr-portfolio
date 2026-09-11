import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduleIdleWork } from '../src/utils/runtimeScheduler'

describe('scheduleIdleWork', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('runs deferred work with the timeout fallback when requestIdleCallback is unavailable', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    const task = vi.fn()

    scheduleIdleWork(task)
    expect(task).not.toHaveBeenCalled()

    vi.advanceTimersByTime(220)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('cancels fallback work before it starts', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    const task = vi.fn()

    const cancel = scheduleIdleWork(task)
    cancel()
    vi.advanceTimersByTime(220)

    expect(task).not.toHaveBeenCalled()
  })
})
