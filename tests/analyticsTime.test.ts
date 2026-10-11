import { describe, expect, it } from 'vitest'
import { formatAnalyticsDate, formatUtcHourLabel, hourBucket, localDateKey, rollingHourKeys } from '../src/features/admin/hooks/analyticsTime'

describe('analytics time buckets', () => {
  it('normalizes offsets before creating bucket identity and visible chart labels', () => {
    expect(hourBucket('2026-09-11T06:45:00+07:00')).toBe('2026-09-10T23:00:00.000Z')
    expect(formatUtcHourLabel('2026-09-11T06:45:00+07:00')).toBe('23:45')
  })

  it('formats chart labels and day keys in the viewer timezone', () => {
    const instant = new Date('2026-09-11T06:45:00+07:00')
    const pad = (value: number) => String(value).padStart(2, '0')
    expect(formatAnalyticsDate(instant.toISOString(), true)).toBe(`${pad(instant.getHours())}:${pad(instant.getMinutes())}`)
    expect(localDateKey(instant)).toBe(`${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}`)
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
