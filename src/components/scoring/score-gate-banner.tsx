"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import type { ScoreGateResult } from "@/types/resume";

export function ScoreGateBanner({ scoreGate }: { scoreGate: ScoreGateResult }) {
  if (scoreGate.reached90) {
    return (
      <Alert className="border-primary/30 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertTitle>Both scores reached 90+</AlertTitle>
        <AlertDescription>
          Reached in {scoreGate.iterations} optimization {scoreGate.iterations === 1 ? "pass" : "passes"} without
          adding anything unverified.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-amber-500/40 bg-amber-500/5 text-foreground">
      <ShieldAlert className="h-4 w-4 text-amber-600" />
      <AlertTitle>Maximum Truthful Match</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          After {scoreGate.iterations} optimization {scoreGate.iterations === 1 ? "pass" : "passes"}, this is the
          strongest truthful version of this resume for this role — we won&apos;t invent experience just to clear
          90. Here&apos;s exactly what&apos;s capping the score:
        </p>
        {scoreGate.limitingFactors.length > 0 ? (
          <ul className="list-inside list-disc space-y-1">
            {scoreGate.limitingFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No single blocking gap was identified — the remaining points come from small improvements across
            several areas. See Improve Score for the ranked list.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
