"use client";

import Link from "next/link";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function OutreachListPage() {
  const mounted = useHydrated();
  const coldEmails = useDataStore((s) => s.coldEmails);
  const deleteColdEmail = useDataStore((s) => s.deleteColdEmail);

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cold Outreach</h1>
          <p className="mt-1 text-muted-foreground">
            Short, specific emails aimed at getting a reply — scored for reply probability, not open rate.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/outreach/new">
            <Plus className="h-4 w-4" /> New outreach email
          </Link>
        </Button>
      </div>

      {coldEmails.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Mail className="h-6 w-6" />
            </div>
            <p className="font-medium">No outreach emails yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tell us who you&apos;re contacting and why, and we&apos;ll draft a few strategically different,
              scored variants.
            </p>
            <Button asChild className="mt-2">
              <Link href="/outreach/new">New outreach email</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...coldEmails]
            .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
            .map((c) => {
              const best = c.result.variants.length
                ? Math.max(...c.result.variants.map((v) => v.score.total))
                : null;
              return (
                <Card key={c.id} className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <Link href={`/outreach/${c.id}`} className="flex-1">
                      <p className="font-medium leading-tight">{c.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {best !== null ? (
                          <Badge variant={best >= 90 ? "default" : "secondary"}>{best}/100</Badge>
                        ) : (
                          <Badge variant="outline">Needs more info</Badge>
                        )}
                        {c.followUps.length > 0 && (
                          <Badge variant="outline">
                            {c.followUps.length} follow-up{c.followUps.length === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>
                    </Link>
                    <div className="flex justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          deleteColdEmail(c.id);
                          toast.success("Deleted.");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
