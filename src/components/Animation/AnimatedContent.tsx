import React from "react";

interface AnimatedContentProps {
  children: React.ReactNode
  distance?: number
  direction?: 'vertical' | 'horizontal'
  reverse?: boolean
  duration?: number
  ease?: string
  initialOpacity?: number
  animateOpacity?: boolean
  scale?: number
  threshold?: number
  delay?: number
  onComplete?: () => void
  triggerOnce?: boolean
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({ children }) => {
  return <>{children}</>;
};

export default AnimatedContent;
