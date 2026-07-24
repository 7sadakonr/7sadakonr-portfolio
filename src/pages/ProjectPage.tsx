import React, { useState, useRef, useEffect, useMemo } from 'react'
import AnimatedContent from '../components/Animation/AnimatedContent'
import LineSidebar from '../components/LineSidebar/LineSidebar'
import { AvatarGroup } from '../components/Animation/AvatarGroup'
import todoListImg from '../assets/img/todo_list_real.png'
import portfolioImg from '../assets/img/portfolio_real_new.png'
import fileTransferImg from '../assets/img/zendix_real.png'
import { lenisInstance } from '../components/SmoothScroll/SmoothScroll'
// CSS is now in LandingPage.css

const ProjectSection = () => {
    // Stars logic (unused in this component now, but kept for minimal diff if moved back)
    const stars = useMemo(() => [...Array(250)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() > 0.98 ? '3px' : Math.random() > 0.9 ? '2px' : '1px',
        duration: Math.random() * 6 + 4 + 's',
        delay: Math.random() * 5 + 's'
    })), [])

    const projects = [
        {
            id: 1,
            title: "Todo-List",
            subtitle: "Integrated Task Management System",
            description: "A full-stack task management application with secure JWT authentication, complete CRUD operations, and a dashboard featuring productivity analytics with Recharts. Users can manage tasks with advanced filtering by status and enjoy a responsive UI with smooth animations.",
            tech: ["Next.js", "TypeScript", "Express.js", "PostgreSQL", "Prisma", "TailwindCSS", "JWT"],
            image: todoListImg,
            liveUrl: "https://7sadakonr-todo-list.vercel.app",
            githubUrl: "https://github.com/7sadakonr/Todo-List",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        },
        {
            id: 2,
            title: "Portfolio Website",
            subtitle: "Personal Portfolio & Showcase",
            description: "A modern, responsive portfolio website showcasing my work and skills. Features include smooth animations, glass morphism UI design, universe-themed backgrounds with twinkling stars and shooting stars, interactive image magnifier, and mobile-optimized experience.",
            tech: ["React", "Vite", "CSS", "Framer Motion"],
            image: portfolioImg,
            liveUrl: "https://7sadakonr-portfolio.vercel.app",
            githubUrl: "https://github.com/7sadakonr/7sadakonr-portfolio",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        },
        {
            id: 3,
            title: "Zendix File Transfer",
            subtitle: "Peer-to-peer file and clipboard sharing web app",
            description: "Zendix is a peer-to-peer file and clipboard sharing web app. Transfer files and text directly between devices without uploading to the cloud.",
            tech: ["React", "Vite", "TailwindCSS", "Zustand", "PeerJS (WebRTC)", "React Router"],
            image: fileTransferImg,
            liveUrl: "https://zendix-file.vercel.app/",
            githubUrl: "https://github.com/7sadakonr/Zendix-Filetransfer-Web-App",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        }
    ]

    const [activeProjectIndex, setActiveProjectIndex] = useState(0);
    const projectRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrollingRef = useRef(false);

    const ratios = useRef<Record<number, number>>({});

    useEffect(() => {
        const handleProjectScroll = (e: Event) => {
            const customEvent = e as CustomEvent<{ index: number }>;
            if (customEvent.detail && typeof customEvent.detail.index === 'number') {
                setActiveProjectIndex(customEvent.detail.index);
                isScrollingRef.current = true;
                setTimeout(() => {
                    isScrollingRef.current = false;
                }, 1000);
            }
        };

        window.addEventListener('project-scroll', handleProjectScroll);
        return () => window.removeEventListener('project-scroll', handleProjectScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const index = projectRefs.current.findIndex(ref => ref === entry.target);
                if (index !== -1) {
                    ratios.current[index] = entry.intersectionRatio;
                }
            });

            if (isScrollingRef.current) return;

            let maxRatio = 0;
            let maxIndex = -1;

            Object.entries(ratios.current).forEach(([idx, ratio]) => {
                if (ratio > maxRatio) {
                    maxRatio = ratio;
                    maxIndex = Number(idx);
                }
            });

            if (maxIndex !== -1 && maxRatio > 0) {
                setActiveProjectIndex(maxIndex);
            }
        }, { 
            rootMargin: "-20% 0px -20% 0px", 
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        });

        projectRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const handleSidebarClick = (index: number) => {
        setActiveProjectIndex(index);
        const el = projectRefs.current[index];
        if (el) lenisInstance?.scrollTo(el, { offset: -window.innerHeight / 4 });
    };

    // Tech icons/badges component
    const TechBadge = ({ tech }) => (
        <span className="tech-badge">{tech}</span>
    )

    // Magnifier component with mobile touch support
    const ImageMagnifier = ({ src, alt }) => {
        const [showMagnifier, setShowMagnifier] = useState(false)
        const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 })
        const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
        const [isTouchDevice, setIsTouchDevice] = useState(false)
        const longPressTimer = useRef(null)
        const containerRef = useRef(null)

        const magnifierSize = 120
        const zoomLevel = 2
        // Offset for touch devices - move lens up so finger doesn't block view
        const touchOffsetY = -70
        const cachedRect = useRef({ top: 0, left: 0, width: 0, height: 0 })

        const updateCachedRect = () => {
            const elem = containerRef.current
            if (elem) {
                const r = elem.getBoundingClientRect()
                cachedRect.current = { top: r.top, left: r.left, width: r.width, height: r.height }
                setImgSize({ width: r.width, height: r.height })
            }
        }

        // Desktop mouse handler
        const handleMouseMove = (e) => {
            const { top, left, width, height } = cachedRect.current

            const x = e.clientX - left
            const y = e.clientY - top

            setMagnifierPos({ x, y })
            setImgSize({ width, height })
            setIsTouchDevice(false)
        }

        // Mobile touch handlers
        const handleTouchStart = (e) => {
            const touch = e.touches[0]
            const elem = containerRef.current
            if (!elem) return

            const { top, left, width, height } = elem.getBoundingClientRect()
            cachedRect.current = { top, left, width, height }
            const x = touch.clientX - left
            const y = touch.clientY - top

            setMagnifierPos({ x, y })
            setImgSize({ width, height })
            setIsTouchDevice(true)

            // Long press 300ms to activate
            longPressTimer.current = setTimeout(() => {
                setShowMagnifier(true)
            }, 300)
        }

        const handleTouchMove = (e) => {
            const touch = e.touches[0]
            const elem = containerRef.current
            if (!elem) return

            const { top, left, width, height } = cachedRect.current
            const x = touch.clientX - left
            const y = touch.clientY - top

            // Cancel long press if moved before activation
            if (!showMagnifier && longPressTimer.current) {
                clearTimeout(longPressTimer.current)
                longPressTimer.current = null
                return
            }

            if (showMagnifier) {
                e.preventDefault() // Prevent scroll while magnifying
            }

            setMagnifierPos({ x, y })
            setImgSize({ width, height })
        }

        const handleTouchEnd = () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current)
                longPressTimer.current = null
            }
            setShowMagnifier(false)
            setIsTouchDevice(false)
        }

        // Cleanup on unmount
        useEffect(() => {
            return () => {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current)
                }
            }
        }, [])

        // Lens position - follows finger/cursor freely, offset up for touch
        const lensX = magnifierPos.x - magnifierSize / 2
        const lensY = isTouchDevice
            ? magnifierPos.y - magnifierSize / 2 + touchOffsetY
            : magnifierPos.y - magnifierSize / 2

        // Zoom position follows the CENTER of the lens (not the finger)
        const lensCenterX = lensX + magnifierSize / 2
        const lensCenterY = lensY + magnifierSize / 2

        // Clamp zoom position to stay within image bounds
        const clampedZoomX = Math.max(0, Math.min(lensCenterX, imgSize.width))
        const clampedZoomY = Math.max(0, Math.min(lensCenterY, imgSize.height))

        // Background position - zoom shows what's at the center of the lens
        const bgPosX = -(clampedZoomX * zoomLevel - magnifierSize / 2)
        const bgPosY = -(clampedZoomY * zoomLevel - magnifierSize / 2)

        return (
            <div
                ref={containerRef}
                className="magnifier-container"
                onMouseEnter={() => { updateCachedRect(); setShowMagnifier(true); }}
                onMouseLeave={() => setShowMagnifier(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
            >
                <img src={src} alt={alt} className="project-preview-image" />

                {showMagnifier && (
                    <div
                        className="magnifier-lens"
                        style={{
                            left: lensX,
                            top: lensY,
                            width: magnifierSize,
                            height: magnifierSize,
                            backgroundImage: `url(${src})`,
                            backgroundSize: `${imgSize.width * zoomLevel}px ${imgSize.height * zoomLevel}px`,
                            backgroundPosition: `${bgPosX}px ${bgPosY}px`
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="project-page-wrapper landing-section" id="projects">
            {/* Main Content */}
            <div className="project-content">

                {/* Hero Section */}
                <section className="project-hero">
                    <AnimatedContent
                        distance={60}
                        direction="vertical"
                        duration={1}
                        initialOpacity={0}
                        delay={0.25}
                    >
                        <h1 className="project-hero-title">
                            My <span className="gradient-text">
                                <span className="gradient-text-glow">Projects</span>
                                <span className="gradient-text-content">Projects</span>
                            </span>
                        </h1>
                    </AnimatedContent>

                    <AnimatedContent
                        distance={50}
                        direction="vertical"
                        duration={1}
                        initialOpacity={0}
                        delay={0.4}
                    >
                        <p className="project-hero-subtitle">
                            Explore my latest work showcasing creativity, technical skills, and passion for building meaningful digital experiences.
                        </p>
                    </AnimatedContent>
                </section>

                {/* Projects Grid with Sidebar */}
                <div className="projects-layout">
                    <section className="projects-list">
                    {projects.map((project, index) => (
                        <AnimatedContent
                            key={project.id}
                            direction="up"
                            distance={60}
                            delay={index * 0.1}
                            triggerOnce
                        >
                            <div 
                                className="project-card-wrapper" 
                                ref={el => projectRefs.current[index] = el}
                                id={`project-${index}`}
                                onMouseEnter={() => setActiveProjectIndex(index)}
                            >
                                <div className="project-card">
                                {/* Project Preview/Image Area */}
                                <div className="project-preview" style={{ background: project.image ? 'transparent' : project.gradient }}>
                                    {project.image && (
                                        <ImageMagnifier src={project.image} alt={project.title} />
                                    )}
                                </div>

                                {/* Project Info Area */}
                                <div className="project-info">
                                    <div className="project-header">
                                        <h3 className="project-title">{project.title}</h3>
                                        <span className="project-year">{project.year}</span>
                                    </div>
                                    <p className="project-description">{project.description}</p>
                                    
                                    <div className="project-tech">
                                        <span className="tech-label">Tech Stack</span>
                                        <div className="tech-badges">
                                            {project.tech.map((tech, i) => (
                                                <TechBadge key={i} tech={tech} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="project-actions">
                                        <a href={project.liveUrl} className="project-btn primary" target="_blank" rel="noopener noreferrer">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polygon points="10 8 16 12 10 16 10 8" />
                                            </svg>
                                            Live Demo
                                        </a>
                                        <a href={project.githubUrl} className="project-btn secondary" target="_blank" rel="noopener noreferrer">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                            GitHub
                                        </a>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </AnimatedContent>
                    ))}
                    </section>
                    
                    {/* Line Sidebar for Projects */}
                    <aside className="projects-sidebar">
                        <LineSidebar 
                            items={projects.map(p => ({ label: p.title, description: p.description }))}
                            activeIndex={activeProjectIndex}
                            onItemClick={handleSidebarClick}
                            accentColor="#a855f7"
                            fontSize={2.2}
                        />
                    </aside>
                </div>

            </div>
        </div>
    )
}

export default ProjectSection



