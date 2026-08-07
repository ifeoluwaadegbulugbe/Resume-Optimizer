"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "./score-ring";
import type { OptimizedResume } from "@/types/resume";
import { CheckCircle2 } from "lucide-react";

export function ScoreHeader({ optimized }: { optimized: OptimizedResume }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-accent/30 to-transparent">
      <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your Resume Is Ready</h2>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Overall Match: <span className="font-semibold text-foreground">{optimized.scores.overall}/100</span>
          </p>
          {optimized.whatImproved.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What improved</p>
              <ul className="space-y-1">
                {optimized.whatImproved.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <ScoreRing score={optimized.scores.overall} label="Overall" size={104} />
          <ScoreRing score={optimized.scores.ats.total} label="ATS" />
          <ScoreRing score={optimized.scores.recruiter.total} label="Recruiter" />
        </div>
      </CardContent>
    </Card>
  );
}
