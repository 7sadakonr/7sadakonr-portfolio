import './hero_section.css'
import hero from '../../assets/img/hero.svg';
import AnimatedContent from '../Animation/AnimatedContent.jsx';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

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
        </div>
      </AnimatedContent>
      <AnimatedContent
        distance={150}
        duration={1.2}
        initialOpacity={0.2}
        scale={1}
        threshold={0.2}
        delay={0.3}
      >
        <img src={hero} alt="Hero" />
      </AnimatedContent>
      <AnimatedContent
        distance={100}
        direction="vertical"
        duration={1.2}
        initialOpacity={0}
        scale={1}
        threshold={0.2}
        delay={0.5}
      >
      </AnimatedContent>
    </main>
  )
}

export default HeroSection