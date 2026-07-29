const AsiaMap = () => (
    <div className="asia-map-wrapper" role="img" aria-label="World map with a marker in Thailand">
        <div className="asia-map-pointer" style={{ transform: 'translateZ(1px)' }}>
            <div className="asia-map-pointer-inner">
                {/* Text Box */}
                <div className="asia-map-pill">
                    We are here
                    <span className="asia-map-pill-glow"></span>
                </div>

                {/* 3D Pulsing Ripples */}
                <div className="asia-map-ripples">
                    <div className="asia-map-ripple ripple-1"></div>
                    <div className="asia-map-ripple ripple-2"></div>
                    <div className="asia-map-ripple ripple-3"></div>
                </div>

                {/* Vertical Line */}
                <div className="asia-map-beam blur-beam"></div>
                <div className="asia-map-beam"></div>

                {/* Bottom Dot */}
                <div className="asia-map-dot-blur"></div>
                <div className="asia-map-dot"></div>
            </div>
        </div>

        <img src="/aceternity-world.svg" alt="world map" className="asia-map-image" loading="lazy" decoding="async" />
    </div>
)

export default AsiaMap;
