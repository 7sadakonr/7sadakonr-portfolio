import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import './HeroPage.css'
import { scrollToTarget } from '../components/SmoothScroll/scrollController';
import TextReveal from '../components/Animation/TextReveal';

interface HeroPageProps {
  effectsEnabled?: boolean;
  onCriticalReady?: () => void;
}

const BackgroundBeams = lazy(() => import('../components/BackgroundBeams/BackgroundBeams'))

const HeroPage = ({ effectsEnabled = true, onCriticalReady }: HeroPageProps) => {
  const heroRef = useRef<HTMLElement>(null);
  const criticalReadyRef = useRef(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { rootMargin: '100px 0px', threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    const updateMotion = () => setPrefersReducedMotion(motionQuery.matches);
    document.addEventListener('visibilitychange', updateVisibility);
    motionQuery.addEventListener('change', updateMotion);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      motionQuery.removeEventListener('change', updateMotion);
    };
  }, []);

  const isEffectActive =
    effectsEnabled &&
    isImageReady &&
    isInView &&
    isDocumentVisible &&
    !prefersReducedMotion;

  const markCriticalReady = () => {
    if (criticalReadyRef.current) return;
    criticalReadyRef.current = true;
    setIsImageReady(true);
    onCriticalReady?.();
  };

  const handleExploreClick = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      scrollToTarget(aboutSection, { offset: 0 });
    }
  };

  return (
    <main ref={heroRef} className="hero-section">
      <div className="hero-scales-container">
        {isEffectActive && (
          <Suspense fallback={null}>
            <BackgroundBeams enabled />
          </Suspense>
        )}
      </div>

      <div className="hero-content is-revealed">
        <div className="hero-text-container">
          <h1 className="main-title">
            <TextReveal
              as="div"
              className="hero-headline-reveal"
              isRevealed
              delay={0.1}
              stagger={0.075}
            >
              <span>Welcome</span>
              <span>to</span>
              <span>my</span>
              <span className="gradient-text">
                <span className="gradient-text-glow">portfolio</span>
                <span className={`gradient-text-content t-shimmer${isEffectActive ? ' is-active' : ''}`} data-text="portfolio">portfolio</span>
              </span>
            </TextReveal>
          </h1>

          <div className="subtitle-container">
            <TextReveal
              as="p"
              className="subtitle"
              text="Hi, I'm Jetsadakorn Muangwichit, a Computer Science Student."
              isRevealed
              delay={0.38}
              stagger={0.03}
            />
          </div>
        </div>

        <div className="hero-mask-line hero-img-mask">
          <picture>
            <source
              type="image/avif"
              srcSet="/hero-120.avif 120w, /hero-160.avif 160w, /hero-240.avif 240w, /hero-320.avif 320w, /hero-360.avif 360w, /hero-480.avif 480w"
              sizes="(max-width: 480px) 120px, (max-width: 768px) 320px, 300px"
            />
            <source
              type="image/webp"
              srcSet="/hero-120.webp 120w, /hero-160.webp 160w, /hero-240.webp 240w, /hero-320.webp 320w, /hero-360.webp 360w, /hero-480.webp 480w"
              sizes="(max-width: 480px) 120px, (max-width: 768px) 320px, 300px"
            />
            <img
              src="/hero-480.webp"
              alt="Hero"
              width="519"
              height="403"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onLoad={markCriticalReady}
              onError={markCriticalReady}
              className="hero-reveal-line hero-reveal--3"
            />
          </picture>
        </div>

        <div className="hero-mask-line hero-btn-mask">
          <button className={`explore-button hero-reveal-line hero-reveal--4${isEffectActive ? ' is-effect-active' : ''}`} onClick={handleExploreClick}>
            <span className="explore-text">Explore</span>
            <div className="explore-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </main>
  )
}

export default HeroPage
