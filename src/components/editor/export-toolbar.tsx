"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { resumeToPlainText } from "@/lib/export/toPlainText";

async function downloadFile(url: string, body: unknown, fallbackName: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Export failed.");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  const fileName = match?.[1] || fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export function ExportToolbar({ data, template }: { data: ResumeData; template: ResumeTemplate }) {
  const [loading, setLoading] = useState<"pdf" | "docx" | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleExport(kind: "pdf" | "docx") {
    setLoading(kind);
    try {
      await downloadFile(`/api/export/${kind}`, { resumeData: data, template }, `resume.${kind}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(resumeToPlainText(data));
    setCopied(true);
    toast.success("Resume text copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="gap-2" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        Copy Resume Text
      </Button>
      <Button variant="outline" className="gap-2" onClick={() => handleExport("docx")} disabled={loading !== null}>
        {loading === "docx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download DOCX
      </Button>
      <Button className="gap-2" onClick={() => handleExport("pdf")} disabled={loading !== null}>
        {loading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download PDF
      </Button>
    </div>
  );
}
