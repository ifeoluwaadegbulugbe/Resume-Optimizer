"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { OptimizedResume } from "@/types/resume";

const DECISION_STYLE = {
  Yes: "bg-primary text-primary-foreground",
  Maybe: "bg-amber-500 text-white",
  No: "bg-destructive text-white",
} as const;

export function RecruiterView({ optimized }: { optimized: OptimizedResume }) {
  const fi = optimized.recruiterFirstImpression;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" /> Recruiter First Impression (first 6–10 seconds)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Strong signals</p>
            <ul className="space-y-1.5">
              {fi.strongSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Weak signals</p>
            <ul className="space-y-1.5">
              {fi.weakSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <span className="text-sm font-medium">Would I shortlist this candidate?</span>
          <Badge className={DECISION_STYLE[fi.shortlistDecision]}>{fi.shortlistDecision}</Badge>
          <span className="text-sm text-muted-foreground">{fi.shortlistReason}</span>
        </div>
      </CardContent>
    </Card>
  );
}
