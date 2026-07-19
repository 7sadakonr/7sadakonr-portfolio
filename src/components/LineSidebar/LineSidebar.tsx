import { useRef, useState, useCallback, useEffect, CSSProperties } from 'react';
import './LineSidebar.css';

type Falloff = 'linear' | 'smooth' | 'sharp';

export interface LineSidebarItem {
  label: string;
  description?: string;
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
  activeIndex?: number | null; // Added controlled prop
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
      className={`line-sidebar${showMarker ? ' line-sidebar--markers' : ''}${scaleTick ? ' line-sidebar--scale-tick' : ''}${className ? ` ${className}` : ''}`}
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
          
          return (
          <li
            key={`${label}-${index}`}
            ref={el => {
              itemRefs.current[index] = el;
            }}
            className="line-sidebar__item"
            aria-current={activeIndex === index ? 'true' : undefined}
            onClick={() => handleClick(index, label)}
          >
            {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
            <span className="line-sidebar__label">
              {showIndex && <span className="line-sidebar__index">{String(index + 1).padStart(2, '0')}</span>}
              <div className="line-sidebar__content">
                <span className="line-sidebar__text">{label}</span>
                {description && (
                  <div className="line-sidebar__description-wrapper">
                    <p className="line-sidebar__description">{description}</p>
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
