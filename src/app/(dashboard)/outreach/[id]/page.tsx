"use client";

import { use as usePromise } from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { VariantView } from "@/components/coldEmail/variant-view";
import { FollowUpPanel } from "@/components/coldEmail/follow-up-panel";
import { STRATEGY_LABELS } from "@/types/coldEmail";

export default function OutreachResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const mounted = useHydrated();
  const record = useDataStore((s) => s.coldEmails.find((c) => c.id === id));
  const addFollowUpToColdEmail = useDataStore((s) => s.addFollowUpToColdEmail);

  if (!mounted) return null;

  if (!record) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-medium">This outreach email couldn&apos;t be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/outreach">Back to outreach</Link>
        </Button>
      </div>
    );
  }

  const { result } = record;

  if (result.insufficientInfo) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/outreach">
            <ArrowLeft className="h-4 w-4" /> All outreach
          </Link>
        </Button>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not enough to work with yet</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{result.insufficientInfo.reason}</p>
            {result.insufficientInfo.questionsToAsk.length > 0 && (
              <ul className="list-inside list-disc space-y-1">
                {result.insufficientInfo.questionsToAsk.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/outreach/new">Add more detail and try again</Link>
        </Button>
      </div>
    );
  }

  const recommended = result.variants.find((v) => v.id === result.recommendedVariantId) ?? result.variants[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" className="gap-1.5" asChild>
        <Link href="/outreach">
          <ArrowLeft className="h-4 w-4" /> All outreach
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-semibold">{record.label}</h1>
        <p className="text-sm text-muted-foreground">
          {record.input.recipientRole} at {record.input.recipientCompany}
        </p>
      </div>

      <Card className={result.scoreGate.reached90 ? "border-primary/30 bg-primary/5" : undefined}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            {result.scoreGate.reached90 ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="font-medium">
                {result.scoreGate.reached90
                  ? "Recommended variant reached 90+"
                  : `Best truthful score: ${recommended?.score.total ?? 0}/100`}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.recommendationReason} · {result.scoreGate.iterations} pass
                {result.scoreGate.iterations === 1 ? "" : "es"}
              </p>
            </div>
          </div>
          {!result.scoreGate.reached90 && result.scoreGate.limitingFactors.length > 0 && (
            <div className="max-w-md text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Why not higher:</p>
              <ul className="list-inside list-disc">
                {result.scoreGate.limitingFactors.slice(0, 3).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue={recommended?.id}>
        <TabsList className="flex-wrap">
          {[...result.variants]
            .sort((a, b) => b.score.total - a.score.total)
            .map((v) => (
              <TabsTrigger key={v.id} value={v.id} className="gap-1.5">
                {STRATEGY_LABELS[v.strategy]}
                <Badge variant="secondary" className="ml-1">
                  {v.score.total}
                </Badge>
              </TabsTrigger>
            ))}
        </TabsList>
        {result.variants.map((v) => (
          <TabsContent key={v.id} value={v.id} className="pt-4">
            <VariantView variant={v} isRecommended={v.id === result.recommendedVariantId} />
          </TabsContent>
        ))}
      </Tabs>

      {recommended && (
        <FollowUpPanel
          input={record.input}
          originalSubject={[...recommended.subjectLines].sort((a, b) => b.score - a.score)[0]?.text ?? ""}
          originalBody={recommended.body}
          followUps={record.followUps}
          onAdd={(f) => addFollowUpToColdEmail(record.id, f)}
        />
      )}
    </div>
  );
}
