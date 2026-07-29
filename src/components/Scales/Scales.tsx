import React from 'react'

export interface ScalesProps {
    orientation?: 'horizontal' | 'vertical' | 'diagonal'
    size?: number
    className?: string
    color?: string
}

// Official Aceternity Scales component, adapted only from Tailwind utilities to inline styles.
const Scales = ({
    orientation = 'diagonal',
    size = 10,
    className,
    color,
}: ScalesProps) => {
    const getGradientAngle = () => {
        switch (orientation) {
            case 'horizontal':
                return '0deg'
            case 'vertical':
                return '90deg'
            case 'diagonal':
            default:
                return '315deg'
        }
    }

    return (
        <div
            className={className}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                '--scales-size': `${size}px`,
                '--scales-angle': getGradientAngle(),
                '--pattern-scales': color ?? 'rgba(255, 255, 255, 0.1)',
            } as React.CSSProperties}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'repeating-linear-gradient(var(--scales-angle), var(--pattern-scales) 0, var(--pattern-scales) 1px, transparent 0, transparent 50%)',
                    backgroundSize: 'var(--scales-size) var(--scales-size)',
                }}
            />
        </div>
    )
}

export default Scales

