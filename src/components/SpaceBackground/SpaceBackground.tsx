import { type CSSProperties, type ComponentPropsWithoutRef } from "react";
import "./SpaceBackground.css";
import { STREAK_DATA } from "./utils/streakData";
import Fireflies from "../Animation/Fireflies";

export type SpaceMotion = "subtle" | "none";

export interface SpaceBackgroundColors {
  /** Color for the left side glow of the aurora and streaks. */
  leftGlow?: string;
  /** Color for the center glow of the aurora, streaks, and planet outline. */
  centerGlow?: string;
  /** Color for the right side glow of the aurora and streaks. */
  rightGlow?: string;
}

export interface SpaceBackgroundProps extends ComponentPropsWithoutRef<"div"> {
  /** Controls aurora and streak animation. Default: "subtle" */
  motion?: SpaceMotion;
  /** Whether to show the planet silhouette at the bottom of the container. Default: true */
  showPlanet?: boolean;
  /** Custom colors for the background elements. */
  colors?: SpaceBackgroundColors;
}

const DEFAULT_COLORS = {
  leftGlow: "#FF7777",
  centerGlow: "#ef6f9e",
  rightGlow: "#8b3dff",
};

export function SpaceBackground({
  children,
  className = "",
  style,
  motion = "subtle",
  showPlanet = true,
  colors,
  ...rest
}: SpaceBackgroundProps) {
  const mergedColors = { ...DEFAULT_COLORS, ...colors };
  const cssVariables = {
    "--space-left-glow": mergedColors.leftGlow,
    "--space-center-glow": mergedColors.centerGlow,
    "--space-right-glow": mergedColors.rightGlow,
    ...style,
  } as CSSProperties;
  
  const motionClass = motion === "none" ? "space-background--motion-none" : "";

  return (
    <div
      className={`space-background ${motionClass} ${className}`.trim()}
      style={cssVariables}
      {...rest}
    >
      <div className="space-background__base" aria-hidden="true" />
      <div className="space-background__nebula" aria-hidden="true">
        <div className="space-background__aurora space-background__aurora--back" />
        <div className="space-background__aurora space-background__aurora--front" />
        <div className="space-background__streaks">
          {STREAK_DATA.map((streak) => (
            <div
              key={streak.id}
              className="space-background__streak"
              style={
                {
                  "--streak-rotate": streak.baseRotate,
                  "--streak-left": streak.left,
                  "--streak-width": streak.width,
                  "--streak-height": streak.height,
                  "--streak-bottom": streak.bottom,
                  "--streak-color": `var(${streak.colorVar})`,
                  "--streak-percent": streak.colorPercent,
                  "--streak-anim": `space-aurora-streak-drift-${streak.animationType}`,
                  "--streak-duration": streak.animationDuration,
                  "--streak-delay": streak.animationDelay,
                  "--streak-clip-path": streak.clipPath || "none",
                  transform: `rotate(${streak.baseRotate})`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>
      <Fireflies count={10} />
      {showPlanet && (
        <div className="space-background__planet" aria-hidden="true" />
      )}
      <div className="space-background__content">{children}</div>
    </div>
  );
}
