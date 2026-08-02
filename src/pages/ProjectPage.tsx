import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import AnimatedContent from '../components/Animation/AnimatedContent'
import LineSidebar from '../components/LineSidebar/LineSidebar'
import todoListImg from '../assets/img/todo_list_real.webp'
import portfolioImg from '../assets/img/portfolio_real_new.webp'
import fileTransferImg from '../assets/img/zendix_real.webp'
import { scrollToTarget } from '../components/SmoothScroll/scrollController'
// CSS is now in LandingPage.css

interface ProjectItem {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    tech: string[];
    image: string | null;
    liveUrl: string;
    githubUrl: string;
    gradient?: string;
}

const PROJECTS: ProjectItem[] = [
    {
        id: 1,
        title: "Todo-List",
        subtitle: "Integrated Task Management System",
        description: "A full-stack task management application with secure JWT authentication, complete CRUD operations, and a dashboard featuring productivity analytics with Recharts. Users can manage tasks with advanced filtering by status and enjoy a responsive UI with smooth animations.",
        tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "Express", "Prisma", "PostgreSQL", "JWT"],
        image: todoListImg,
        liveUrl: "https://7sadakonr-todo-list.vercel.app",
        githubUrl: "https://github.com/7sadakonr/Todo-List",
    },
    {
        id: 2,
        title: "Portfolio Website",
        subtitle: "Personal Portfolio & Showcase",
        description: "A modern, responsive portfolio website showcasing my work and skills. Features include smooth animations, glass morphism UI design, universe-themed backgrounds with twinkling stars and shooting stars, interactive image magnifier, and mobile-optimized experience.",
        tech: ["React", "Vite", "TypeScript", "Lenis", "CSS"],
        image: portfolioImg,
        liveUrl: "https://7sadakonr-portfolio.vercel.app",
        githubUrl: "https://github.com/7sadakonr/7sadakonr-portfolio",
    },
    {
        id: 3,
        title: "Zendix File Transfer",
        subtitle: "Peer-to-peer file and clipboard sharing web app",
        description: "Zendix is a peer-to-peer file and clipboard sharing web app. Transfer files and text directly between devices without uploading to the cloud.",
        tech: ["React", "Vite", "Tailwind CSS", "Zustand", "PeerJS (WebRTC)", "React Router"],
        image: fileTransferImg,
        liveUrl: "https://zendix-file.vercel.app/",
        githubUrl: "https://github.com/7sadakonr/Zendix-Filetransfer-Web-App",
    },
    {
        id: 4,
        title: "Nyeta",
        subtitle: "Visual Assistance System with AI",
        description: "Nyeta is a real-time visual assistance platform for the visually impaired. It integrates WebRTC for volunteer calling and Llama 3.2 Vision AI for automated visual queries via an accessible, voice-controlled UI.",
        tech: ["Next.js", "Tailwind CSS", "Pusher", "PeerJS", "Llama 3.2 Vision", "Groq API"],
        image: null,
        liveUrl: "https://nyeta.vercel.app",
        githubUrl: "https://github.com/7sadakonr/Nyeta",
        gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
    }
];

interface ImageMagnifierProps {
    src: string;
    alt: string;
}

// Magnifier component with mobile touch support (memoized & top-level to prevent unmounting on parent re-renders)
const ImageMagnifier = React.memo(({ src, alt }: ImageMagnifierProps) => {
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const magnifierSize = 120;
    const zoomLevel = 2;
    // Offset for touch devices - move lens up so finger doesn't block view
    const touchOffsetY = -70;
    const cachedRect = useRef({ top: 0, left: 0, width: 0, height: 0 });

    const updateCachedRect = () => {
        const elem = containerRef.current;
        if (elem) {
            const r = elem.getBoundingClientRect();
            cachedRect.current = { top: r.top, left: r.left, width: r.width, height: r.height };
            setImgSize({ width: r.width, height: r.height });
        }
    };

    // Desktop mouse handler
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { top, left, width, height } = cachedRect.current;

        const x = e.clientX - left;
        const y = e.clientY - top;

        setMagnifierPos({ x, y });
        setImgSize({ width, height });
        setIsTouchDevice(false);
    };

    // Mobile touch handlers
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        const elem = containerRef.current;
        if (!elem) return;

        const { top, left, width, height } = elem.getBoundingClientRect();
        cachedRect.current = { top, left, width, height };
        const x = touch.clientX - left;
        const y = touch.clientY - top;

        setMagnifierPos({ x, y });
        setImgSize({ width, height });
        setIsTouchDevice(true);

        // Long press 300ms to activate
        longPressTimer.current = setTimeout(() => {
            setShowMagnifier(true);
        }, 300);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        const elem = containerRef.current;
        if (!elem) return;

        const { top, left, width, height } = cachedRect.current;
        const x = touch.clientX - left;
        const y = touch.clientY - top;

        // Cancel long press if moved before activation
        if (!showMagnifier && longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            return;
        }

        if (showMagnifier) {
            e.preventDefault(); // Prevent scroll while magnifying
        }

        setMagnifierPos({ x, y });
        setImgSize({ width, height });
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setShowMagnifier(false);
        setIsTouchDevice(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    // Lens position - follows finger/cursor freely, offset up for touch
    const lensX = magnifierPos.x - magnifierSize / 2;
    const lensY = isTouchDevice
        ? magnifierPos.y - magnifierSize / 2 + touchOffsetY
        : magnifierPos.y - magnifierSize / 2;

    // Zoom position follows the CENTER of the lens (not the finger)
    const lensCenterX = lensX + magnifierSize / 2;
    const lensCenterY = lensY + magnifierSize / 2;

    // Clamp zoom position to stay within image bounds
    const clampedZoomX = Math.max(0, Math.min(lensCenterX, imgSize.width));
    const clampedZoomY = Math.max(0, Math.min(lensCenterY, imgSize.height));

    // Background position - zoom shows what's at the center of the lens
    const bgPosX = -(clampedZoomX * zoomLevel - magnifierSize / 2);
    const bgPosY = -(clampedZoomY * zoomLevel - magnifierSize / 2);

    return (
        <div
            ref={containerRef}
            className="magnifier-container"
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') { updateCachedRect(); setShowMagnifier(true); } }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setShowMagnifier(false); }}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            <img
                src={src}
                alt={alt}
                width="960"
                height="540"
                className="project-preview-image"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
            />

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
    );
});

ImageMagnifier.displayName = 'ImageMagnifier';

const ProjectSection = () => {
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

    const handleSidebarClick = useCallback((index: number) => {
        setActiveProjectIndex(index);
        const el = projectRefs.current[index];
        if (el) scrollToTarget(el, { offset: -window.innerHeight / 4 });
    }, []);

    const sidebarItems = useMemo(() => {
        return PROJECTS.map(p => ({
            label: p.title,
            description: p.description,
            tech: p.tech,
            liveUrl: p.liveUrl,
            githubUrl: p.githubUrl
        }));
    }, []);

    return (
        <div className="project-page-wrapper landing-section">
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
                    {PROJECTS.map((project, index) => (
                        <AnimatedContent
                            key={project.id}
                            direction="up"
                            distance={60}
                            delay={index * 0.1}
                            triggerOnce
                        >
                            <div
                                className="project-card-wrapper"
                                ref={el => { projectRefs.current[index] = el; }}
                                id={`project-${index}`}
                                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setActiveProjectIndex(index); }}
                            >
                                <div className="project-card">
                                {/* Project Preview/Image Area */}
                                <div className="project-preview">
                                    <div className="project-preview-inner" style={{ background: project.image ? 'transparent' : project.gradient }}>
                                        {project.image && (
                                            <ImageMagnifier src={project.image} alt={project.title} />
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Project Info Area */}
                                <div className="project-info mobile-only-info">
                                    <p className="project-description">{project.description}</p>
                                    
                                    <div className="project-tech">
                                        <span className="tech-label">Tech Stack</span>
                                        <div className="tech-badges">
                                            {project.tech.map((tech, i) => {
                                                const lower = tech.toLowerCase();
                                                let iconId = null;
                                                if (lower.includes('next')) iconId = 'nextjs';
                                                else if (lower.includes('react')) iconId = 'react';
                                                else if (lower.includes('typescript')) iconId = 'ts';
                                                else if (lower.includes('tailwind')) iconId = 'tailwind';
                                                else if (lower.includes('node')) iconId = 'nodejs';
                                                else if (lower.includes('express')) iconId = 'express';
                                                else if (lower.includes('prisma')) iconId = 'prisma';
                                                else if (lower.includes('postgres')) iconId = 'postgres';
                                                else if (lower.includes('vite')) iconId = 'vite';
                                                else if (lower === 'css') iconId = 'css';

                                                return (
                                                    <div key={i} className="tech-pill" title={tech}>
                                                        {iconId && <img src={`https://skillicons.dev/icons?i=${iconId}`} alt={tech} loading="lazy" decoding="async" style={{ width: '16px', height: '16px' }} />}
                                                        <span>{tech}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="project-actions">
                                        {project.liveUrl && (
                                            <a href={project.liveUrl} className="project-btn primary" target="_blank" rel="noopener noreferrer">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polygon points="10 8 16 12 10 16 10 8" />
                                                </svg>
                                                Live Demo
                                            </a>
                                        )}
                                        {project.githubUrl && (
                                            <a href={project.githubUrl} className="project-btn secondary" target="_blank" rel="noopener noreferrer">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                GitHub
                                            </a>
                                        )}
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
                            items={sidebarItems}
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

