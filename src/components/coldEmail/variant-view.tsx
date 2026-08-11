"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Check, AlertTriangle, Star } from "lucide-react";
import { toast } from "sonner";
import type { ColdEmailVariant } from "@/types/coldEmail";
import { STRATEGY_LABELS } from "@/types/coldEmail";

const SCORE_ROWS: { key: keyof ColdEmailVariant["score"]; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "personalizationQuality", label: "Personalization Quality" },
  { key: "value", label: "Value" },
  { key: "credibility", label: "Credibility" },
  { key: "clarity", label: "Clarity" },
  { key: "brevity", label: "Brevity" },
  { key: "ctaFriction", label: "CTA Friction" },
  { key: "humanQuality", label: "Human Quality" },
  { key: "trust", label: "Trust" },
];

export function VariantView({ variant, isRecommended }: { variant: ColdEmailVariant; isRecommended: boolean }) {
  const [copied, setCopied] = useState(false);
  const bestSubject = [...variant.subjectLines].sort((a, b) => b.score - a.score)[0];

  async function handleCopy() {
    await navigator.clipboard.writeText(`Subject: ${bestSubject?.text ?? ""}\n\n${variant.body}`);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <Card className={isRecommended ? "border-primary/40" : undefined}>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{STRATEGY_LABELS[variant.strategy]}</Badge>
              {isRecommended && (
                <Badge className="gap-1">
                  <Star className="h-3 w-3" /> Recommended
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{variant.wordCount} words</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">{variant.score.total}/100</span>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subject lines
            </p>
            <div className="space-y-1.5">
              {[...variant.subjectLines]
                .sort((a, b) => b.score - a.score)
                .map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                    <span className="text-sm">{s.text}</span>
                    <span className="text-xs text-muted-foreground">{s.score}/100</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{variant.body}</p>
          </div>
        </CardContent>
      </Card>

      {variant.problems.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Problems detected
            </p>
            {variant.problems.map((p, i) => (
              <div key={i} className="rounded-md border border-border p-2.5 text-sm">
                <p className="font-medium">{p.issue}</p>
                <p className="text-muted-foreground">{p.detail}</p>
                <p className="mt-0.5 text-primary">{p.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="breakdown">
              <AccordionTrigger className="text-sm">Score breakdown</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {SCORE_ROWS.map((row) => {
                    const s = variant.score[row.key];
                    if (typeof s !== "object") return null;
                    return (
                      <div key={row.key} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{row.label}</span>
                          <span className="text-muted-foreground">
                            {s.score}/{s.max}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
