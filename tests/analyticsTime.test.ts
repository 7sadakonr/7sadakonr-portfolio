import { describe, expect, it } from 'vitest'
import {
  bangkokKey, bucketKeys, computeDelta, formatBucketLong, formatBucketTick, formatRelativeTime, getWindow, summarizeSeries,
} from '../src/features/admin/hooks/analyticsTime'

// 2026-10-16 18:30 UTC is 01:30 on 17 Oct in Bangkok.
const NOW = Date.parse('2026-10-16T18:30:00Z')

describe('Bangkok analytics time', () => {
  it('keys instants by Bangkok wall clock, crossing the UTC date line', () => {
    expect(bangkokKey(Date.parse('2026-10-16T16:59:00Z'), 'day')).toBe('2026-10-16')
    expect(bangkokKey(Date.parse('2026-10-16T17:00:00Z'), 'day')).toBe('2026-10-17')
    expect(bangkokKey(NOW, 'hour')).toBe('2026-10-17T01:00')
  })

  it('builds a 24h window of 24 hourly buckets and an equally long previous window', () => {
    const win = getWindow('24h', NOW)
    const keys = bucketKeys(win.start, win.end, win.granularity)
    expect(keys).toHaveLength(24)
    expect(keys[0]).toBe('2026-10-16T02:00')
    expect(keys.at(-1)).toBe('2026-10-17T01:00')
    expect(bucketKeys(win.prevStart, win.prevEnd, win.granularity)).toHaveLength(24)
  })

  it('builds 7d and 30d windows of whole Bangkok days that include today', () => {
    const week = getWindow('7d', NOW)
    expect(bucketKeys(week.start, week.end, 'day')).toHaveLength(7)
    expect(bangkokKey(week.start, 'day')).toBe('2026-10-11')
    expect(bucketKeys(week.prevStart, week.prevEnd, 'day')).toHaveLength(7)
    const month = getWindow('30d', NOW)
    expect(bucketKeys(month.start, month.end, 'day')).toHaveLength(30)
    expect(bucketKeys(month.start, month.end, 'day').at(-1)).toBe('2026-10-17')
  })

  it('formats bucket labels without drifting by the viewer timezone', () => {
    expect(formatBucketTick('2026-10-17T01:00', 'hour')).toBe('01:00')
    expect(formatBucketTick('2026-10-17', 'day')).toBe('17 Oct')
    expect(formatBucketLong('2026-10-17', 'day')).toBe('Sat 17 Oct')
    expect(formatBucketLong('2026-10-17T01:00', 'hour')).toBe('Sat 17 Oct, 01:00')
  })
})

describe('computeDelta', () => {
  it('reports the percentage change and direction', () => {
    expect(computeDelta(150, 100)).toEqual({ pct: 50, direction: 'up' })
    expect(computeDelta(75, 100)).toEqual({ pct: -25, direction: 'down' })
    expect(computeDelta(10, 10)).toEqual({ pct: 0, direction: 'flat' })
  })

  it('handles an empty or missing previous period', () => {
    expect(computeDelta(5, 0)).toEqual({ pct: null, direction: 'new' })
    expect(computeDelta(0, 0)).toEqual({ pct: 0, direction: 'flat' })
    expect(computeDelta(5, null)).toEqual({ pct: null, direction: 'flat' })
  })
})

describe('summarizeSeries', () => {
  it('finds the peak, total and average', () => {
    expect(summarizeSeries([{ key: 'a', value: 2 }, { key: 'b', value: 9 }, { key: 'c', value: 1 }])).toEqual({
      total: 12, average: 4, peakKey: 'b', peakValue: 9,
    })
  })

  it('has no peak when everything is zero or empty', () => {
    expect(summarizeSeries([{ key: 'a', value: 0 }]).peakKey).toBeNull()
    expect(summarizeSeries([])).toEqual({ total: 0, average: 0, peakKey: null, peakValue: 0 })
  })
})

describe('formatRelativeTime', () => {
  it('rounds to seconds, minutes and hours', () => {
    const now = new Date('2026-10-17T00:10:00Z')
    expect(formatRelativeTime(new Date('2026-10-17T00:09:58Z'), now)).toBe('just now')
    expect(formatRelativeTime(new Date('2026-10-17T00:09:30Z'), now)).toBe('30s ago')
    expect(formatRelativeTime(new Date('2026-10-17T00:05:00Z'), now)).toBe('5m ago')
    expect(formatRelativeTime(new Date('2026-10-16T22:00:00Z'), now)).toBe('2h ago')
  })
})
