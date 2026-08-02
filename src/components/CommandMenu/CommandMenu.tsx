import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { pauseScroll, resumeScroll } from '../SmoothScroll/scrollController';
import './CommandMenu.css';

export interface CommandMenuItem {
  id: string;
  path: string;
  label: string;
  category: string;
  keywords: string;
  targetId?: string;
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: CommandMenuItem[];
  activePath: string;
  handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string, targetId?: string) => void;
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  menuItems,
  activePath,
  handleNavClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingText, setClearingText] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const pholdRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
  }, []);

  const num = (name: string, fb: number) => {
    const str = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!str) return fb;
    let v = parseFloat(str);
    if (Number.isNaN(v)) return fb;
    if (str.endsWith('s') && !str.endsWith('ms')) v *= 1000;
    return Number.isFinite(v) ? v : fb;
  };

  const bezier = (str: string) => {
    const m = String(str).match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
    if (!m) return (t: number) => t;
    const [x1, y1, x2, y2] = m.slice(1).map(parseFloat);
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return (t: number) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let s = t;
      for (let i = 0; i < 8; i++) {
        const dx = ((ax * s + bx) * s + cx) * s - t;
        const d = (3 * ax * s + 2 * bx) * s + cx;
        if (Math.abs(dx) < 1e-6 || d === 0) break;
        s -= dx / d;
      }
      return ((ay * s + by) * s + cy) * s;
    };
  };

  const buildGlow = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !inputRef.current || !wrapRef.current) return "";
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    
    ctx.font = getComputedStyle(inputRef.current).font;
    const rgb = "255,255,255";
    const w = wrapRef.current.clientWidth || 280;
    const padLeft = 52; 
    const spread = num("--glow-spread", 1.5);
    const layers: string[] = [];
    let x = 0;
    
    text.split(/(\s+)/).forEach((seg) => {
      const segW = ctx.measureText(seg).width;
      if (seg.trim()) {
        const cx = padLeft + x + segW / 2;
        const hw = Math.max(segW * 0.45, 8) * spread;
        [[0, 0.8, 7, 0.22], [hw * 0.45, 0.55, 8, 0.18],
         [-hw * 0.4, 0.65, 6, 0.16], [hw * 0.15, 0.9, 5, 0.14]]
          .forEach(([dx, rwm, rh, a]) => {
            const lx = (((cx + dx) / w) * 100).toFixed(2);
            layers.push(
              `radial-gradient(ellipse ${Math.max(hw * rwm, 2).toFixed(1)}px ${rh}px at ${lx}% 100%, rgba(${rgb},${a}), transparent)`
            );
          });
      }
      x += segW;
    });
    return layers.join(", ");
  };

  const clearWithAnimation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isClearing || !searchTerm || !inputRef.current || !mirrorRef.current || !pholdRef.current || !glowRef.current) return;
    setIsClearing(true);
    
    const mirror = mirrorRef.current;
    const phold = pholdRef.current;
    const glow = glowRef.current;
    
    const keepFocus = document.activeElement === inputRef.current;
    const textToClear = searchTerm.replace(/ /g, "\u00a0");
    setClearingText(textToClear);
    mirror.textContent = textToClear;
    
    const total = num("--clear-dur", 1000);
    const outDur = num("--clear-out-dur", 400);
    const inDur  = num("--clear-in-dur", 400);
    const outFly = num("--clear-out-fly", 12);
    const inFly  = num("--clear-in-fly", 12);
    const blur   = num("--clear-blur", 2);
    const delay  = num("--glow-delay", 50);
    const peakAt = num("--glow-peak-at", 0.15);
    const gOp    = num("--glow-opacity", 0.85); 
    
    const rootStyle = getComputedStyle(document.documentElement);
    const easeOut = bezier(rootStyle.getPropertyValue("--clear-out-ease"));
    const easeIn  = bezier(rootStyle.getPropertyValue("--clear-in-ease"));
    
    setSearchTerm("");
    
    glow.style.background = buildGlow(mirror.textContent);
    glow.style.opacity = "0";
    phold.style.transform = `translateY(-${inFly}px)`;
    phold.style.opacity = "0.9";
    phold.style.filter = `blur(${blur}px)`;
    
    const t0 = performance.now();
    
    const tick = (now: number) => {
      const el = now - t0;
      const eo = easeOut(Math.min(1, el / outDur));
      mirror.style.transform = `translateY(${(eo * outFly).toFixed(1)}px)`;
      mirror.style.opacity = (1 - eo).toFixed(3);
      mirror.style.filter = `blur(${(eo * blur).toFixed(1)}px)`;

      const ei = easeIn(Math.min(1, el / inDur));
      phold.style.transform = `translateY(${(-inFly + ei * inFly).toFixed(1)}px)`;
      phold.style.opacity = (0.9 + ei * 0.1).toFixed(3);
      phold.style.filter = `blur(${(blur - ei * blur).toFixed(1)}px)`;

      let g = 0;
      if (el > delay) {
        const gp = Math.min(1, (el - delay) / Math.max(1, total - delay));
        g = gp < peakAt ? gp / peakAt : 1 - (gp - peakAt) / (1 - peakAt);
      }
      glow.style.opacity = (g * gOp).toFixed(3);

      if (el < total) {
        requestAnimationFrame(tick);
      } else {
        mirror.style.cssText = "";
        phold.style.cssText = "";
        setClearingText("");
        glow.style.opacity = "0";
        glow.style.background = "";
        setIsClearing(false);
        if (keepFocus) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      }
    };
    
    requestAnimationFrame(tick);
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsMounted(false);
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';
    resumeScroll();
    const closeMs = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--modal-close-dur")
    ) || 150;
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, closeMs);
  };

  // Filter items based on search term
  const filteredItems = menuItems.filter(item => {
    const term = searchTerm.toLowerCase();
    return item.label.toLowerCase().includes(term) || item.keywords.toLowerCase().includes(term);
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      pauseScroll();
      setSearchTerm('');
      const currentIdx = menuItems.findIndex(item => item.path === activePath && item.category === 'Navigation');
      setSelectedIndex(currentIdx !== -1 ? currentIdx : 0);
      
      setTimeout(() => {
        setIsMounted(true);
      }, 50);

      // Focus input after animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        resumeScroll();
      };
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      resumeScroll();
      setIsMounted(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleItemSelect = (e: React.MouseEvent<HTMLAnchorElement> | { preventDefault: () => void }, item: CommandMenuItem) => {
    e.preventDefault();
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';
    resumeScroll();
    handleNavClick(e as React.MouseEvent<HTMLAnchorElement>, item.path, item.targetId);
    handleClose();
  };

  // Handle keyboard navigation inside the menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          const item = filteredItems[selectedIndex];
          if (item) {
            handleItemSelect({ preventDefault: () => {} }, item);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleNavClick, onClose]);

  if (!isOpen && !isClosing) return null;

  const stateClass = isMounted ? 'is-open' : isClosing ? 'is-closing' : '';

  return (
    <div className={`command-menu-overlay ${isMounted ? 'open' : ''}`} onClick={handleClose} data-lenis-prevent>
      <div className="command-menu-bg" aria-hidden="true" />
      <div 
        className={`command-menu-modal ${stateClass}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="command-search-row">
          <div ref={wrapRef} className={`command-search-wrapper t-modal t-clear ${stateClass} ${searchTerm ? 'has-value' : ''} ${isClearing ? 'is-clearing' : ''}`}>
            <svg className="command-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              ref={inputRef}
              type="text" 
              className="command-search-input" 
              placeholder=""
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIndex(0);
              }}
            />
            <div className="t-clear-mirror" aria-hidden="true" ref={mirrorRef}>{isClearing ? clearingText : searchTerm.replace(/ /g, "\u00a0")}</div>
            <div className="t-clear-placeholder" aria-hidden="true" ref={pholdRef}>Type a command or search...</div>
            <div className="t-clear-glow" aria-hidden="true" ref={glowRef}></div>
            {searchTerm && (
              <button className="t-clear-btn" aria-label="Clear" onPointerDown={(e) => { if (document.activeElement === inputRef.current) e.preventDefault(); }} onClick={clearWithAnimation}>×</button>
            )}
          </div>
          <button className={`command-close-btn t-modal ${stateClass}`} onClick={handleClose} aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className={`command-menu-content t-modal ${stateClass}`}>
          <div className="command-menu-content-inner">
            {filteredItems.length > 0 ? (
            ['Navigation', 'Content', 'Projects'].map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div className="command-group" key={cat}>
                  <div className="command-group-heading">{cat}</div>
                  <ul className="command-list">
                    {catItems.map((item) => {
                      const index = filteredItems.findIndex(fi => fi.id === item.id);
                      const isActivePath = activePath === item.path && item.category === 'Navigation';
                      const isSelected = index === selectedIndex;
                      return (
                        <li key={item.id} className="command-item-wrapper">
                          <NavLink
                            to={item.path}
                            className={`command-item ${isSelected ? 'selected' : ''} ${isActivePath ? 'active-path' : ''}`}
                            onClick={(e) => handleItemSelect(e, item)}
                            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setSelectedIndex(index); }}
                          >
                            <div className="command-item-left">
                              {item.label === 'HOME' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
                              {item.label === 'ABOUT' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                              {item.label === 'PROJECTS' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>}
                              {item.label === 'CONTACT' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}
                              {item.category === 'Content' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg>}
                              {item.category === 'Projects' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>}
                              
                              <span className="command-item-label">{item.category === 'Navigation' ? `Go to ${item.label}` : item.label}</span>
                            </div>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          ) : (
            <div className="command-empty">
              No results found.
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandMenu;
