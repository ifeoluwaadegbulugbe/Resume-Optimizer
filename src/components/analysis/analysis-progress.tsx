"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStage, ResumeData, JobDescriptionAnalysis, OptimizedResume } from "@/types/resume";
import { PIPELINE_STAGE_LABELS } from "@/types/resume";

const FIXED_STAGES: PipelineStage[] = [
  "parsing_resume",
  "analyzing_job",
  "identifying_requirements",
  "matching_experience",
];

const LOOP_STAGES: PipelineStage[] = [
  "optimizing_achievements",
  "checking_ats",
  "simulating_recruiter",
  "validating",
];

export interface AnalyzeRequest {
  resumeData: ResumeData;
  jobDescription: {
    rawText: string;
    companyName: string;
    jobTitle: string;
    jobLocation: string;
    companyWebsite?: string;
    companyValues?: string;
  };
}

export function AnalysisProgress({
  request,
  onComplete,
  onRetry,
}: {
  request: AnalyzeRequest;
  onComplete: (result: { optimized: OptimizedResume; jobAnalysis: JobDescriptionAnalysis }) => void;
  onRetry: () => void;
}) {
  const [fixedDone, setFixedDone] = useState<Set<PipelineStage>>(new Set());
  const [loopDone, setLoopDone] = useState<Set<PipelineStage>>(new Set());
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [iteration, setIteration] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Analysis failed to start.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastIteration = 1;

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
            const stage: PipelineStage = event.stage;
            const stageIteration: number = event.iteration ?? 1;
            setCurrentStage(stage);

            if (FIXED_STAGES.includes(stage)) {
              setFixedDone((prev) => {
                const idx = FIXED_STAGES.indexOf(stage);
                const next = new Set(prev);
                for (let i = 0; i < idx; i++) next.add(FIXED_STAGES[i]);
                return next;
              });
            } else {
              if (stageIteration !== lastIteration) {
                lastIteration = stageIteration;
                setIteration(stageIteration);
                setLoopDone(new Set());
              }
              setLoopDone((prev) => {
                const idx = LOOP_STAGES.indexOf(stage);
                const next = new Set(prev);
                for (let i = 0; i < idx; i++) next.add(LOOP_STAGES[i]);
                return next;
              });
            }
          } else if (event.type === "done") {
            setFixedDone(new Set(FIXED_STAGES));
            setLoopDone(new Set(LOOP_STAGES));
            onComplete({ optimized: event.optimized, jobAnalysis: event.jobAnalysis });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    }
  }, [request, onComplete]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  const isDone = (stage: PipelineStage) =>
    FIXED_STAGES.includes(stage) ? fixedDone.has(stage) : loopDone.has(stage);

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Optimizing your resume…</h2>
            <p className="text-sm text-muted-foreground">
              We keep refining truthfully until both scores hit 90, or until another pass stops helping.
            </p>
          </div>
          {iteration > 1 && <Badge variant="secondary">Refinement pass {iteration} of 3</Badge>}
        </div>

        <ol className="space-y-3">
          {[...FIXED_STAGES, ...LOOP_STAGES].map((stage) => {
            const done = isDone(stage);
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
                  {PIPELINE_STAGE_LABELS[stage]}
                  {LOOP_STAGES.includes(stage) && active && iteration > 1 ? ` (pass ${iteration})` : ""}
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
