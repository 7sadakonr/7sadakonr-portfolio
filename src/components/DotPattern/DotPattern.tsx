import { useId, type SVGProps } from 'react'

type DotPatternProps = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
    x?: number
    y?: number
    cx?: number
    cy?: number
    cr?: number
}

const DotPattern = ({
    width = 16,
    height = 16,
    x = 0,
    y = 0,
    cx = 1,
    cy = 1,
    cr = 1,
    className = '',
    ...props
}: DotPatternProps) => {
    const patternId = `dot-pattern-${useId().replace(/:/g, '')}`

    return (
        <svg
            aria-hidden="true"
            className={`dot-pattern ${className}`.trim()}
            {...props}
        >
            <defs>
                <pattern
                    id={patternId}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    patternContentUnits="userSpaceOnUse"
                    x={x}
                    y={y}
                >
                    <circle cx={cx} cy={cy} r={cr} />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    )
}

export default DotPattern
