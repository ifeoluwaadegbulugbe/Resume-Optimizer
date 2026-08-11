"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColdEmailInput, ColdEmailPipelineStage, ColdEmailResult } from "@/types/coldEmail";
import { PIPELINE_STAGE_LABELS_COLD_EMAIL } from "@/types/coldEmail";

const STAGES: ColdEmailPipelineStage[] = [
  "checking_sufficiency",
  "generating_variants",
  "scoring_variants",
  "optimizing",
  "validating",
];

export function ColdEmailGenerationProgress({
  input,
  onComplete,
  onRetry,
}: {
  input: ColdEmailInput;
  onComplete: (result: ColdEmailResult) => void;
  onRetry: () => void;
}) {
  const [completedStages, setCompletedStages] = useState<Set<ColdEmailPipelineStage>>(new Set());
  const [currentStage, setCurrentStage] = useState<ColdEmailPipelineStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/cold-email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Generation failed to start.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") {
            setCurrentStage(event.stage);
            setCompletedStages((prev) => {
              const idx = STAGES.indexOf(event.stage);
              const next = new Set(prev);
              for (let i = 0; i < idx; i++) next.add(STAGES[i]);
              return next;
            });
          } else if (event.type === "done") {
            setCompletedStages(new Set(STAGES));
            onComplete(event.result);
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    }
  }, [input, onComplete]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">Drafting your outreach…</h2>
          <p className="text-sm text-muted-foreground">
            Generating a few strategically different variants, scoring each for reply probability, and
            sharpening the weakest one.
          </p>
        </div>

        <ol className="space-y-3">
          {STAGES.map((stage) => {
            const done = completedStages.has(stage);
            const active = currentStage === stage && !done;
            return (
              <li key={stage} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    done ? "text-foreground" : active ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {PIPELINE_STAGE_LABELS_COLD_EMAIL[stage]}
                </span>
              </li>
            );
          })}
        </ol>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="space-y-3">
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={onRetry}>
                Go back
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
