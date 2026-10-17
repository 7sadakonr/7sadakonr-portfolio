import Panel from '../ui/Panel'
import CountryFlag from './CountryFlag'
import type { Traffic, TrafficStatus } from '../../hooks/useAnalytics'

interface CountriesPanelProps {
  traffic: Traffic | null
  status: TrafficStatus
  isLoading: boolean
}

const CountriesPanel = ({ traffic, status, isLoading }: CountriesPanelProps) => {
  const rows = traffic?.topCountries ?? []
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  const max = Math.max(1, ...rows.map((row) => row.count))
  const unavailable = status === 'unconfigured' || status === 'error'

  return (
    <Panel
      title="Countries"
      description="Visitors by country. Source: Vercel Web Analytics."
      isLoading={isLoading && status === 'loading'}
      empty={unavailable
        ? { title: status === 'unconfigured' ? 'Vercel Web Analytics is not connected' : 'Country data is unavailable' }
        : rows.length === 0 ? { title: 'No country data yet' } : null}
    >
      <ul className="adm-rank">
        {rows.map((row) => (
          <li key={row.country} className="adm-rank__item">
            <span className="adm-rank__label"><CountryFlag code={row.country} showName /></span>
            <span className="adm-bar" aria-hidden="true"><span className="adm-bar__fill" style={{ width: `${(row.count / max) * 100}%` }} /></span>
            <span className="adm-num">{row.count.toLocaleString()}<span className="adm-muted"> · {total > 0 ? Math.round((row.count / total) * 100) : 0}%</span></span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export default CountriesPanel
