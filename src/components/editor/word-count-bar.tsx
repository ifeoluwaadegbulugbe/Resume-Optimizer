"use client";

import { cn } from "@/lib/utils";

export function WordCountBar({ count }: { count: number }) {
  const min = 450;
  const max = 600;
  const target = [525, 550];
  const inRange = count >= min && count <= max;
  const pct = Math.min(100, (count / max) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Resume length: {count} / {max} words
        </span>
        <span className={cn("text-xs", inRange ? "text-primary" : "text-amber-600")}>
          {count < min && `Below the ${min}-word minimum`}
          {count > max && `Above the ${max}-word maximum`}
          {inRange && (count >= target[0] && count <= target[1] ? "In target range" : "Within range")}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", inRange ? "bg-primary" : "bg-amber-500")}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-foreground/30"
          style={{ left: `${(min / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
