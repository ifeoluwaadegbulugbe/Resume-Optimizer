"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ArrowRight } from "lucide-react";
import { randomUUID } from "@/lib/utils/uuid";
import type {
  ColdEmailInput,
  OutreachPurpose,
  OutreachTone,
  RecipientType,
  PersonalizationSignal,
} from "@/types/coldEmail";

const PURPOSES: { value: OutreachPurpose; label: string }[] = [
  { value: "job_opportunity", label: "Job opportunity" },
  { value: "sales", label: "Sales" },
  { value: "partnership", label: "Partnership" },
  { value: "networking", label: "Networking" },
  { value: "freelance", label: "Freelance opportunity" },
  { value: "investor_outreach", label: "Investor outreach" },
  { value: "collaboration", label: "Collaboration" },
  { value: "introduction", label: "Introduction" },
  { value: "other", label: "Other" },
];

const RECIPIENT_TYPES: { value: RecipientType; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring manager" },
  { value: "executive", label: "Executive" },
  { value: "potential_client", label: "Potential client" },
  { value: "other", label: "Other" },
];

const TONES: OutreachTone[] = ["direct", "warm", "professional", "casual", "confident", "curious", "concise"];

const DEFAULT_INPUT: ColdEmailInput = {
  recipientName: "",
  recipientRole: "",
  recipientCompany: "",
  recipientLinkedIn: "",
  recipientType: "hiring_manager",
  senderName: "",
  senderRole: "",
  senderCompany: "",
  purpose: "job_opportunity",
  whatSenderWants: "",
  whatSenderOffers: "",
  relevantProof: "",
  mutualConnection: "",
  previousInteraction: "",
  jobPosting: "",
  specificReason: "",
  signals: [],
  tone: "direct",
  personalizationDepth: "standard",
  offerAlreadyPrepared: false,
  personalStory: "",
  senderCredentialLine: "",
};

export function ColdEmailIntakeForm({ onSubmit }: { onSubmit: (input: ColdEmailInput) => void }) {
  const [form, setForm] = useState<ColdEmailInput>(DEFAULT_INPUT);
  const [signalDraft, setSignalDraft] = useState({ text: "", source: "" });

  function patch(p: Partial<ColdEmailInput>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function addSignal() {
    if (!signalDraft.text.trim()) return;
    const signal: PersonalizationSignal = {
      id: randomUUID(),
      text: signalDraft.text.trim(),
      source: signalDraft.source.trim() || "You",
      approved: true,
    };
    patch({ signals: [...form.signals, signal] });
    setSignalDraft({ text: "", source: "" });
  }

  function removeSignal(id: string) {
    patch({ signals: form.signals.filter((s) => s.id !== id) });
  }

  const canSubmit =
    form.recipientName.trim() &&
    form.recipientRole.trim() &&
    form.recipientCompany.trim() &&
    form.senderName.trim() &&
    form.whatSenderWants.trim() &&
    form.whatSenderOffers.trim();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who are you contacting?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Recipient name</Label>
            <Input value={form.recipientName} onChange={(e) => patch({ recipientName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Recipient role</Label>
            <Input value={form.recipientRole} onChange={(e) => patch({ recipientRole: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={form.recipientCompany} onChange={(e) => patch({ recipientCompany: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Recipient LinkedIn (optional)</Label>
            <Input value={form.recipientLinkedIn} onChange={(e) => patch({ recipientLinkedIn: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Recipient type</Label>
            <Select value={form.recipientType} onValueChange={(v) => patch({ recipientType: v as RecipientType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who are you?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Your name</Label>
            <Input value={form.senderName} onChange={(e) => patch({ senderName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Your role</Label>
            <Input value={form.senderRole} onChange={(e) => patch({ senderRole: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Your company (optional)</Label>
            <Input value={form.senderCompany} onChange={(e) => patch({ senderCompany: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Credentials / signature line (optional)</Label>
            <Input
              placeholder="e.g. Senior ESG Analyst at Skalable | LinkedIn"
              value={form.senderCredentialLine}
              onChange={(e) => patch({ senderCredentialLine: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why are you reaching out?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Select value={form.purpose} onValueChange={(v) => patch({ purpose: v as OutreachPurpose })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>What do you want from this email?</Label>
            <Textarea
              rows={2}
              placeholder="e.g. 15 minutes to discuss the frontend role"
              value={form.whatSenderWants}
              onChange={(e) => patch({ whatSenderWants: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>What can you offer them?</Label>
            <Textarea
              rows={2}
              placeholder="e.g. a short teardown of their onboarding flow, or a specific relevant example of your work"
              value={form.whatSenderOffers}
              onChange={(e) => patch({ whatSenderOffers: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={form.offerAlreadyPrepared}
                onCheckedChange={(v) => patch({ offerAlreadyPrepared: Boolean(v) })}
              />
              I&apos;ve already prepared this — not just proposing it
            </label>
            {form.offerAlreadyPrepared && (
              <p className="text-xs text-muted-foreground">
                The strongest cold emails we&apos;ve seen lead with completed work (&quot;I built a dashboard
                using your data...&quot;) rather than an offer to build one — this tells the writer to phrase it
                that way.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Relevant proof (a real number, named client, or specific result)</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Helped a Lagos fintech reduce onboarding time by 23%"
              value={form.relevantProof}
              onChange={(e) => patch({ relevantProof: e.target.value })}
            />
          </div>
          {form.purpose === "job_opportunity" && (
            <div className="space-y-1.5">
              <Label>Job posting text (optional, helps target the email)</Label>
              <Textarea rows={4} value={form.jobPosting} onChange={(e) => patch({ jobPosting: e.target.value })} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Mutual connection (optional)</Label>
              <Input value={form.mutualConnection} onChange={(e) => patch({ mutualConnection: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Previous interaction (optional)</Label>
              <Input
                value={form.previousInteraction}
                onChange={(e) => patch({ previousInteraction: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Specific reason for reaching out now (optional)</Label>
            <Input value={form.specificReason} onChange={(e) => patch({ specificReason: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>A real personal story connecting you to this, if there is one (optional)</Label>
            <Textarea
              rows={3}
              placeholder="A genuine, specific experience that explains why this matters to you — the highest-performing example we studied was a job-seeker email built entirely around one true story."
              value={form.personalStory}
              onChange={(e) => patch({ personalStory: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What do you already know about them?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This app doesn&apos;t browse the web for you — add specific facts you already know (a post you saw, a
            launch you read about, a job posting detail). Only what you add here will be used; nothing is
            invented.
          </p>
          <div className="space-y-2">
            {form.signals.map((s) => (
              <div key={s.id} className="flex items-start gap-2 rounded-md border border-border p-2.5">
                <div className="flex-1">
                  <p className="text-sm">{s.text}</p>
                  <p className="text-xs text-muted-foreground">Source: {s.source}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSignal(s.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="What you noticed (e.g. 'Posted about their onboarding redesign last week')"
              value={signalDraft.text}
              onChange={(e) => setSignalDraft((d) => ({ ...d, text: e.target.value }))}
            />
            <Input
              placeholder="Source (e.g. LinkedIn post)"
              className="sm:w-48"
              value={signalDraft.source}
              onChange={(e) => setSignalDraft((d) => ({ ...d, source: e.target.value }))}
            />
            <Button variant="outline" onClick={addSignal} className="gap-1 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Style</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <Badge
                  key={t}
                  variant={form.tone === t ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => patch({ tone: t })}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Personalization depth</Label>
            <Select
              value={form.personalizationDepth}
              onValueChange={(v) => patch({ personalizationDepth: v as ColdEmailInput["personalizationDepth"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light — 1 detail</SelectItem>
                <SelectItem value="standard">Standard — 2-3 details</SelectItem>
                <SelectItem value="deep">Deep — research-heavy, one strong insight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={!canSubmit} onClick={() => onSubmit(form)} className="gap-2">
          Generate emails <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
