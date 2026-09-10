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
    timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

export function formatAnalyticsDate(timestamp: string, hourly: boolean): string {
  return hourly ? formatAnalyticsHour(timestamp) : new Date(timestamp).toLocaleDateString('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric',
  })
}
