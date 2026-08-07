"use client";

import { cn } from "@/lib/utils";

function colorFor(score: number) {
  if (score >= 85) return "oklch(0.656 0.241 354.308)"; // pink-500-ish, strong
  if (score >= 70) return "oklch(0.718 0.202 349.761)"; // lighter pink
  if (score >= 50) return "oklch(0.769 0.188 70.08)"; // amber
  return "oklch(0.637 0.237 25.331)"; // red
}

export function ScoreRing({
  score,
  label,
  size = 92,
  className,
}: {
  score: number;
  label: string;
  size?: number;
  className?: string;
}) {
  const color = colorFor(score);
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${score * 3.6}deg, var(--muted) 0deg)`,
        }}
      >
        <div
          className="flex flex-col items-center justify-center rounded-full bg-card"
          style={{ width: size - 14, height: size - 14 }}
        >
          <span className="text-xl font-semibold leading-none">{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
