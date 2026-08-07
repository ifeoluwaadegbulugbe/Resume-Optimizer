"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface JobDescriptionInput {
  rawText: string;
  companyName: string;
  jobTitle: string;
  jobLocation: string;
  companyWebsite?: string;
  companyValues?: string;
}

export function JobDescriptionStep({
  initial,
  onBack,
  onSubmit,
}: {
  initial?: Partial<JobDescriptionInput>;
  onBack: () => void;
  onSubmit: (jd: JobDescriptionInput) => void;
}) {
  const [rawText, setRawText] = useState(initial?.rawText ?? "");
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [jobLocation, setJobLocation] = useState(initial?.jobLocation ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(initial?.companyWebsite ?? "");
  const [companyValues, setCompanyValues] = useState(initial?.companyValues ?? "");

  const canSubmit = rawText.trim().length > 50 && companyName.trim() && jobTitle.trim();

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Stripe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Frontend Developer" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobLocation">Location</Label>
            <Input id="jobLocation" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g. Remote (US)" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyWebsite">Company website (optional)</Label>
            <Input id="companyWebsite" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyValues">Company values / culture info (optional)</Label>
          <Textarea
            id="companyValues"
            rows={2}
            value={companyValues}
            onChange={(e) => setCompanyValues(e.target.value)}
            placeholder="Anything you know about how this team works — mission, values, engineering culture…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rawText">Job description</Label>
          <Textarea
            id="rawText"
            rows={14}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the complete job description here…"
          />
          <p className="text-xs text-muted-foreground">{rawText.trim().split(/\s+/).filter(Boolean).length} words</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({ rawText, companyName, jobTitle, jobLocation, companyWebsite, companyValues })
            }
            className="gap-2"
          >
            Analyze & optimize <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
