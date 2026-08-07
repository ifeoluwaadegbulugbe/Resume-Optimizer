"use client";

import { use as usePromise, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, BriefcaseBusiness, RefreshCw, Loader2 } from "lucide-react";
import { ScoreHeader } from "@/components/scoring/score-header";
import { ScoreGateBanner } from "@/components/scoring/score-gate-banner";
import { ScoreBreakdown } from "@/components/scoring/score-breakdown";
import { KeywordCoverage } from "@/components/scoring/keyword-coverage";
import { RecruiterView } from "@/components/scoring/recruiter-view";
import { BeforeAfter } from "@/components/scoring/before-after";
import { ImproveScore } from "@/components/scoring/improve-score";
import { ResumeEditor } from "@/components/editor/resume-editor";
import { ExportToolbar } from "@/components/editor/export-toolbar";
import { ResumeChat } from "@/components/editor/resume-chat";
import { countWords } from "@/lib/ai/normalize";
import type { ResumeData, ResumeTemplate, ChatMessage, OptimizedResume } from "@/types/resume";
import { toast } from "sonner";

export default function ResumeVersionPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = usePromise(params);
  const router = useRouter();
  const mounted = useHydrated();

  const version = useDataStore((s) => s.resumeVersions.find((v) => v.id === versionId));
  const jobDescription = useDataStore((s) =>
    version ? s.jobDescriptions.find((j) => j.id === version.jobDescriptionId) : undefined
  );
  const masterResume = useDataStore((s) =>
    version ? s.resumes.find((r) => r.id === version.masterResumeId) : undefined
  );
  const updateResumeVersion = useDataStore((s) => s.updateResumeVersion);
  const addApplication = useDataStore((s) => s.addApplication);
  const applications = useDataStore((s) => s.applications);

  const [rescoring, setRescoring] = useState(false);

  // The editor is driven directly by the store — there is no local mirror
  // state to keep in sync, so edits just write straight through.
  function handleDataChange(next: ResumeData) {
    if (!version) return;
    updateResumeVersion(version.id, {
      optimized: { ...version.optimized, resumeData: next, wordCount: countWords(next) },
    });
  }

  function handleTemplateChange(next: ResumeTemplate) {
    if (!version) return;
    updateResumeVersion(version.id, { template: next });
  }

  function handleChatMessagesChange(messages: ChatMessage[]) {
    if (!version) return;
    updateResumeVersion(version.id, { chatMessages: messages });
  }

  async function handleRescore() {
    if (!version || !jobDescription?.analysis || !masterResume) return;
    setRescoring(true);
    try {
      const res = await fetch("/api/optimize/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalResumeData: masterResume.resumeData,
          currentResumeData: version.optimized.resumeData,
          jobAnalysis: jobDescription.analysis,
          previous: version.optimized,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rescore failed.");
      const optimized = data.optimized as OptimizedResume;
      updateResumeVersion(version.id, { optimized });
      toast.success(
        optimized.scoreGate.reached90
          ? "Both scores are 90+."
          : `ATS ${optimized.scores.ats.total} · Recruiter ${optimized.scores.recruiter.total}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rescore failed.");
    } finally {
      setRescoring(false);
    }
  }

  const alreadyTracked = version ? applications.some((a) => a.resumeVersionId === version.id) : false;

  function trackApplication() {
    if (!version || !jobDescription) return;
    addApplication({
      company: jobDescription.companyName,
      position: jobDescription.jobTitle,
      resumeVersionId: version.id,
      atsScore: version.optimized.scores.ats.total,
      recruiterScore: version.optimized.scores.recruiter.total,
      overallScore: version.optimized.scores.overall,
      status: "saved",
    });
    toast.success("Added to your application tracker.");
    router.push("/applications");
  }

  if (!mounted) return null;

  if (!version) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-medium">This resume version couldn&apos;t be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const { optimized } = version;
  const data = optimized.resumeData;
  const template = version.template;
  const errorIssues = optimized.validationIssues.filter((i) => i.severity === "error");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/resumes">
            <ArrowLeft className="h-4 w-4" /> All resumes
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={trackApplication} disabled={alreadyTracked}>
            <BriefcaseBusiness className="h-4 w-4" />
            {alreadyTracked ? "In application tracker" : "Track this application"}
          </Button>
          <ExportToolbar data={data} template={template} />
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{version.label}</h1>
        {jobDescription && (
          <p className="text-sm text-muted-foreground">
            {jobDescription.jobTitle} at {jobDescription.companyName}
            {jobDescription.jobLocation ? ` · ${jobDescription.jobLocation}` : ""}
          </p>
        )}
      </div>

      {errorIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Needs attention before export</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {errorIssues.map((i, idx) => (
                <li key={idx}>{i.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <ScoreHeader optimized={{ ...optimized, resumeData: data }} />
      {optimized.scoreGate && <ScoreGateBanner scoreGate={optimized.scoreGate} />}

      <Tabs defaultValue="editor">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="flex-wrap">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
            <TabsTrigger value="keywords">Keyword Coverage</TabsTrigger>
            <TabsTrigger value="recruiter">Recruiter View</TabsTrigger>
            <TabsTrigger value="changes">Before / After</TabsTrigger>
            <TabsTrigger value="improve">Improve Score</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleRescore}
            disabled={rescoring || !jobDescription?.analysis}
          >
            {rescoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Rescore
          </Button>
        </div>

        <TabsContent value="editor" className="pt-4">
          <ResumeEditor
            data={data}
            template={template}
            onTemplateChange={handleTemplateChange}
            onChange={handleDataChange}
            jd={jobDescription?.analysis ?? null}
          />
        </TabsContent>
        <TabsContent value="chat" className="pt-4">
          <ResumeChat
            originalResumeData={masterResume?.resumeData ?? data}
            currentResumeData={data}
            jd={jobDescription?.analysis ?? null}
            messages={version.chatMessages ?? []}
            onMessagesChange={handleChatMessagesChange}
            onResumeChange={handleDataChange}
          />
        </TabsContent>
        <TabsContent value="scores" className="pt-4">
          <ScoreBreakdown optimized={optimized} />
        </TabsContent>
        <TabsContent value="keywords" className="pt-4">
          <KeywordCoverage optimized={optimized} />
        </TabsContent>
        <TabsContent value="recruiter" className="pt-4">
          <RecruiterView optimized={optimized} />
        </TabsContent>
        <TabsContent value="changes" className="pt-4">
          <BeforeAfter optimized={optimized} />
        </TabsContent>
        <TabsContent value="improve" className="pt-4">
          <ImproveScore optimized={optimized} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
