import { useEffect, useRef } from 'react';
import './TechMarquee.css';

interface MarqueeRowProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
}

function MarqueeRow({ children, direction = 'left' }: MarqueeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let reqId: number | null = null;
    let progress = 0; // 0 to 1
    let velocity = 0;
    let lastScrollY = window.scrollY;
    let scrollDirectionMult = 1; // 1 for down, -1 for up
    let isVisible = false;
    let isDocHidden = document.hidden;
    
    const dirMult = direction === 'left' ? 1 : -1;
    const baseSpeed = 0.0005; 
    const scrollSpeedMultiplier = 0.00015;

    const loop = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      lastScrollY = scrollY;
      
      if (delta > 0) scrollDirectionMult = 1;
      else if (delta < 0) scrollDirectionMult = -1;
      
      velocity += delta * 0.1;
      velocity *= 0.9; // friction
      
      const absVelocity = Math.abs(velocity);
      const moveAmount = (baseSpeed + (absVelocity * scrollSpeedMultiplier)) * dirMult * scrollDirectionMult;
      
      progress += moveAmount;
      
      if (progress >= 1) progress -= 1;
      if (progress < 0) progress += 1;
      
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(calc( (-50% - 6px) * ${progress} ))`;
      }
      
      if (isVisible && !isDocHidden) {
        reqId = requestAnimationFrame(loop);
      } else {
        reqId = null;
      }
    };
    
    const startLoop = () => {
      if (reqId === null && isVisible && !isDocHidden) {
        lastScrollY = window.scrollY;
        reqId = requestAnimationFrame(loop);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? false;
      if (isVisible) startLoop();
    }, { rootMargin: '50px 0px' });
    
    if (rowRef.current) observer.observe(rowRef.current);
    
    const handleVisibility = () => {
      isDocHidden = document.hidden;
      if (!isDocHidden) startLoop();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (reqId !== null) cancelAnimationFrame(reqId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [direction]);

  return (
    <div className="tech-marquee-row" ref={rowRef}>
      {children}
    </div>
  );
}

export default function TechMarquee() {
  const row1Skills = [
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'js', name: 'JavaScript' },
    { id: 'ts', name: 'TypeScript' },
    { id: 'react', name: 'React' },
    { id: 'nextjs', name: 'Next.js' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'js', name: 'JavaScript' },
    { id: 'ts', name: 'TypeScript' },
    { id: 'react', name: 'React' },
    { id: 'nextjs', name: 'Next.js' }
  ];

  const row2Skills = [
    { id: 'nodejs', name: 'Node.js' },
    { id: 'express', name: 'Express' },
    { id: 'postgres', name: 'PostgreSQL' },
    { id: 'prisma', name: 'Prisma' },
    { id: 'tailwind', name: 'Tailwind' },
    { id: 'nodejs', name: 'Node.js' },
    { id: 'express', name: 'Express' },
    { id: 'postgres', name: 'PostgreSQL' },
    { id: 'prisma', name: 'Prisma' },
    { id: 'tailwind', name: 'Tailwind' }
  ];

  const row3Skills = [
    { id: 'figma', name: 'Figma' },
    { id: 'git', name: 'Git' },
    { id: 'github', name: 'GitHub' },
    { id: 'vscode', name: 'VS Code' },
    { id: 'vercel', name: 'Vercel' },
    { id: 'postman', name: 'Postman' },
    { id: 'figma', name: 'Figma' },
    { id: 'git', name: 'Git' },
    { id: 'github', name: 'GitHub' },
    { id: 'vscode', name: 'VS Code' },
    { id: 'vercel', name: 'Vercel' },
    { id: 'postman', name: 'Postman' }
  ];

  return (
    <div className="tech-marquee-container">
      <MarqueeRow direction="left">
        {row1Skills.map((skill, i) => (
          <div className="tech-pill" title={skill.name} key={`row1-${i}`}>
            <img src={`/tech-icons/${skill.id}.svg`} alt={skill.name} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />
            <span>{skill.name}</span>
          </div>
        ))}
      </MarqueeRow>
      <MarqueeRow direction="right">
        {row2Skills.map((skill, i) => (
          <div className="tech-pill" title={skill.name} key={`row2-${i}`}>
            <img src={`/tech-icons/${skill.id}.svg`} alt={skill.name} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />
            <span>{skill.name}</span>
          </div>
        ))}
      </MarqueeRow>
      <MarqueeRow direction="left">
        {row3Skills.map((skill, i) => (
          <div className="tech-pill" title={skill.name} key={`row3-${i}`}>
            <img src={`/tech-icons/${skill.id}.svg`} alt={skill.name} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />
            <span>{skill.name}</span>
          </div>
        ))}
      </MarqueeRow>
    </div>
  );
}
