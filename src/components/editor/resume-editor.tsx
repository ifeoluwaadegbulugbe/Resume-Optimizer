"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import { BulletEditor } from "./bullet-editor";
import { WordCountBar } from "./word-count-bar";
import { TemplateSelector } from "./template-selector";
import type { ResumeData, ResumeTemplate, ExperienceEntry, ProjectEntry, ExperienceBullet, JobDescriptionAnalysis } from "@/types/resume";
import { countWords } from "@/lib/ai/normalize";
import { randomUUID } from "@/lib/utils/uuid";

function newBullet(text = "New achievement — describe the result and how you drove it."): ExperienceBullet {
  return { id: randomUUID(), text, originalText: text, isEdited: false, isLocked: false, keywordsUsed: [], hasUnsupportedClaim: false };
}

export function ResumeEditor({
  data,
  template,
  onTemplateChange,
  onChange,
  jd,
}: {
  data: ResumeData;
  template: ResumeTemplate;
  onTemplateChange: (t: ResumeTemplate) => void;
  onChange: (next: ResumeData) => void;
  jd: JobDescriptionAnalysis | null;
}) {
  const wordCount = countWords(data);

  function patch(partial: Partial<ResumeData>) {
    onChange({ ...data, ...partial });
  }

  function updateExperience(id: string, patchFn: (e: ExperienceEntry) => ExperienceEntry) {
    patch({ experience: data.experience.map((e) => (e.id === id ? patchFn(e) : e)) });
  }

  function updateProject(id: string, patchFn: (p: ProjectEntry) => ProjectEntry) {
    patch({ projects: data.projects.map((p) => (p.id === id ? patchFn(p) : p)) });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <WordCountBar count={wordCount} />
          <div>
            <p className="mb-2 text-sm font-medium">Template</p>
            <TemplateSelector value={template} onChange={onTemplateChange} />
          </div>
        </CardContent>
      </Card>

      {/* Header / contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["linkedin", "LinkedIn"],
              ["portfolio", "Portfolio"],
              ["github", "GitHub"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                value={data.contact[key]}
                onChange={(e) => patch({ contact: { ...data.contact, [key]: e.target.value } })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} value={data.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Skills</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => patch({ skillGroups: [...data.skillGroups, { id: randomUUID(), label: "New Group", skills: [] }] })}
          >
            <Plus className="h-3.5 w-3.5" /> Add group
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.skillGroups.map((g) => (
            <div key={g.id} className="flex items-start gap-3">
              <Input
                className="w-40 shrink-0"
                value={g.label}
                onChange={(e) =>
                  patch({ skillGroups: data.skillGroups.map((x) => (x.id === g.id ? { ...x, label: e.target.value } : x)) })
                }
              />
              <Input
                className="flex-1"
                value={g.skills.join(", ")}
                onChange={(e) =>
                  patch({
                    skillGroups: data.skillGroups.map((x) =>
                      x.id === g.id ? { ...x, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x
                    ),
                  })
                }
                placeholder="Comma-separated skills"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => patch({ skillGroups: data.skillGroups.filter((x) => x.id !== g.id) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Professional Experience</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() =>
              patch({
                experience: [
                  ...data.experience,
                  {
                    id: randomUUID(),
                    company: "Company",
                    title: "Title",
                    location: "",
                    startDate: "",
                    endDate: "Present",
                    bullets: [newBullet()],
                    relevanceScore: 0,
                    isLocked: false,
                  },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add role
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.experience.map((entry) => (
            <div key={entry.id} className="space-y-3 rounded-lg border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={entry.company}
                  placeholder="Company"
                  onChange={(e) => updateExperience(entry.id, (x) => ({ ...x, company: e.target.value }))}
                />
                <Input
                  value={entry.title}
                  placeholder="Job title"
                  onChange={(e) => updateExperience(entry.id, (x) => ({ ...x, title: e.target.value }))}
                />
                <Input
                  value={entry.location}
                  placeholder="Location"
                  onChange={(e) => updateExperience(entry.id, (x) => ({ ...x, location: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Input
                    value={entry.startDate}
                    placeholder="Start"
                    onChange={(e) => updateExperience(entry.id, (x) => ({ ...x, startDate: e.target.value }))}
                  />
                  <Input
                    value={entry.endDate}
                    placeholder="End"
                    onChange={(e) => updateExperience(entry.id, (x) => ({ ...x, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                {entry.bullets.map((b) => (
                  <BulletEditor
                    key={b.id}
                    bullet={b}
                    roleContext={`${entry.title} at ${entry.company}`}
                    jd={jd}
                    disabled={entry.isLocked}
                    onChange={(next) =>
                      updateExperience(entry.id, (x) => ({
                        ...x,
                        bullets: x.bullets.map((bb) => (bb.id === next.id ? next : bb)),
                      }))
                    }
                    onRemove={() =>
                      updateExperience(entry.id, (x) => ({ ...x, bullets: x.bullets.filter((bb) => bb.id !== b.id) }))
                    }
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  disabled={entry.isLocked}
                  onClick={() => updateExperience(entry.id, (x) => ({ ...x, bullets: [...x.bullets, newBullet()] }))}
                >
                  <Plus className="h-3.5 w-3.5" /> Add bullet
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => updateExperience(entry.id, (x) => ({ ...x, isLocked: !x.isLocked }))}
                  >
                    {entry.isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                    {entry.isLocked ? "Locked" : "Lock section"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => patch({ experience: data.experience.filter((x) => x.id !== entry.id) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projects */}
      {data.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.projects.map((p) => (
              <div key={p.id} className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <Input
                    value={p.name}
                    placeholder="Project name"
                    onChange={(e) => updateProject(p.id, (x) => ({ ...x, name: e.target.value }))}
                  />
                  <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={p.include} onCheckedChange={(v) => updateProject(p.id, (x) => ({ ...x, include: Boolean(v) }))} />
                    Include
                  </label>
                </div>
                <Textarea
                  rows={2}
                  value={p.description}
                  onChange={(e) => updateProject(p.id, (x) => ({ ...x, description: e.target.value }))}
                />
                <div className="space-y-1">
                  {p.bullets.map((b) => (
                    <BulletEditor
                      key={b.id}
                      bullet={b}
                      roleContext={p.name}
                      jd={jd}
                      onChange={(next) =>
                        updateProject(p.id, (x) => ({ ...x, bullets: x.bullets.map((bb) => (bb.id === next.id ? next : bb)) }))
                      }
                      onRemove={() => updateProject(p.id, (x) => ({ ...x, bullets: x.bullets.filter((bb) => bb.id !== b.id) }))}
                    />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.education.map((ed) => (
            <div key={ed.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
              <Input
                value={ed.institution}
                placeholder="Institution"
                onChange={(e) =>
                  patch({ education: data.education.map((x) => (x.id === ed.id ? { ...x, institution: e.target.value } : x)) })
                }
              />
              <Input
                value={ed.degree}
                placeholder="Degree"
                onChange={(e) =>
                  patch({ education: data.education.map((x) => (x.id === ed.id ? { ...x, degree: e.target.value } : x)) })
                }
              />
              <div className="flex gap-2">
                <Input
                  value={ed.startDate}
                  placeholder="Start"
                  onChange={(e) =>
                    patch({ education: data.education.map((x) => (x.id === ed.id ? { ...x, startDate: e.target.value } : x)) })
                  }
                />
                <Input
                  value={ed.endDate}
                  placeholder="End"
                  onChange={(e) =>
                    patch({ education: data.education.map((x) => (x.id === ed.id ? { ...x, endDate: e.target.value } : x)) })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={ed.includeGpa}
                  onCheckedChange={(v) =>
                    patch({ education: data.education.map((x) => (x.id === ed.id ? { ...x, includeGpa: Boolean(v) } : x)) })
                  }
                />
                Include GPA {ed.gpa ? `(${ed.gpa})` : ""}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
