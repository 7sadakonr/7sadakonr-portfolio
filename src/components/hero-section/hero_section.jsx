import { useState, useEffect } from 'react';
import './hero_section.css'
import hero from '../../assets/img/hero.svg';
import heroPng from '../../assets/img/logo-7m.png';
import AnimatedContent from '../Animation/AnimatedContent.jsx';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  // Detect Apple devices for PNG fallback (SVG has issues on iOS)
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    setIsApple(isIOS || isIPadOS);
  }, []);

  const heroImg = isApple ? heroPng : hero;

  const handleExploreClick = () => {
    navigate('/about');
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
        <div className="hero-content">
          <h1 className="main-title">
            Welcome to my <span className="gradient-text">
              <span className="gradient-text-glow">portfolio</span>
              <span className="gradient-text-content">portfolio</span>
            </span>
          </h1>
          <p className="subtitle">
            Hi, I'm Jetsadakonr Muangwichit, a Computer Science Student.
          </p>
          <img src={heroImg} alt="Hero" />
          <button className="explore-button" onClick={handleExploreClick}>
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

export default HeroSection