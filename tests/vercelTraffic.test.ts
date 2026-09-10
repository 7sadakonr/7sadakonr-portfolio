import { describe, expect, it } from 'vitest'
import { normalizeVisitorSeries } from '../api/vercel-traffic'

describe('normalizeVisitorSeries', () => {
  it('normalizes hourly visitor rows and returns no entries for an empty daily series', () => {
    expect(normalizeVisitorSeries([{ key: '2026-09-11T06:00:00.000Z', visitors: 2 }], 'hour')).toEqual([
      { date: '06:00', visitors: 2 },
    ])
    expect(normalizeVisitorSeries([], 'day')).toEqual([])
  })
})
