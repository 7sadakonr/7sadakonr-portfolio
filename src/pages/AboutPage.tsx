import AnimatedContent from '../components/Animation/AnimatedContent'
import './LandingPage.css'
import TextReveal from '../components/Animation/TextReveal'
import DotPattern from '../components/DotPattern/DotPattern'
import GithubCalendar from '../components/GithubCalendar/GithubCalendar'
import Scales from '../components/Scales/Scales'
import ResumeDownloadMenu from '../components/ResumeDownload/ResumeDownloadMenu'

const AboutSection = () => {
    return (
        <div className="about-page-wrapper landing-section">
            {/* Main Content */}
            <div className="about-content">
                {/* Intro / Hero Section */}
                <section className="about-hero">
                    <TextReveal
                        as="h1"
                        className="about-hero-title"
                        delay={0.1}
                        stagger={0.07}
                    >
                        <span>Hi,</span>
                        <span>I'm</span>
                        <span className="gradient-text">
                            <span className="gradient-text-glow">Jetsadakorn</span>
                            <span className="gradient-text-content">Jetsadakorn</span>
                        </span>
                    </TextReveal>

                    <TextReveal
                        as="p"
                        className="about-hero-subtitle"
                        text="A passionate Computer Science Student exploring the intersection of technology and creativity. Currently focused on web development, UI/UX design, and building meaningful digital experiences."
                        delay={0.25}
                        stagger={0.025}
                    />

                    <AnimatedContent
                        distance={40}
                        direction="vertical"
                        duration={1}
                        initialOpacity={0}
                        delay={0.55}
                    >
                        <ResumeDownloadMenu variant="hero" />
                    </AnimatedContent>
                </section>

                {/* Bento Grid Section */}
                <section className="about-bento-container" id="about-me">
                    <div className="about-bento-scale about-bento-scale-left" aria-hidden="true">
                        <Scales orientation="diagonal" size={10} color="rgba(255, 255, 255, 0.1)" />
                    </div>
                    <div className="about-bento-scale about-bento-scale-right" aria-hidden="true">
                        <Scales orientation="diagonal" size={10} color="rgba(255, 255, 255, 0.1)" />
                    </div>
                    <div className="about-bento-layout">
                        <div className="about-bento-grid">

                        {/* Main Biography Card */}
                            <div className="bento-card bento-main">
                                <div className="bento-header">
                                    <svg className="bento-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <h3 className="bento-title">Biography</h3>
                                </div>
                                <div className="about-me-text">
                                    <p>
                                        I'm a <span className="highlight-text">Computer Science student</span> with a deep passion for
                                        creating elegant solutions to complex problems. My journey in tech started with curiosity
                                        about how things work, and has evolved into a commitment to building
                                        <span className="gradient-highlight"> innovative digital experiences</span>.
                                    </p>
                                    <p>
                                        When I'm not coding, you can find me exploring new design trends, learning about emerging
                                        technologies, or working on personal projects that challenge me to grow. I believe in the
                                        power of continuous learning and pushing boundaries.
                                    </p>
                                </div>
                            </div>

                        {/* Focus Card */}
                            <div className="bento-card bento-focus">
                                <div className="bento-header">
                                    <svg className="bento-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <circle cx="12" cy="12" r="6"></circle>
                                        <circle cx="12" cy="12" r="2"></circle>
                                    </svg>
                                    <h3 className="bento-title">Current Focus</h3>
                                </div>
                                <div className="about-me-text">
                                    <p>
                                        Currently focused on <span className="highlight-text">full-stack web development</span> and
                                        creating user-centric interfaces that are both beautiful and functional.
                                    </p>
                                </div>
                            </div>

                        {/* Skills Card */}
                            <div className="bento-card bento-skills" id="skills">
                                <DotPattern
                                    className="bento-skills-dot-pattern"
                                    width={18}
                                    height={18}
                                    cx={1.25}
                                    cy={1.25}
                                    cr={1.25}
                                />
                                <div className="bento-header">
                                    <svg className="bento-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="16 18 22 12 16 6"></polyline>
                                        <polyline points="8 6 2 12 8 18"></polyline>
                                    </svg>
                                    <h3 className="bento-title">Core Stack</h3>
                                </div>
                                <div className="tech-marquee-container">
                                    <div className="tech-marquee-row left">
                                        {[
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
                                        ].map((skill, i) => (
                                            <div className="tech-pill" title={skill.name} key={`row1-${i}`}>
                                                <img src={`/tech-icons/${skill.id}.svg`} alt={skill.name} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />
                                                <span>{skill.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="tech-marquee-row right">
                                        {[
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
                                        ].map((skill, i) => (
                                            <div className="tech-pill" title={skill.name} key={`row2-${i}`}>
                                                <img src={`/tech-icons/${skill.id}.svg`} alt={skill.name} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />
                                                <span>{skill.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="tech-marquee-row left">
                                        {[
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
                                        ].map((skill, i) => (
                                            <div className="tech-pill" title={skill.name} key={`row3-${i}`}>
                                                <img src={`/tech-icons/${skill.id}.svg`} alt={skill.name} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />
                                                <span>{skill.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                            <div className="bento-card bento-github">
                                <GithubCalendar
                                    username="7sadakonr"
                                    colorSchema="purple"
                                />
                            </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default AboutSection
