"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { OptimizedResume } from "@/types/resume";

export function BeforeAfter({ optimized }: { optimized: OptimizedResume }) {
  if (optimized.bulletComparisons.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No bullet comparisons available for this version.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {optimized.bulletComparisons.map((c) => (
        <Card key={c.bulletId}>
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Original</p>
                <p className="text-sm">{c.original}</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">Optimized</p>
                <p className="text-sm">{c.optimized}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {c.keywordsAdded.map((k) => (
                <Badge key={k} variant="secondary">
                  +{k}
                </Badge>
              ))}
            </div>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <span className="font-medium text-foreground">{c.achievementImprovement}</span> — {c.whyStronger}
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
