"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { ColdEmailInput, FollowUpMessage } from "@/types/coldEmail";

const ANGLE_LABELS: Record<FollowUpMessage["angle"], string> = {
  additional_observation: "Additional observation",
  useful_resource: "Useful resource",
  specific_example: "Specific example",
  breakup: "Breakup",
};

export function FollowUpPanel({
  input,
  originalSubject,
  originalBody,
  followUps,
  onAdd,
}: {
  input: ColdEmailInput;
  originalSubject: string;
  originalBody: string;
  followUps: FollowUpMessage[];
  onAdd: (f: FollowUpMessage) => void;
}) {
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/cold-email/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          originalSubject,
          originalBody,
          previousFollowUps: followUps,
          recipientReply: reply.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate follow-up.");
      onAdd(data.followUp);
      setReply("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate follow-up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-medium">Follow-ups</h3>
          <p className="text-sm text-muted-foreground">
            Each follow-up adds something new — never just &quot;checking in&quot;. Paste a reply if you got one,
            so the next message responds to it instead of repeating the pitch.
          </p>
        </div>

        {followUps.map((f) => (
          <FollowUpCard key={f.id} followUp={f} />
        ))}

        <div className="space-y-2">
          <Textarea
            placeholder="Paste the recipient's reply here (optional)…"
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button variant="outline" className="gap-1.5" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generate next follow-up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FollowUpCard({ followUp }: { followUp: FollowUpMessage }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`Subject: ${followUp.subject}\n\n${followUp.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <Badge variant="secondary">{ANGLE_LABELS[followUp.angle]}</Badge>
        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
        </Button>
      </div>
      <p className="text-sm font-medium">{followUp.subject}</p>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{followUp.body}</p>
    </div>
  );
}
