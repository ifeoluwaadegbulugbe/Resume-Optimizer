"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { OptimizedResume, KeywordMatchResult, KeywordPriority } from "@/types/resume";

const PRIORITY_VARIANT: Record<KeywordPriority, "default" | "secondary" | "outline"> = {
  critical: "default",
  high: "default",
  medium: "secondary",
  low: "outline",
};

function KeywordRow({ kw }: { kw: KeywordMatchResult }) {
  return (
    <div className="space-y-1 border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{kw.keyword}</span>
        <Badge variant={PRIORITY_VARIANT[kw.priority]} className="capitalize">
          {kw.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{kw.whyItMatters}</p>
      {kw.whereItFits && (
        <p className="text-sm">
          <span className="font-medium text-foreground">Recommendation: </span>
          <span className="text-muted-foreground">{kw.whereItFits}</span>
        </p>
      )}
      {kw.foundIn && <p className="text-xs text-muted-foreground">Found in: {kw.foundIn}</p>}
    </div>
  );
}

export function KeywordCoverage({ optimized }: { optimized: OptimizedResume }) {
  const { matched, partial, missing, unsupported } = optimized.keywordCoverage;

  return (
    <Card>
      <CardContent className="p-5">
        <Tabs defaultValue="missing">
          <TabsList className="flex-wrap">
            <TabsTrigger value="matched">Matched ({matched.length})</TabsTrigger>
            <TabsTrigger value="partial">Partially matched ({partial.length})</TabsTrigger>
            <TabsTrigger value="missing">Missing ({missing.length})</TabsTrigger>
            <TabsTrigger value="unsupported">Unsupported ({unsupported.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="matched">
            {matched.length === 0 ? <EmptyState /> : matched.map((k, i) => <KeywordRow key={i} kw={k} />)}
          </TabsContent>
          <TabsContent value="partial">
            <p className="mb-2 text-sm text-muted-foreground">
              A related concept exists in your resume, but the exact terminology from the job description is
              missing.
            </p>
            {partial.length === 0 ? <EmptyState /> : partial.map((k, i) => <KeywordRow key={i} kw={k} />)}
          </TabsContent>
          <TabsContent value="missing">
            <p className="mb-2 text-sm text-muted-foreground">
              These keywords never appear in your resume. Only add ones you genuinely have experience with.
            </p>
            {missing.length === 0 ? <EmptyState /> : missing.map((k, i) => <KeywordRow key={i} kw={k} />)}
          </TabsContent>
          <TabsContent value="unsupported">
            <p className="mb-2 text-sm text-muted-foreground">
              The job wants this, but your resume doesn&apos;t provide evidence you have it. We will never
              fabricate this for you — consider whether it&apos;s worth addressing in a cover letter instead.
            </p>
            {unsupported.length === 0 ? <EmptyState /> : unsupported.map((k, i) => <KeywordRow key={i} kw={k} />)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Nothing here.</p>;
}
