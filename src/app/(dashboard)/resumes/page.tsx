"use client";

import Link from "next/link";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Star, Trash2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function ResumesPage() {
  const mounted = useHydrated();
  const resumes = useDataStore((s) => s.resumes);
  const versions = useDataStore((s) => s.resumeVersions);
  const setMasterResume = useDataStore((s) => s.setMasterResume);
  const deleteResume = useDataStore((s) => s.deleteResume);
  const deleteResumeVersion = useDataStore((s) => s.deleteResumeVersion);

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Resumes</h1>
          <p className="mt-1 text-muted-foreground">Your master resume and every job-specific version generated from it.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/optimize">
            <Plus className="h-4 w-4" /> New Optimization
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Master resume{resumes.length > 1 ? "s" : ""}</h2>
        {resumes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No resume uploaded yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {resumes.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(r.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {r.isMaster ? (
                    <Badge className="gap-1 shrink-0">
                      <Star className="h-3 w-3" /> Master
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => setMasterResume(r.id)}>
                      Set as master
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => {
                      deleteResume(r.id);
                      toast.success("Resume deleted.");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Job-specific versions</h2>
        {versions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No optimized versions yet — start a new optimization to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {versions.map((v) => (
              <Card key={v.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <Link href={`/resumes/${v.id}`} className="flex-1">
                    <p className="font-medium leading-tight">{v.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted px-2 py-1.5">
                        <div className="font-semibold">{v.optimized.scores.overall}</div>
                        <div className="text-[10px] text-muted-foreground">Overall</div>
                      </div>
                      <div className="rounded-md bg-muted px-2 py-1.5">
                        <div className="font-semibold">{v.optimized.scores.ats.total}</div>
                        <div className="text-[10px] text-muted-foreground">ATS</div>
                      </div>
                      <div className="rounded-md bg-muted px-2 py-1.5">
                        <div className="font-semibold">{v.optimized.scores.recruiter.total}</div>
                        <div className="text-[10px] text-muted-foreground">Recruiter</div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between">
                    <Badge variant={v.status === "final" ? "default" : "secondary"}>{v.status}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        deleteResumeVersion(v.id);
                        toast.success("Version deleted.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
