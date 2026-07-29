export interface StreakConfig {
  id: number;
  baseRotate: string;
  left: string;
  width: string;
  height: string;
  bottom: string;
  colorVar: string;
  colorPercent: string;
  animationType: "a" | "b";
  animationDuration: string;
  animationDelay: string;
  clipPath?: string;
}

export const STREAK_DATA: StreakConfig[] = [
  {
    id: 1,
    baseRotate: "-28deg",
    left: "2%",
    width: "15%",
    height: "26%",
    bottom: "-4%",
    colorVar: "--space-left-glow",
    colorPercent: "60%",
    animationType: "a",
    animationDuration: "12s",
    animationDelay: "-0s",
  },
  {
    id: 3,
    baseRotate: "-22deg",
    left: "12%",
    width: "18%",
    height: "36%",
    bottom: "-8%",
    colorVar: "--space-left-glow",
    colorPercent: "50%",
    animationType: "a",
    animationDuration: "11s",
    animationDelay: "-2s",
  },
  {
    id: 5,
    baseRotate: "-12deg",
    left: "22%",
    width: "11%",
    height: "45%",
    bottom: "-12%",
    colorVar: "--space-center-glow",
    colorPercent: "55%",
    animationType: "a",
    animationDuration: "16s",
    animationDelay: "-3s",
  },
  {
    id: 7,
    baseRotate: "-6deg",
    left: "38%",
    width: "16%",
    height: "65%",
    bottom: "-20%",
    colorVar: "--space-center-glow",
    colorPercent: "60%",
    animationType: "a",
    animationDuration: "17s",
    animationDelay: "-5s",
    clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)",
  },
  {
    id: 9,
    baseRotate: "3deg",
    left: "42%",
    width: "22%",
    height: "75%",
    bottom: "-26%",
    colorVar: "--space-center-glow",
    colorPercent: "65%",
    animationType: "a",
    animationDuration: "15s",
    animationDelay: "-7s",
    clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
  },
  {
    id: 11,
    baseRotate: "8deg",
    left: "48%",
    width: "14%",
    height: "55%",
    bottom: "-15%",
    colorVar: "--space-center-glow",
    colorPercent: "55%",
    animationType: "a",
    animationDuration: "18s",
    animationDelay: "-9s",
    clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)",
  },
  {
    id: 13,
    baseRotate: "18deg",
    left: "68%",
    width: "13%",
    height: "42%",
    bottom: "-10%",
    colorVar: "--space-right-glow",
    colorPercent: "60%",
    animationType: "a",
    animationDuration: "11s",
    animationDelay: "-5s",
  },
  {
    id: 16,
    baseRotate: "25deg",
    left: "75%",
    width: "16%",
    height: "32%",
    bottom: "-5%",
    colorVar: "--space-right-glow",
    colorPercent: "60%",
    animationType: "b",
    animationDuration: "10s",
    animationDelay: "-1s",
  },
];
