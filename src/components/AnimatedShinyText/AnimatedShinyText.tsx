import { CSSProperties, FC, ReactNode } from "react";
import './AnimatedShinyText.css';

interface AnimatedShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}

const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className = "",
  shimmerWidth = 100,
}) => {
  return (
    <p
      style={
        {
          "--shimmer-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={`animated-shiny-text ${className}`}
    >
      {children}
    </p>
  );
};

export default AnimatedShinyText;
