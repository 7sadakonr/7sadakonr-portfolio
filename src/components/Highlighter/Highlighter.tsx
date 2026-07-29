import React, { useEffect, useState, useRef } from 'react';
import { RoughNotation } from 'react-rough-notation';

interface HighlighterProps {
    children: React.ReactNode;
    color?: string;
    show?: boolean;
    delay?: number;
    className?: string;
    type?: 'highlight' | 'underline' | 'box' | 'circle' | 'strike-through' | 'crossed-off';
}

const Highlighter: React.FC<HighlighterProps> = ({
    children,
    color = "rgba(138, 56, 245, 0.4)", // matching the theme's purple with opacity
    show = false,
    delay = 500,
    className = "",
    type = "highlight"
}) => {
    const [isShowing, setIsShowing] = useState(show);
    const spanRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (show) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const timer = setTimeout(() => {
                        setIsShowing(true);
                    }, delay);
                    
                    if (spanRef.current) {
                        observer.unobserve(spanRef.current);
                    }
                    
                    // Cleanup timeout just in case it unmounts quickly
                    return () => clearTimeout(timer);
                }
            },
            { 
                threshold: 0.1, // Trigger when 10% of the element is visible
                rootMargin: "0px 0px -10% 0px" // Optional: trigger slightly before it fully comes in, or adjust as needed
            }
        );

        if (spanRef.current) {
            observer.observe(spanRef.current);
        }

        return () => {
            if (spanRef.current) {
                observer.unobserve(spanRef.current);
            }
            observer.disconnect();
        };
    }, [show, delay]);

    return (
        <span ref={spanRef} className={`inline-block relative ${className}`}>
            <RoughNotation
                type={type}
                show={show || isShowing}
                color={color}
                animationDuration={1500}
                padding={[2, 6]}
                iterations={2}
                multiline={true}
                strokeWidth={type === 'underline' ? 3 : 1}
            >
                <span className="relative z-10 font-semibold">{children}</span>
            </RoughNotation>
        </span>
    );
};

export default Highlighter;
