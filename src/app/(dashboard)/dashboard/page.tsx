"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Target, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const mounted = useHydrated();
  const resumes = useDataStore((s) => s.resumes);
  const versions = useDataStore((s) => s.resumeVersions);
  const jobDescriptions = useDataStore((s) => s.jobDescriptions);

  const master = resumes.find((r) => r.isMaster);

  const recent = useMemo(
    () =>
      [...versions]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 6),
    [versions]
  );

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Good {timeOfDayGreeting()}!</h1>
        <p className="mt-1 text-muted-foreground">
          {master
            ? "Ready to tailor your resume for the next role?"
            : "Upload your resume to get started with your first job-specific optimization."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Master resume" value={master ? "Uploaded" : "Not set"} icon={FileText} />
        <StatCard label="Optimized versions" value={String(versions.length)} icon={Sparkles} />
        <StatCard label="Saved job descriptions" value={String(jobDescriptions.length)} icon={Target} />
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-accent/40 to-transparent">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Optimize your resume for a new job</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Paste a job description and let the AI pipeline tailor your resume — ATS score, recruiter score,
              keyword coverage, and an editable, export-ready resume in minutes.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 shrink-0">
            <Link href="/optimize">
              Start optimizing <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Optimizations</h2>
          {versions.length > 0 && (
            <Link href="/resumes" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="font-medium">No optimizations yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload a resume and a job description to generate your first tailored, scored resume.
              </p>
              <Button asChild className="mt-2">
                <Link href="/optimize">Start optimizing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((v) => (
              <Link key={v.id} href={`/resumes/${v.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium leading-tight">{v.label}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant={v.status === "final" ? "default" : "secondary"}>{v.status}</Badge>
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs">
                      <ScorePill label="Overall" value={v.optimized.scores.overall} />
                      <ScorePill label="ATS" value={v.optimized.scores.ats.total} />
                      <ScorePill label="Recruiter" value={v.optimized.scores.recruiter.total} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof FileText }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <div className="font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
