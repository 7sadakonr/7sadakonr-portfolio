import { useEffect, useState } from 'react';
import './HeroPage.css'
import heroPng from '../assets/img/logo-7m.png';
import AnimatedContent from '../components/Animation/AnimatedContent';
import { scrollToTarget } from '../components/SmoothScroll/scrollController';

const HeroPage = () => {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    // Trigger animation in the next frame to avoid arbitrary 100ms delay and improve LCP
    const frameId = requestAnimationFrame(() => {
      setIsShown(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const heroImg = heroPng;

  const handleExploreClick = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      scrollToTarget(aboutSection, { offset: 0 });
    }
  };

  return (
    <main className="hero-section">
      <AnimatedContent
        distance={150}
        direction="vertical"
        reverse={false}
        duration={1.2}
        ease="power3.out"
        initialOpacity={0.2}
        scale={1}
        threshold={0.2}
        delay={0.1}
      >
        <div className={`hero-content t-stagger ${isShown ? 'is-shown' : ''}`}>
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="main-title t-stagger-line t-stagger-line--1">
              Welcome to my <span className="gradient-text">
                <span className="gradient-text-glow">portfolio</span>
                <span className="gradient-text-content t-shimmer" data-text="portfolio">portfolio</span>
              </span>
            </h1>
            <p className="subtitle t-stagger-line t-stagger-line--2">
              Hi, I'm Jetsadakonr Muangwichit, a Computer Science Student.
            </p>
          </div>
          <img
            src={heroImg}
            alt="Hero"
            width="519"
            height="403"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="t-stagger-line t-stagger-line--3"
          />
          <button className="explore-button t-stagger-line t-stagger-line--4" onClick={handleExploreClick}>
            <span className="explore-text">Explore</span>
            <div className="explore-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>
      </AnimatedContent>
    </main>
  )
}

export default HeroPage
