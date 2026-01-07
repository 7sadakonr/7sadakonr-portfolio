import React from 'react'
import './navigation_indicator.css'

const NavigationIndicator = ({ direction = 'down', progress = 0, targetPage = '' }) => {
    const isVisible = progress > 0
    const isAlmostReady = progress >= 0.8

    return (
        <div
            className={`navigation-indicator ${direction} ${isVisible ? 'visible' : ''} ${isAlmostReady ? 'almost-ready' : ''}`}
        >
            <div className="navigation-indicator-content">
                <svg className="navigation-indicator-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
                <span className="navigation-indicator-text">
                    {direction === 'up' ? `↑ Go to ${targetPage}` : `↓ Go to ${targetPage}`}
                </span>
            </div>
            <div className="navigation-indicator-progress">
                <div
                    className="navigation-indicator-progress-bar"
                    style={{ width: `${Math.min(progress * 100, 100)}%` }}
                />
            </div>
        </div>
    )
}

export default NavigationIndicator
