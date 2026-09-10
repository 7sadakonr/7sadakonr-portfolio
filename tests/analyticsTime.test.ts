import { describe, expect, it } from 'vitest'
import { formatAnalyticsDate, hourBucket, rollingHourKeys } from '../src/features/admin/hooks/analyticsTime'

describe('analytics UTC time buckets', () => {
  it('normalizes offsets before creating bucket identity and visible chart labels', () => {
    expect(hourBucket('2026-09-11T06:45:00+07:00')).toBe('2026-09-10T23:00:00.000Z')
    expect(formatAnalyticsDate('2026-09-11T06:45:00+07:00', true)).toBe('23:45')
    expect(formatAnalyticsDate('2026-09-11T06:45:00+07:00', false)).toBe('Sep 10')
  })

  it('creates 24 chronological buckets across a year boundary', () => {
    const keys = rollingHourKeys(new Date('2025-12-31T01:30:00Z'), new Date('2026-01-01T01:30:00Z'))
    expect(keys).toHaveLength(24)
    expect(keys[0]).toBe('2025-12-31T02:00:00.000Z')
    expect(keys[21]).toBe('2025-12-31T23:00:00.000Z')
    expect(keys[22]).toBe('2026-01-01T00:00:00.000Z')
    expect(keys[23]).toBe('2026-01-01T01:00:00.000Z')
  })
})
