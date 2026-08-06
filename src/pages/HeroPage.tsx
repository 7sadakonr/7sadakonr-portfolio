import './HeroPage.css'
import heroWebp from '../assets/img/logo-7m.webp';
import { scrollToTarget } from '../components/SmoothScroll/scrollController';
import BackgroundBeams from '../components/BackgroundBeams/BackgroundBeams';
import TextReveal from '../components/Animation/TextReveal';

interface HeroPageProps {
  isRevealed?: boolean;
}

const HeroPage = ({ isRevealed = true }: HeroPageProps) => {
  const heroImg = heroWebp;

  const handleExploreClick = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      scrollToTarget(aboutSection, { offset: 0 });
    }
  };

  return (
    <main className="hero-section">
      <div className="hero-scales-container">
        <BackgroundBeams />
      </div>

      <div className={`hero-content ${isRevealed ? 'is-revealed' : 'is-hidden'}`}>
        <div className="hero-text-container">
          <h1 className="main-title">
            <TextReveal
              as="div"
              className="hero-headline-reveal"
              isRevealed={isRevealed}
              delay={0.1}
              stagger={0.075}
            >
              <span>Welcome</span>
              <span>to</span>
              <span>my</span>
              <span className="gradient-text">
                <span className="gradient-text-glow">portfolio</span>
                <span className="gradient-text-content t-shimmer" data-text="portfolio">portfolio</span>
              </span>
            </TextReveal>
          </h1>

          <div className="subtitle-container">
            <TextReveal
              as="p"
              className="subtitle"
              text="Hi, I'm Jetsadakorn Muangwichit, a Computer Science Student."
              isRevealed={isRevealed}
              delay={0.38}
              stagger={0.03}
            />
          </div>
        </div>

        <div className="hero-mask-line hero-img-mask">
          <img
            src={heroImg}
            alt="Hero"
            width="519"
            height="403"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="hero-reveal-line hero-reveal--3"
          />
        </div>

        <div className="hero-mask-line hero-btn-mask">
          <button className="explore-button hero-reveal-line hero-reveal--4" onClick={handleExploreClick}>
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
