"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadCloud, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useDataStore } from "@/lib/data/store";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

export interface ParsedResumePayload {
  resumeData: ResumeData;
  rawText: string;
  sourceFileName?: string | null;
  sourceFileType?: string | null;
}

export function ResumeUploadStep({ onParsed }: { onParsed: (payload: ParsedResumePayload) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumes = useDataStore((s) => s.resumes);

  async function parseFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse resume.");
      onParsed({
        resumeData: data.resumeData,
        rawText: data.rawText,
        sourceFileName: data.sourceFileName,
        sourceFileType: data.sourceFileType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse resume.");
    } finally {
      setLoading(false);
    }
  }

  async function parseText(text: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse resume.");
      onParsed({ resumeData: data.resumeData, rawText: data.rawText, sourceFileType: "pasted" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse resume.");
    } finally {
      setLoading(false);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Upload file</TabsTrigger>
          <TabsTrigger value="paste">Paste text</TabsTrigger>
          {resumes.length > 0 && <TabsTrigger value="existing">Use saved resume</TabsTrigger>}
        </TabsList>

        <TabsContent value="upload">
          <Card
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed transition-colors",
              dragOver ? "border-primary bg-accent/40" : "border-border"
            )}
          >
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              {loading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium">Reading your resume…</p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="font-medium">Drag & drop your resume here</p>
                  <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT — up to 8MB</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-2">
                    Browse files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) parseFile(file);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste">
          <Card>
            <CardContent className="space-y-3 p-4">
              <Textarea
                placeholder="Paste your full resume text here…"
                rows={12}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={() => parseText(pastedText)}
                disabled={loading || pastedText.trim().length < 30}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {resumes.length > 0 && (
          <TabsContent value="existing">
            <div className="grid gap-3 sm:grid-cols-2">
              {resumes.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    onParsed({
                      resumeData: r.resumeData,
                      rawText: r.rawText ?? "",
                      sourceFileName: r.sourceFileName,
                      sourceFileType: r.sourceFileType,
                    })
                  }
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title}</p>
                      {r.isMaster && (
                        <p className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Master resume
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
