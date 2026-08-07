"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OptimizedResume, ImprovementSuggestion } from "@/types/resume";

const IMPACT_ORDER: ImprovementSuggestion["impact"][] = ["highest", "high", "medium", "low"];
const IMPACT_STYLE: Record<ImprovementSuggestion["impact"], string> = {
  highest: "bg-primary text-primary-foreground",
  high: "bg-primary/70 text-primary-foreground",
  medium: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
};

export function ImproveScore({ optimized }: { optimized: OptimizedResume }) {
  const sorted = [...optimized.improvementSuggestions].sort(
    (a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact)
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No further suggestions — this version already covers the highest-impact changes we could find.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Ranked by estimated impact. These are estimates, not guarantees — always prioritize truthfulness over
        score.
      </p>
      {sorted.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex items-start gap-4 p-4">
            <Badge className={`shrink-0 capitalize ${IMPACT_STYLE[s.impact]}`}>{s.impact}</Badge>
            <div className="space-y-1">
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <p className="text-xs text-muted-foreground">
                Section: {s.targetSection} · Estimated change: {s.estimatedScoreChange}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
