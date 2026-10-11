const HOUR_MS = 60 * 60 * 1000

export function hourBucket(timestamp: string | Date): string {
  const date = new Date(timestamp)
  return Number.isFinite(date.getTime())
    ? new Date(Math.floor(date.getTime() / HOUR_MS) * HOUR_MS).toISOString() : ''
}

export function rollingHourKeys(from: Date, to: Date): string[] {
  const last = Math.floor(to.getTime() / HOUR_MS) * HOUR_MS
  const first = Math.max(Math.floor(from.getTime() / HOUR_MS) * HOUR_MS, last - 23 * HOUR_MS)
  return Array.from({ length: Math.floor((last - first) / HOUR_MS) + 1 }, (_, index) =>
    new Date(first + index * HOUR_MS).toISOString())
}

export function formatAnalyticsHour(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

/** Legacy RPC rows labelled hours as UTC "HH:00" strings. */
export function formatUtcHourLabel(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

export function formatAnalyticsDate(timestamp: string, hourly: boolean): string {
  return hourly ? formatAnalyticsHour(timestamp) : new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

export function getAnalyticsTimeZoneLabel(): string {
  return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value ?? 'local'
}

export function getAnalyticsTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/** YYYY-MM-DD of the given instant in the viewer's timezone. */
export function localDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}
