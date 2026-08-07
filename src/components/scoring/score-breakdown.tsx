"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { OptimizedResume } from "@/types/resume";

export function ScoreBreakdown({ optimized }: { optimized: OptimizedResume }) {
  const { scores } = optimized;

  const pctRows = [
    { label: "Job Match", value: scores.jobMatch },
    { label: "Keyword Match", value: scores.keywordMatchPct },
    { label: "Required Skills", value: scores.requiredSkillsPct },
    { label: "Experience Relevance", value: scores.experienceRelevancePct },
    { label: "Culture Fit", value: scores.cultureFitPct },
    { label: "Achievement Strength", value: scores.achievementStrengthPct },
    { label: "ATS Compatibility", value: scores.atsCompatibilityPct },
    { label: "Resume Readability", value: scores.resumeReadabilityPct },
  ];

  const atsRows = [
    { label: "Keyword Match", ...scores.ats.keywordMatch },
    { label: "Required Qualifications", ...scores.ats.requiredQualifications },
    { label: "Skills Match", ...scores.ats.skillsMatch },
    { label: "Responsibility Alignment", ...scores.ats.responsibilityAlignment },
    { label: "ATS Structure", ...scores.ats.atsStructure },
    { label: "Semantic Relevance", ...scores.ats.semanticRelevance },
  ];

  const recruiterRows = [
    { label: "Relevance", ...scores.recruiter.relevance },
    { label: "Achievement Strength", ...scores.recruiter.achievementStrength },
    { label: "Experience Quality", ...scores.recruiter.experienceQuality },
    { label: "Clarity", ...scores.recruiter.clarity },
    { label: "Career Narrative", ...scores.recruiter.careerNarrative },
    { label: "Culture Fit", ...scores.recruiter.cultureFit },
    { label: "Credibility", ...scores.recruiter.credibility },
    { label: "Professional Presentation", ...scores.recruiter.professionalPresentation },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {pctRows.map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground">{row.value}%</span>
              </div>
              <Progress value={row.value} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ATS Score — {scores.ats.total}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {atsRows.map((row) => (
                <AccordionItem key={row.label} value={row.label}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex-1 text-left">{row.label}</span>
                    <span className="mr-2 text-muted-foreground">
                      {row.score}/{row.max}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {row.explanation}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recruiter Score — {scores.recruiter.total}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {recruiterRows.map((row) => (
                <AccordionItem key={row.label} value={row.label}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex-1 text-left">{row.label}</span>
                    <span className="mr-2 text-muted-foreground">
                      {row.score}/{row.max}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {row.explanation}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
