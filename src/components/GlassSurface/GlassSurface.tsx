import React, { useRef, useMemo, useEffect, useId } from 'react';
import './GlassSurface.css';

type ChannelSelector = 'R' | 'G' | 'B' | 'A';

interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  frostBlur?: number;
  frostGrain?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: ChannelSelector;
  yChannel?: ChannelSelector;
  mixBlendMode?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 5,
  frostBlur = 0,
  frostGrain = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -200,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {},
  onClick
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  // Calculate filter region padding based on displace value
  // Gaussian blur needs ~3σ padding on each side to avoid edge clipping
  const filterPadding = useMemo(() => {
    const w = typeof width === 'number' ? width : 400;
    const h = typeof height === 'number' ? height : 200;
    // 3σ in percentage of element dimensions, with a minimum of 10%
    const xPad = Math.max(10, Math.ceil((displace * 3) / w * 100) + 5);
    const yPad = Math.max(10, Math.ceil((displace * 3) / h * 100) + 5);
    return { xPad, yPad };
  }, [displace, width, height]);

  const generateDisplacementMap = () => {
    // Exact pixel dimensions for perfect rx and blur mapping
    const w = typeof width === 'number' ? width : 400;
    const h = typeof height === 'number' ? height : 200;
    const edgeSize = Math.min(w, h) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateDisplacementMap = () => {
    feImageRef.current?.setAttribute('href', generateDisplacementMap());
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode
  ]);

  const supportsSVGFilters = () => {
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    if (isWebkit || isFirefox) {
      return false;
    }

    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;
    return div.style.backdropFilter !== '';
  };

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--glass-frost-blur': `${frostBlur}px`,
    '--filter-id': `url(#${filterId})`
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${supportsSVGFilters() ? 'glass-surface--svg' : 'glass-surface--fallback'} ${className}`}
      style={containerStyle}
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Layer 1: Native CSS for saturation */}
      {supportsSVGFilters() && (
        <div 
          className="glass-surface__layer-blur"
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            backdropFilter: `blur(${frostBlur}px) saturate(${saturation})`,
            WebkitBackdropFilter: `blur(${frostBlur}px) saturate(${saturation})`,
            zIndex: -3
          }} 
        />
      )}

      {/* Layer 2: SVG Chromatic Aberration Filter layered ON TOP of the blur */}
      {supportsSVGFilters() && (
        <div 
          className="glass-surface__layer-svg"
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            backdropFilter: `url(#${filterId})`,
            WebkitBackdropFilter: `url(#${filterId})`,
            zIndex: -2,
            clipPath: 'inset(0 round inherit)',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            willChange: 'transform'
          }} 
        />
      )}

      {/* Layer 2.5: Frost Grain Overlay */}
      {frostGrain > 0 && (
        <div
          className="glass-surface__layer-grain"
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            opacity: frostGrain,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'soft-light',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />
      )}

      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter 
            id={filterId} 
            colorInterpolationFilters="sRGB" 
            x={`-${filterPadding.xPad}%`} 
            y={`-${filterPadding.yPad}%`} 
            width={`${100 + filterPadding.xPad * 2}%`} 
            height={`${100 + filterPadding.yPad * 2}%`}
          >
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen" />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
