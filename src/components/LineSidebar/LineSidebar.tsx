import { useRef, useState, useCallback, useEffect, CSSProperties } from 'react';
import './LineSidebar.css';
import { getTechIcon } from '../../features/projects/data/projectTech';

type Falloff = 'linear' | 'smooth' | 'sharp';

export interface LineSidebarItem {
  label: string;
  description?: string;
  tech?: string[];
  liveUrl?: string;
  githubUrl?: string;
}

export interface LineSidebarProps {
  items?: (string | LineSidebarItem)[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number | null;
  activeIndex?: number | null;
  align?: 'left' | 'right';
  onItemClick?: (index: number, label: string) => void;
  className?: string;
}

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: p => p,
  smooth: p => p * p * (3 - 2 * p),
  sharp: p => p * p * p
};

const DEFAULT_ITEMS = [
  'Overview',
  'Components',
  'Animations',
  'Backgrounds',
  'Showcase',
  'Playground',
  'Templates',
  'Changelog',
  'Community',
  'Resources',
  'Documentation',
  'Support'
];

const LineSidebar = ({
  items = DEFAULT_ITEMS,
  accentColor = '#A855F7',
  textColor = '#c4c4c4',
  markerColor = '#6c6c6c',
  showIndex = true,
  showMarker = true,
  proximityRadius = 250,
  maxShift = 30,
  falloff = 'smooth',
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 20,
  fontSize = 1.1,
  smoothing = 100,
  defaultActive = null,
  activeIndex: controlledActiveIndex,
  align = 'right',
  onItemClick,
  className = ''
}: LineSidebarProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(defaultActive);
  const activeIndex = controlledActiveIndex !== undefined ? controlledActiveIndex : internalActiveIndex;
  
  const activeRef = useRef<number | null>(activeIndex);
  const smoothingRef = useRef(smoothing);

  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const items = itemRefs.current;
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty('--effect', value.toFixed(4));
      if (!settled) moving = true;
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      const items = itemRefs.current;
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (!el) continue;
        const center = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop]
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback(
    (index: number, label: string) => {
      if (controlledActiveIndex === undefined) {
        setInternalActiveIndex(index);
      }
      onItemClick?.(index, label);
    },
    [controlledActiveIndex, onItemClick]
  );

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return (
    <nav
      className={`line-sidebar line-sidebar--align-${align}${showMarker ? ' line-sidebar--markers' : ''}${scaleTick ? ' line-sidebar--scale-tick' : ''}${className ? ` ${className}` : ''}`}
      style={
        {
          '--accent-color': accentColor,
          '--text-color': textColor,
          '--marker-color': markerColor,
          '--marker-length': `${markerLength}px`,
          '--marker-gap': `${markerGap}px`,
          '--tick-scale': tickScale,
          '--max-shift': `${maxShift}px`,
          '--item-gap': `${itemGap}px`,
          '--font-size': `${fontSize}rem`,
          '--smoothing': `${smoothing}ms`
        } as CSSProperties
      }
    >
      <ul ref={listRef} className="line-sidebar__list" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        {items.map((item, index) => {
          const label = typeof item === 'string' ? item : item.label;
          const description = typeof item === 'string' ? undefined : item.description;
          const tech = typeof item === 'string' ? undefined : item.tech;
          const liveUrl = typeof item === 'string' ? undefined : item.liveUrl;
          const githubUrl = typeof item === 'string' ? undefined : item.githubUrl;
          const shiftDir = align === 'right' ? 1 : -1;
          
          return (
          <li
            key={`${label}-${index}`}
            ref={el => {
              itemRefs.current[index] = el;
            }}
            className="line-sidebar__item"
            style={{ '--shift-dir': shiftDir } as CSSProperties}
            aria-current={activeIndex === index ? 'true' : undefined}
            onClick={() => handleClick(index, label)}
          >
            {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
            <span className="line-sidebar__label">
              {showIndex && <span className="line-sidebar__index">{String(index + 1).padStart(2, '0')}</span>}
              <div className="line-sidebar__content">
                <span className="line-sidebar__text">{label}</span>
                {(description || (tech && tech.length > 0) || liveUrl || githubUrl) && (
                  <div className="line-sidebar__description-wrapper">
                    <div className="line-sidebar__description-inner">
                      {description && <p className="line-sidebar__description">{description}</p>}

                      {tech && tech.length > 0 && (
                        <div className="line-sidebar__tech-badges">
                          {tech.map((t, i) => {
                            const iconId = getTechIcon(t);

                            return (
                              <div key={i} className="tech-pill" title={t}>
                                {iconId && <img src={`https://skillicons.dev/icons?i=${iconId}`} alt={t} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />}
                                <span>{t}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(liveUrl || githubUrl) && (
                        <div className="line-sidebar__actions">
                            {liveUrl && (
                                <a href={liveUrl} className="project-btn primary" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polygon points="10 8 16 12 10 16 10 8" />
                                    </svg>
                                    Live Demo
                                </a>
                            )}
                            {githubUrl && (
                                <a href={githubUrl} className="project-btn secondary" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </a>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </span>
          </li>
        );
        })}
      </ul>
    </nav>
  );
};

export default LineSidebar;
