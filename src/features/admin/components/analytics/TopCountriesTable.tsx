import { useMemo } from 'react'
import CountryFlag from './CountryFlag'
import type { TopCountryRow } from '../../hooks/useAnalytics'

interface TopCountriesTableProps {
  data: TopCountryRow[]
  isLoading: boolean
}

function getCountryName(cleanCode: string): string {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' })
    return dn.of(cleanCode) || cleanCode
  } catch {
    return cleanCode
  }
}

const TopCountriesTable = ({ data, isLoading }: TopCountriesTableProps) => {
  const totalCount = useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr.count || 0), 0)
  }, [data])

  return (
    <div className="analytics-card-panel">
      <div className="analytics-panel-header">
        <div>
          <h2 className="analytics-section-title">Geographic Distribution</h2>
          <p className="analytics-section-subtitle">
            Aggregate visitor origin by country (privacy-safe, no IP or visitor ID stored)
          </p>
        </div>
      </div>

      <div className="analytics-table-responsive">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Country</th>
              <th className="text-right">Share</th>
              <th className="text-right">Requests / Views</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin" />
                    <span>Loading geographic data…</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-zinc-400">
                  No geographic data recorded yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              data.map((row) => {
                const countryCode = row.country || 'Unknown'
                const countryName = countryCode !== 'Unknown' ? getCountryName(countryCode) : 'Unknown'
                const percentage = totalCount > 0 ? ((row.count / totalCount) * 100).toFixed(1) : '0.0'

                return (
                  <tr key={countryCode}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <CountryFlag code={countryCode} size="md" />
                        <span className="font-semibold text-white">{countryName}</span>
                        {countryCode !== 'Unknown' && (
                          <span className="text-[11px] font-mono text-zinc-400">({countryCode})</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, parseFloat(percentage)))}%` }}
                          />
                        </div>
                        <span className="font-mono text-emerald-400 text-xs font-semibold">{percentage}%</span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-white font-semibold">
                      {row.count.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TopCountriesTable
