"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResumeUploadStep, type ParsedResumePayload } from "@/components/upload/resume-upload-step";
import { JobDescriptionStep, type JobDescriptionInput } from "@/components/jd/job-description-step";
import { AnalysisProgress, type AnalyzeRequest } from "@/components/analysis/analysis-progress";
import { useDataStore } from "@/lib/data/store";
import type { OptimizedResume, JobDescriptionAnalysis } from "@/types/resume";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

type Step = "upload" | "job" | "analyzing";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "upload", label: "Resume" },
  { key: "job", label: "Job description" },
  { key: "analyzing", label: "Analyze & optimize" },
];

export default function OptimizePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [resumePayload, setResumePayload] = useState<ParsedResumePayload | null>(null);
  const [jd, setJd] = useState<JobDescriptionInput | null>(null);

  const addResume = useDataStore((s) => s.addResume);
  const addJobDescription = useDataStore((s) => s.addJobDescription);
  const addResumeVersion = useDataStore((s) => s.addResumeVersion);
  const resumes = useDataStore((s) => s.resumes);

  function handleComplete(result: { optimized: OptimizedResume; jobAnalysis: JobDescriptionAnalysis }) {
    if (!resumePayload || !jd) return;

    let masterResume = resumes.find((r) => r.isMaster);
    if (!masterResume) {
      masterResume = addResume({
        title: resumePayload.sourceFileName || "Master Resume",
        isMaster: true,
        sourceFileName: resumePayload.sourceFileName ?? undefined,
        sourceFileType: resumePayload.sourceFileType ?? undefined,
        rawText: resumePayload.rawText,
        resumeData: resumePayload.resumeData,
      });
    }

    const savedJd = addJobDescription({
      companyName: jd.companyName,
      jobTitle: jd.jobTitle,
      jobLocation: jd.jobLocation,
      companyWebsite: jd.companyWebsite,
      companyValues: jd.companyValues,
      rawText: jd.rawText,
      analysis: result.jobAnalysis,
    });

    const version = addResumeVersion({
      masterResumeId: masterResume.id,
      jobDescriptionId: savedJd.id,
      label: `${jd.jobTitle} @ ${jd.companyName}`,
      template: "classic",
      optimized: result.optimized,
      status: "draft",
    });

    router.push(`/resumes/${version.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Optimization</h1>
        <p className="mt-1 text-muted-foreground">Upload a resume, add the job, and let AI tailor it.</p>
      </div>

      <ol className="flex items-center gap-2 text-sm">
        {STEP_LABELS.map((s, i) => {
          const currentIdx = STEP_LABELS.findIndex((x) => x.key === step);
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  done && "bg-primary text-primary-foreground",
                  active && !done && "bg-primary/15 text-primary ring-2 ring-primary",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn(active ? "font-medium text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < STEP_LABELS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          );
        })}
      </ol>

      {step === "upload" && (
        <ResumeUploadStep
          onParsed={(payload) => {
            setResumePayload(payload);
            setStep("job");
          }}
        />
      )}

      {step === "job" && (
        <JobDescriptionStep onBack={() => setStep("upload")} onSubmit={(input) => {
          setJd(input);
          setStep("analyzing");
        }} />
      )}

      {step === "analyzing" && resumePayload && jd && (
        <AnalysisProgress
          request={{ resumeData: resumePayload.resumeData, jobDescription: jd } as AnalyzeRequest}
          onComplete={handleComplete}
          onRetry={() => setStep("job")}
        />
      )}
    </div>
  );
}
