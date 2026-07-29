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
    baseRotate: "-30deg",
    left: "5%",
    width: "12%",
    height: "28%",
    bottom: "-2%",
    colorVar: "--space-left-glow",
    colorPercent: "60%",
    animationType: "a",
    animationDuration: "12s",
    animationDelay: "-0s",
  },
  {
    id: 3,
    baseRotate: "-20deg",
    left: "17%",
    width: "14%",
    height: "38%",
    bottom: "-6%",
    colorVar: "--space-left-glow",
    colorPercent: "50%",
    animationType: "a",
    animationDuration: "11s",
    animationDelay: "-2s",
  },
  {
    id: 5,
    baseRotate: "-10deg",
    left: "29%",
    width: "13%",
    height: "48%",
    bottom: "-10%",
    colorVar: "--space-center-glow",
    colorPercent: "55%",
    animationType: "a",
    animationDuration: "16s",
    animationDelay: "-3s",
  },
  {
    id: 7,
    baseRotate: "-3deg",
    left: "36.5%",
    width: "14%",
    height: "62%",
    bottom: "-18%",
    colorVar: "--space-center-glow",
    colorPercent: "60%",
    animationType: "a",
    animationDuration: "17s",
    animationDelay: "-5s",
    clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)",
  },
  {
    id: 9,
    baseRotate: "0deg",
    left: "45.5%",
    width: "18%",
    height: "72%",
    bottom: "-24%",
    colorVar: "--space-center-glow",
    colorPercent: "65%",
    animationType: "a",
    animationDuration: "15s",
    animationDelay: "-7s",
    clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
  },
  {
    id: 11,
    baseRotate: "5deg",
    left: "58.5%",
    width: "14%",
    height: "58%",
    bottom: "-18%",
    colorVar: "--space-center-glow",
    colorPercent: "55%",
    animationType: "a",
    animationDuration: "18s",
    animationDelay: "-9s",
    clipPath: "polygon(35% 0, 65% 0, 100% 100%, 0 100%)",
  },
  {
    id: 13,
    baseRotate: "14deg",
    left: "72%",
    width: "12%",
    height: "46%",
    bottom: "-10%",
    colorVar: "--space-right-glow",
    colorPercent: "60%",
    animationType: "a",
    animationDuration: "11s",
    animationDelay: "-5s",
  },
  {
    id: 16,
    baseRotate: "30deg",
    left: "90%",
    width: "10%",
    height: "30%",
    bottom: "-2%",
    colorVar: "--space-right-glow",
    colorPercent: "60%",
    animationType: "b",
    animationDuration: "10s",
    animationDelay: "-1s",
  },
];
