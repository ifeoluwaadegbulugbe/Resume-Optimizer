"use client";

import { cn } from "@/lib/utils";
import type { ResumeTemplate } from "@/types/resume";

const TEMPLATES: { key: ResumeTemplate; label: string }[] = [
  { key: "classic", label: "Classic" },
  { key: "modern", label: "Modern" },
  { key: "minimal", label: "Minimal" },
  { key: "professional", label: "Professional" },
  { key: "technical", label: "Technical" },
];

export function TemplateSelector({
  value,
  onChange,
}: {
  value: ResumeTemplate;
  onChange: (t: ResumeTemplate) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATES.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            value === t.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-accent"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
