import { useState } from 'react'

export interface CountryFlagProps {
  code?: string | null
  showCode?: boolean
  showName?: boolean
  size?: 'sm' | 'md'
  className?: string
}

function getCountryName(cleanCode: string): string {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' })
    return dn.of(cleanCode) || cleanCode
  } catch {
    return cleanCode
  }
}

export const CountryFlag = ({
  code,
  showCode = false,
  showName = false,
  size = 'sm',
  className = '',
}: CountryFlagProps) => {
  const [hasError, setHasError] = useState(false)

  const cleanCode = typeof code === 'string' ? code.trim().toUpperCase() : ''
  const isValidIso = /^[A-Z]{2}$/.test(cleanCode)

  if (!cleanCode || !isValidIso) {
    return (
      <span className={`analytics-flag-badge analytics-flag-unknown ${className}`.trim()} title="Unknown location">
        <span className="analytics-flag-fallback-icon" aria-hidden="true">🌐</span>
        {showCode && <span className="analytics-flag-code">{code || 'Unknown'}</span>}
      </span>
    )
  }

  const countryName = getCountryName(cleanCode)
  const tooltip = `${countryName} (${cleanCode})`
  const lower = cleanCode.toLowerCase()

  const width = size === 'md' ? 20 : 16
  const height = size === 'md' ? 15 : 12

  return (
    <span
      className={`analytics-flag-badge analytics-flag-badge--${size} ${className}`.trim()}
      title={tooltip}
    >
      {!hasError ? (
        <img
          src={`https://flagcdn.com/24x18/${lower}.png`}
          srcSet={`https://flagcdn.com/48x36/${lower}.png 2x`}
          width={width}
          height={height}
          alt={`Flag of ${countryName}`}
          className={`analytics-flag-img analytics-flag-img--${size}`}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="analytics-flag-fallback-icon" aria-hidden="true">🌐</span>
      )}
      {showCode && <span className="analytics-flag-code">{cleanCode}</span>}
      {showName && <span className="analytics-flag-name">{countryName}</span>}
    </span>
  )
}

export default CountryFlag
